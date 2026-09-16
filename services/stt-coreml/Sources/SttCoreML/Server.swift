import Foundation
import NIO
import NIOFoundationCompat

final class SttServer: Sendable {
    let socketPath: String
    let backends: [String: any SttBackend]
    let defaultEngine: String

    init(socketPath: String, backends: [any SttBackend]) {
        var map: [String: any SttBackend] = [:]
        for b in backends { map[b.engineName] = b }
        self.backends = map
        self.defaultEngine = backends.first!.engineName
        self.socketPath = socketPath
    }

    func run() async throws {
        try? FileManager.default.removeItem(atPath: socketPath)

        let group = MultiThreadedEventLoopGroup(numberOfThreads: 2)
        let server = self

        let bootstrap = ServerBootstrap(group: group)
            .serverChannelOption(.backlog, value: 8)
            .childChannelInitializer { channel in
                channel.pipeline.addHandlers([
                    ByteToMessageHandler(LengthFieldBasedFrameDecoder(lengthFieldLength: .four)),
                    LengthFieldPrepender(lengthFieldLength: .four),
                    RequestHandler(server: server),
                ])
            }

        let channel = try await bootstrap.bind(unixDomainSocketPath: socketPath).get()
        log("Listening on \(socketPath)")

        // Clean up socket file on shutdown
        defer {
            try? channel.close().wait()
            try? group.syncShutdownGracefully()
            try? FileManager.default.removeItem(atPath: socketPath)
            log("Shut down")
        }

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            let sigint = DispatchSource.makeSignalSource(signal: SIGINT, queue: .main)
            let sigterm = DispatchSource.makeSignalSource(signal: SIGTERM, queue: .main)
            signal(SIGINT, SIG_IGN)
            signal(SIGTERM, SIG_IGN)
            sigint.setEventHandler { cont.resume() }
            sigterm.setEventHandler { cont.resume() }
            sigint.resume()
            sigterm.resume()
        }
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
        }
    }
}

private final class RequestHandler: ChannelInboundHandler, @unchecked Sendable {
    typealias InboundIn = ByteBuffer
    typealias OutboundOut = ByteBuffer

    let server: SttServer
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(server: SttServer) {
        self.server = server
    }

    func channelRead(context: ChannelHandlerContext, data: NIOAny) {
        var buf = unwrapInboundIn(data)
        guard let bytes = buf.readBytes(length: buf.readableBytes) else {
            let resp = SttResponse.error("Empty request")
            writeResponse(resp, context: context)
            return
        }

        let request: SttRequest
        do {
            request = try decoder.decode(SttRequest.self, from: Data(bytes))
        } catch {
            writeResponse(.error("Invalid JSON: \(error.localizedDescription)"), context: context)
            return
        }

        let eventLoop = context.eventLoop
        let srv = server

        Task {
            let response = await srv.handle(request)
            eventLoop.execute {
                self.writeResponse(response, context: context)
            }
        }
    }

    func errorCaught(context: ChannelHandlerContext, error: Error) {
        log("Connection error: \(error)")
        context.close(promise: nil)
    }

    private func writeResponse(_ response: SttResponse, context: ChannelHandlerContext) {
        do {
            let data = try encoder.encode(response)
            var buf = context.channel.allocator.buffer(capacity: data.count)
            buf.writeBytes(data)
            context.writeAndFlush(wrapOutboundOut(buf), promise: nil)
        } catch {
            log("Failed to encode response: \(error)")
            context.close(promise: nil)
        }
    }
}

func log(_ message: String) {
    print("[stt-coreml] \(message)")
}
