// swift-tools-version: 5.9
import PackageDescription

#if TUIST
import ProjectDescription

let packageSettings = PackageSettings(
    productTypes: [
        "Clerk": .framework
    ]
)
#endif

let package = Package(
    name: "TallyDependencies",
    dependencies: [
        .package(url: "https://github.com/clerk/clerk-ios", from: "0.50.0")
    ]
)
