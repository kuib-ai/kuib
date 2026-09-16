import AVFoundation
import FluidAudio
import Foundation

actor ParakeetBackend: SttBackend {
    nonisolated let engineName = "parakeet"

    private var manager: AsrManager?
    private var decoderState: TdtDecoderState?

    func loadModel() async throws {
        let config = ASRConfig.default
        let manager = AsrManager(config: config)
        try await manager.loadModels(AsrModels())
        self.manager = manager
        self.decoderState = TdtDecoderState()
    }

    func transcribe(audio: Data, sampleRate: Int) async throws -> TranscriptionResult {
        guard let manager else {
            throw SttEngineError.modelNotLoaded
        }
        if decoderState == nil {
            decoderState = TdtDecoderState()
        }

        let floats = audio.withUnsafeBytes { raw in
            let int16s = raw.bindMemory(to: Int16.self)
            return int16s.map { Float($0) / 32768.0 }
        }

        let result = try await manager.transcribe(
            floats,
            decoderState: &decoderState!
        )

        return TranscriptionResult(
            text: result.text,
            confidence: result.confidence,
            durationSeconds: result.duration,
            processingTimeSeconds: result.processingTime,
            engine: engineName
        )
    }
}

enum SttEngineError: Error, LocalizedError {
    case modelNotLoaded
    case unknownEngine(String)
    case invalidAudioData

    var errorDescription: String? {
        switch self {
        case .modelNotLoaded: "Model not loaded. Call loadModel() first."
        case .unknownEngine(let name): "Unknown engine: \(name)"
        case .invalidAudioData: "Invalid audio data"
        }
    }
}
