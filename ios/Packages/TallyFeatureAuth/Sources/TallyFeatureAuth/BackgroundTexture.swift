import SwiftUI

public struct BackgroundTexture: View {
    @Environment(\.colorScheme) private var colorScheme

    public init() {}

    public var body: some View {
        Rectangle()
            .fill(backgroundColor)
            .overlay(
                Canvas { context, size in
                    let spacing: CGFloat = 48
                    let talliesPerRow = Int(size.width / spacing) + 2
                    let rows = Int(size.height / spacing) + 2
                    for row in 0..<rows {
                        for column in 0..<talliesPerRow {
                            let x = CGFloat(column) * spacing
                            let y = CGFloat(row) * spacing
                            context.translateBy(x: x, y: y)
                            drawTallyMark(in: &context)
                            context.translateBy(x: -x, y: -y)
                        }
                    }
                }
                .opacity(colorScheme == .dark ? 0.08 : 0.12)
                .drawingGroup()
            )
            .ignoresSafeArea()
    }

    private var backgroundColor: Color {
        Color(white: colorScheme == .dark ? 0.08 : 0.97)
    }

    private func drawTallyMark(in context: inout GraphicsContext) {
        let height: CGFloat = 24
        let path = Path { path in
            for index in 0..<4 {
                let x: CGFloat = CGFloat(index) * 6
                path.addRoundedRect(
                    in: CGRect(
                        x: x,
                        y: 0,
                        width: 2,
                        height: height
                    ),
                    cornerSize: CGSize(width: 1, height: 1)
                )
            }
        }

        context.stroke(path, with: .color(Color.secondary.opacity(0.2)))

        var slashTransform = context
        slashTransform.rotate(by: .degrees(-15))
        slashTransform.stroke(
            Path(CGRect(x: -2, y: -2, width: 2, height: height + 6)),
            with: .color(Color(red: 0.75, green: 0.07, blue: 0.07).opacity(0.6)),
            lineWidth: 3
        )
    }
}
