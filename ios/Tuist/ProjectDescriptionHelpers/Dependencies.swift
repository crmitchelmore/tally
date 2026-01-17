import ProjectDescription

extension TargetDependency {
    static func packages(_ dependencies: [String]) -> [TargetDependency] {
        dependencies.map { .external(name: $0) }
    }
}
