import AVFoundation
import FluidAudio
import Foundation

actor StreamingSession {
    private let manager: SlidingWindowAsrManager
    private var updateTask: Task<Void, Never>?
    private let onUpdate: @Sendable (SttResponse) -> Void

    init(models: AsrModels, chunkSeconds: Double, onUpdate: @escaping @Sendable (SttResponse) -> Void) async throws {
        self.onUpdate = onUpdate

        let config = SlidingWindowAsrConfig(
            chunkSeconds: min(chunkSeconds, 11.0),
            hypothesisChunkSeconds: 1.0,
            leftContextSeconds: 2.0,
            rightContextSeconds: 2.0,
            minContextForConfirmation: 5.0,
            confirmationThreshold: 0.80
        )
        self.manager = SlidingWindowAsrManager(config: config)
        try await manager.loadModels(models)

        let mgr = manager
        let cb = onUpdate
        updateTask = Task {
            for await update in await mgr.transcriptionUpdates {
                guard !update.text.isEmpty else { continue }
                let resp = SttResponse.streamUpdate(
                    text: update.text,
                    confirmed: update.isConfirmed,
                    confidence: update.confidence
                )
                cb(resp)
            }
        }

        try await manager.startStreaming(source: .microphone)
        onUpdate(.streamStarted)
    }

    func feedAudio(_ pcmData: Data) async {
        let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: 16000,
            channels: 1,
            interleaved: true
        )!
        let sampleCount = pcmData.count / 2
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(sampleCount)) else {
            return
        }
        buffer.frameLength = AVAudioFrameCount(sampleCount)
        pcmData.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
            guard let dst = buffer.int16ChannelData?[0] else { return }
            let src = raw.bindMemory(to: Int16.self)
            for i in 0..<sampleCount {
                dst[i] = src[i]
            }
        }
        await manager.streamAudio(buffer)
    }

    func finish() async -> String {
        let text = (try? await manager.finish()) ?? ""
        updateTask?.cancel()
        let resp = SttResponse.streamEnd(text: text)
        onUpdate(resp)
        return text
    }

    func cancel() async {
        await manager.cancel()
        updateTask?.cancel()
    }
}
