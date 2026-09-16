import Foundation

struct TranscriptionResult: Codable, Sendable {
    let text: String
    let confidence: Float
    let durationSeconds: Double
    let processingTimeSeconds: Double
    let engine: String

    var rtfx: Float {
        Float(durationSeconds) / Float(processingTimeSeconds)
    }
}

protocol SttBackend: Sendable {
    var engineName: String { get }
    func loadModel() async throws
    func transcribe(audio: Data, sampleRate: Int) async throws -> TranscriptionResult
}
