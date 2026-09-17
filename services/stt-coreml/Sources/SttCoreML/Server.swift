import Foundation
@preconcurrency import NIO
import NIOFoundationCompat

import FluidAudio

final class SttServer: Sendable {
    let socketPath: String
    let tcpHost: String?
    let tcpPort: Int
    let backends: [String: any SttBackend]
    let defaultEngine: String
    let models: AsrModels

    init(socketPath: String, tcpHost: String? = nil, tcpPort: Int = 9009, backends: [any SttBackend], models: AsrModels) {
        var map: [String: any SttBackend] = [:]
        for b in backends { map[b.engineName] = b }
        self.backends = map
        self.defaultEngine = backends.first!.engineName
        self.socketPath = socketPath
        self.tcpHost = tcpHost
        self.tcpPort = tcpPort
        self.models = models
    }

    func run() async throws {
        try? FileManager.default.removeItem(atPath: socketPath)

        let group = MultiThreadedEventLoopGroup(numberOfThreads: 2)
        let server = self

        let childInit: @Sendable (Channel) -> EventLoopFuture<Void> = { channel in
            channel.pipeline.addHandlers([
                ByteToMessageHandler(LengthPrefixDecoder()),
                LengthPrefixEncoder(),
                RequestHandler(server: server),
            ])
        }

        let unixBootstrap = ServerBootstrap(group: group)
            .serverChannelOption(.backlog, value: 8)
            .childChannelInitializer(childInit)

        let unixChannel = try await unixBootstrap.bind(unixDomainSocketPath: socketPath).get()
        log("Listening on \(socketPath)")

        var tcpChannel: Channel? = nil
        if let host = tcpHost {
            let tcpBootstrap = ServerBootstrap(group: group)
                .serverChannelOption(.backlog, value: 8)
                .childChannelInitializer(childInit)
            tcpChannel = try await tcpBootstrap.bind(host: host, port: tcpPort).get()
            log("Listening on \(host):\(tcpPort)")
        }

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            let resumed = LockedBool()
            let sigint = DispatchSource.makeSignalSource(signal: SIGINT, queue: .main)
            let sigterm = DispatchSource.makeSignalSource(signal: SIGTERM, queue: .main)
            signal(SIGINT, SIG_IGN)
            signal(SIGTERM, SIG_IGN)
            sigint.setEventHandler {
                if resumed.testAndSet() { cont.resume() }
            }
            sigterm.setEventHandler {
                if resumed.testAndSet() { cont.resume() }
            }
            sigint.resume()
            sigterm.resume()
        }

        try await unixChannel.close()
        if let tc = tcpChannel { try await tc.close() }
        try await group.shutdownGracefully()
        try? FileManager.default.removeItem(atPath: socketPath)
        log("Shut down")
    }

    func handle(_ request: SttRequest) async -> SttResponse {
        switch request.action {
        case .ping:
            return .pong

        case .transcribe:
            guard let audioB64 = request.audio,
                  let audioData = Data(base64Encoded: audioB64)
            else {
                return .error("Missing or invalid base64 audio field")
            }

            let engineName = request.engine ?? defaultEngine
            guard let backend = backends[engineName] else {
                return .error("Unknown engine: \(engineName). Available: \(backends.keys.sorted().joined(separator: ", "))")
            }

            let sampleRate = request.sampleRate ?? 16000
            do {
                let result = try await backend.transcribe(audio: audioData, sampleRate: sampleRate)
                return .result(result)
            } catch {
                return .error(error.localizedDescription)
            }

        case .streamStart, .streamAudio, .streamEnd:
            return .error("Streaming actions are handled by the connection handler")
        }
    }
}

// MARK: - Length-prefix framing (4-byte big-endian)

private struct LengthPrefixDecoder: ByteToMessageDecoder {
    typealias InboundOut = ByteBuffer

    mutating func decode(context: ChannelHandlerContext, buffer: inout ByteBuffer) throws -> DecodingState {
        guard buffer.readableBytes >= 4 else { return .needMoreData }
        let length = buffer.getInteger(at: buffer.readerIndex, as: UInt32.self)!
        let frameLength = Int(length)
        guard buffer.readableBytes >= 4 + frameLength else { return .needMoreData }
        buffer.moveReaderIndex(forwardBy: 4)
        let frame = buffer.readSlice(length: frameLength)!
        context.fireChannelRead(wrapInboundOut(frame))
        return .continue
    }
}

private final class LengthPrefixEncoder: ChannelOutboundHandler, @unchecked Sendable {
    typealias OutboundIn = ByteBuffer
    typealias OutboundOut = ByteBuffer

