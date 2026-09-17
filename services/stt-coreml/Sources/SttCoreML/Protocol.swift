import Foundation

struct SttRequest: Codable, Sendable {
    enum Action: String, Codable, Sendable {
        case transcribe
        case ping
        case streamStart
        case streamAudio
        case streamEnd
    }

    let action: Action
    let audio: String?
    let sampleRate: Int?
    let engine: String?
    let chunkSeconds: Double?
}

struct SttResponse: Codable, Sendable {
    let ok: Bool
    let type: String?
    let text: String?
    let confirmed: Bool?
    let confidence: Float?
    let durationSeconds: Double?
    let processingTimeSeconds: Double?
    let engine: String?
    let error: String?

    static func result(_ r: TranscriptionResult) -> SttResponse {
        SttResponse(
            ok: true, type: "result",
            text: r.text, confirmed: nil,
            confidence: r.confidence,
            durationSeconds: r.durationSeconds,
            processingTimeSeconds: r.processingTimeSeconds,
            engine: r.engine, error: nil
        )
    }

    static func streamUpdate(text: String, confirmed: Bool, confidence: Float) -> SttResponse {
        SttResponse(
            ok: true, type: confirmed ? "confirmed" : "partial",
            text: text, confirmed: confirmed,
            confidence: confidence,
            durationSeconds: nil, processingTimeSeconds: nil,
            engine: "parakeet-stream", error: nil
        )
    }

    static func streamEnd(text: String) -> SttResponse {
        SttResponse(
            ok: true, type: "final",
            text: text, confirmed: true,
            confidence: nil,
            durationSeconds: nil, processingTimeSeconds: nil,
            engine: "parakeet-stream", error: nil
        )
    }

    static let streamStarted = SttResponse(
        ok: true, type: "started",
        text: nil, confirmed: nil, confidence: nil,
        durationSeconds: nil, processingTimeSeconds: nil,
        engine: "parakeet-stream", error: nil
    )

    static let pong = SttResponse(
        ok: true, type: "pong",
        text: nil, confirmed: nil, confidence: nil,
        durationSeconds: nil, processingTimeSeconds: nil,
        engine: nil, error: nil
    )

    static func error(_ message: String) -> SttResponse {
        SttResponse(
            ok: false, type: "error",
            text: nil, confirmed: nil, confidence: nil,
            durationSeconds: nil, processingTimeSeconds: nil,
            engine: nil, error: message
        )
    }
}
