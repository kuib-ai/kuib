import AVFoundation
import FluidAudio
import Foundation

actor EouStreamingSession {
    private let manager: any StreamingAsrManager
    private let onUpdate: @Sendable (SttResponse) -> Void

    init(variant: StreamingModelVariant, onUpdate: @escaping @Sendable (SttResponse) -> Void) async throws {
        self.onUpdate = onUpdate
        self.manager = variant.createManager()
        try await manager.loadModels()

        let cb = onUpdate
        await manager.setPartialTranscriptCallback { text in
            guard !text.isEmpty else { return }
            cb(SttResponse.streamUpdate(text: text, confirmed: false, confidence: 0.0))
        }

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

        do {
            try await manager.appendAudio(buffer)
            try await manager.processBufferedAudio()
        } catch {
            onUpdate(.error("EOU feed error: \(error.localizedDescription)"))
        }
    }

    func finish() async -> String {
        let text = (try? await manager.finish()) ?? ""
        onUpdate(SttResponse.streamEnd(text: text))
        return text
    }

    func cancel() async {
        await manager.cleanup()
    }
}
