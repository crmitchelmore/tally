import ProjectDescription

extension Project {
    static func makeApp(name: String) -> Project {
        Project(
            name: name,
            organizationName: "Tally",
            options: .options(automaticSchemesOptions: .enabled()),
            settings: .settings(configurations: [
                .debug(name: .debug),
                .release(name: .release)
            ]),
            targets: []
        )
    }
}
