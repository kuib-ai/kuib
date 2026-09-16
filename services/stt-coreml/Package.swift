// swift-tools-version: 6.4
import PackageDescription

let package = Package(
    name: "stt-coreml",
    platforms: [
        .macOS(.v14),
    ],
    dependencies: [
        .package(url: "https://github.com/FluidInference/FluidAudio.git", from: "0.37.0"),
        .package(url: "https://github.com/apple/swift-nio.git", from: "2.70.0"),
    ],
    targets: [
        .executableTarget(
            name: "stt-coreml",
            dependencies: [
                .product(name: "FluidAudio", package: "FluidAudio"),
                .product(name: "NIO", package: "swift-nio"),
                .product(name: "NIOFoundationCompat", package: "swift-nio"),
            ],
            path: "Sources/SttCoreML"
        ),
    ]
)
