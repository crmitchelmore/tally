# Agent Instructions

Read [.github/copilot-instructions.md](.github/copilot-instructions.md) for the
project rules. This file adds guidance shared across agent tools.

## Apple documentation (Sosumi)

Apple Developer documentation needs JavaScript, so agents can't read
`developer.apple.com` directly. Use [Sosumi](https://sosumi.ai) instead, and
check Apple APIs against it rather than relying on memory. That covers Swift,
SwiftUI, UIKit, AppKit and Foundation, along with API availability, the Human
Interface Guidelines and WWDC sessions.

- **MCP:** `https://sosumi.ai/mcp` (Streamable HTTP). Tools:
  `searchAppleDocumentation`, `fetchAppleDocumentation`,
  `fetchAppleVideoTranscript` and `fetchExternalDocumentation`.
- **HTTP:** swap the host, so `https://developer.apple.com/documentation/swiftui/view`
  becomes `https://sosumi.ai/documentation/swiftui/view`. Use
  `https://sosumi.ai/external/<url>` for other Swift-DocC sites.
- **CLI:** `npx @nshipster/sosumi search "SwiftData"`, or
  `npx @nshipster/sosumi fetch /documentation/swift/array`.
- **Skill:** `https://sosumi.ai/SKILL.md`, installed in `~/.agents/skills/sosumi`
  and `~/.claude/skills/sosumi`.