    func write(context: ChannelHandlerContext, data: NIOAny, promise: EventLoopPromise<Void>?) {
        let payload = unwrapOutboundIn(data)
        var header = context.channel.allocator.buffer(capacity: 4 + payload.readableBytes)
        header.writeInteger(UInt32(payload.readableBytes))
        header.writeImmutableBuffer(payload)
        context.write(wrapOutboundOut(header), promise: promise)
    }
}

// MARK: - Request handler

private final class RequestHandler: ChannelInboundHandler, @unchecked Sendable {
    typealias InboundIn = ByteBuffer
    typealias OutboundOut = ByteBuffer

    let server: SttServer
    private let jsonDecoder = JSONDecoder()
    private let jsonEncoder = JSONEncoder()
    private var streamingSession: StreamingSession?
    private var eouStreamingSession: EouStreamingSession?

    init(server: SttServer) {
        self.server = server
    }

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        var buf = unwrapInboundIn(data)
        guard let bytes = buf.readBytes(length: buf.readableBytes) else {
            writeResponse(.error("Empty request"), context: context)
            return
        }

        let request: SttRequest
        do {
            request = try jsonDecoder.decode(SttRequest.self, from: Data(bytes))
        } catch {
            writeResponse(.error("Invalid JSON: \(error.localizedDescription)"), context: context)
            return
        }

        let eventLoop = context.eventLoop
        nonisolated(unsafe) let ctx = context

        switch request.action {
        case .streamStart:
            let useEou = request.engine == "parakeet-eou"
            let models = server.models
            let chunkSeconds = request.chunkSeconds ?? 3.0
            Task { @Sendable in
                do {
                    let writeback: @Sendable (SttResponse) -> Void = { [self] response in
                        eventLoop.execute {
                            self.writeResponse(response, context: ctx)
                        }
                    }
                    if useEou {
                        let session = try await EouStreamingSession(
                            variant: .parakeetEou320ms,
                            onUpdate: writeback
                        )
                        self.eouStreamingSession = session
                    } else {
                        let session = try await StreamingSession(
                            models: models,
                            chunkSeconds: chunkSeconds,
                            onUpdate: writeback
                        )
                        self.streamingSession = session
                    }
                } catch {
                    eventLoop.execute { [self] in
                        self.writeResponse(.error("Failed to start stream: \(error.localizedDescription)"), context: ctx)
                    }
                }
            }

        case .streamAudio:
            guard let audioB64 = request.audio,
                  let audioData = Data(base64Encoded: audioB64) else {
                writeResponse(.error("Missing audio in streamAudio"), context: context)
                return
            }
            if let eou = eouStreamingSession {
                Task { @Sendable in await eou.feedAudio(audioData) }
            } else if let session = streamingSession {
                Task { @Sendable in await session.feedAudio(audioData) }
            } else {
                writeResponse(.error("No active stream. Send streamStart first."), context: context)
            }

        case .streamEnd:
            if let eou = eouStreamingSession {
                Task { @Sendable in
                    _ = await eou.finish()
                    self.eouStreamingSession = nil
                }
            } else if let session = streamingSession {
                Task { @Sendable in
                    _ = await session.finish()
                    self.streamingSession = nil
                }
            } else {
                writeResponse(.error("No active stream"), context: context)
            }

        default:
            let srv = server
            Task { @Sendable in
                let response = await srv.handle(request)
                eventLoop.execute { [self] in
                    self.writeResponse(response, context: ctx)
                }
            }
        }
    }

    func channelInactive(context: ChannelHandlerContext) {
        if let session = streamingSession {
            Task { await session.cancel() }
            streamingSession = nil
        }
        if let eou = eouStreamingSession {
            Task { await eou.cancel() }
            eouStreamingSession = nil
        }
        context.fireChannelInactive()
    }

    func errorCaught(context: ChannelHandlerContext, error: Error) {
        log("Connection error: \(error)")
        context.close(promise: nil)
    }

    private func writeResponse(_ response: SttResponse, context: ChannelHandlerContext) {
        do {
            let data = try jsonEncoder.encode(response)
            var buf = context.channel.allocator.buffer(capacity: data.count)
            buf.writeBytes(data)
            context.writeAndFlush(wrapOutboundOut(buf), promise: nil)
        } catch {
            log("Failed to encode response: \(error)")
            context.close(promise: nil)
        }
    }
}

private final class LockedBool: @unchecked Sendable {
    private var value = false
    private let lock = NSLock()
    func testAndSet() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        if value { return false }
        value = true
        return true
    }
}

func log(_ message: String) {
    print("[stt-coreml] \(message)")
}
