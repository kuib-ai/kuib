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

        let backend = ParakeetBackend()
        log("Loading parakeet model...")
        try await backend.loadModel()
        log("Model loaded")

        let server = SttServer(
            socketPath: socketPath,
            backends: [backend]
        )
        try await server.run()
    }
}
