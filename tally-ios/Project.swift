import ProjectDescription

let project = Project(
    name: "Tally",
    targets: [
        .target(
            name: "Tally",
            destinations: .iOS,
            product: .app,
            bundleId: "dev.tuist.Tally",
            infoPlist: .extendingDefault(
                with: [
                    "UILaunchScreen": [
                        "UIColorName": "",
                        "UIImageName": "",
                    ],
                ]
            ),
            buildableFolders: [
                "Tally/Sources",
                "Tally/Resources",
            ],
            dependencies: []
        ),
        .target(
            name: "TallyTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "dev.tuist.TallyTests",
            infoPlist: .default,
            buildableFolders: [
                "Tally/Tests"
            ],
            dependencies: [.target(name: "Tally")]
        ),
    ]
)
