// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MeteoFontanillasCore",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(name: "MeteoFontanillasCore", targets: ["MeteoFontanillasCore"])
    ],
    targets: [
        .target(
            name: "MeteoFontanillasCore",
            path: "Shared"
        ),
        .testTarget(
            name: "MeteoFontanillasCoreTests",
            dependencies: ["MeteoFontanillasCore"],
            path: "Tests/MeteoFontanillasCoreTests"
        )
    ]
)
