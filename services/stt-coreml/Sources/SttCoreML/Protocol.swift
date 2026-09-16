import Foundation

struct SttRequest: Codable, Sendable {
    enum Action: String, Codable, Sendable {
        case transcribe
        case ping
    }

    let action: Action
    let audio: String?
    let sampleRate: Int?
    let engine: String?
}

struct SttResponse: Codable, Sendable {
    let ok: Bool
    let text: String?
    let confidence: Float?
    let durationSeconds: Double?
    let processingTimeSeconds: Double?
    let engine: String?
    let error: String?

    static func result(_ r: TranscriptionResult) -> SttResponse {
        SttResponse(
            ok: true,
            text: r.text,
            confidence: r.confidence,
            durationSeconds: r.durationSeconds,
            processingTimeSeconds: r.processingTimeSeconds,
            engine: r.engine,
            error: nil
        )
    }

    static let pong = SttResponse(
        ok: true, text: nil, confidence: nil,
        durationSeconds: nil, processingTimeSeconds: nil,
        engine: nil, error: nil
    )

    static func error(_ message: String) -> SttResponse {
        SttResponse(
            ok: false, text: nil, confidence: nil,
            durationSeconds: nil, processingTimeSeconds: nil,
            engine: nil, error: message
        )
    }
}
