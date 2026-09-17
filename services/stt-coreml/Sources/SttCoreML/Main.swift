import FluidAudio
import Foundation

@main
struct SttCoreMLApp {
    static func main() async throws {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let socketDir = "\(home)/.kuib"
        let socketPath = "\(socketDir)/stt.sock"

        try FileManager.default.createDirectory(
            atPath: socketDir, withIntermediateDirectories: true
        )

        log("Loading parakeet model...")
        let models = try await AsrModels.downloadAndLoad()
        log("Model loaded")

        let parakeet = ParakeetBackend(models: models)

        let eou = EouBackend()
        log("Loading parakeet-eou model...")
        try await eou.loadModel()
        log("EOU model loaded")

        let server = SttServer(
            socketPath: socketPath,
            tcpHost: "100.70.111.96",
            tcpPort: 9009,
            backends: [parakeet, eou],
            models: models
        )
        try await server.run()
    }
}
