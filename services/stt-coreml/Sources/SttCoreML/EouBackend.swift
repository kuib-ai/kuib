import AVFoundation
import FluidAudio
import Foundation

actor EouBackend: SttBackend {
    nonisolated let engineName = "parakeet-eou"

    private var manager: (any StreamingAsrManager)?
    private let variant: StreamingModelVariant

    init(variant: StreamingModelVariant = .parakeetEou320ms) {
        self.variant = variant
    }

    func loadModel() async throws {
        let mgr = variant.createManager()
        try await mgr.loadModels()
        self.manager = mgr
    }

    func transcribe(audio: Data, sampleRate: Int) async throws -> TranscriptionResult {
        guard let manager else {
            throw SttEngineError.modelNotLoaded
        }

        try await manager.reset()

        let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: Double(sampleRate),
            channels: 1,
            interleaved: true
        )!
        let sampleCount = audio.count / 2
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(sampleCount)) else {
            throw SttEngineError.invalidAudioData
        }
        buffer.frameLength = AVAudioFrameCount(sampleCount)
        audio.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
            guard let dst = buffer.int16ChannelData?[0] else { return }
            let src = raw.bindMemory(to: Int16.self)
            for i in 0..<sampleCount {
                dst[i] = src[i]
            }
        }

        let t0 = Date()
        try await manager.appendAudio(buffer)
        try await manager.processBufferedAudio()
        let text = try await manager.finish()
        let elapsed = Date().timeIntervalSince(t0)
        let duration = Double(sampleCount) / Double(sampleRate)

        return TranscriptionResult(
            text: text,
            confidence: 0.0,
            durationSeconds: duration,
            processingTimeSeconds: elapsed,
            engine: engineName
        )
    }
}
