// swift-tools-version: 5.9
import PackageDescription

#if TUIST
import ProjectDescription

let packageSettings = PackageSettings(
    productTypes: [
        "ClerkKit": .framework,
        "ClerkKitUI": .framework,
        "Sentry": .framework,
        "PostHog": .framework
    ],
    targetSettings: [
        // ClerkKitUI declares its ColorResource symbols by hand; Xcode's generated ones would clash.
        "ClerkKitUI": ["ASSETCATALOG_COMPILER_GENERATE_ASSET_SYMBOLS": "NO"],
        // PostHog embeds a C++ crash reporter; SwiftPM links libc++ implicitly, Tuist 4.32 does not.
        "PostHog": ["OTHER_LDFLAGS": "$(inherited) -lc++"]
    ]
)
#endif

let package = Package(
    name: "TallyDependencies",
    dependencies: [
        .package(url: "https://github.com/clerk/clerk-ios", from: "1.7.1"),
        .package(url: "https://github.com/getsentry/sentry-cocoa", from: "9.34.0"),
        .package(url: "https://github.com/PostHog/posthog-ios.git", from: "3.94.4")
    ]
)
