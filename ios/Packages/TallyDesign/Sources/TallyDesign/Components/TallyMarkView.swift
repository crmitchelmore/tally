import SwiftUI

/// FRACTAL_COMPLETION_TALLIES
/// Hierarchical tally-mark visualization that stays intuitive at any scale
/// by collapsing detail at exact completion thresholds.
public struct TallyMarkView: View {
    let count: Int
    let animated: Bool
    let size: CGFloat
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animationProgress: Double = 0
    
    public init(count: Int, animated: Bool = false, size: CGFloat = 60) {
        self.count = max(0, count)
        self.animated = animated
        self.size = size
    }
    
    public var body: some View {
        Canvas { context, canvasSize in
            let bounds = CGRect(origin: .zero, size: canvasSize)
            
            switch count {
            case 0:
                // Empty state
                break
                
            case 1...4:
                // Vertical strokes
                drawVerticalStrokes(in: context, bounds: bounds, count: count)
                
            case 5:
                // 5-gate: 4 verticals + diagonal slash
                drawFiveGate(in: context, bounds: bounds)
                
            case 6...24:
                // X layout of 5-gates
                drawXLayout(in: context, bounds: bounds, count: count)
                
            case 25:
                // 25-cap: full X layout + X overlay
                drawTwentyFiveCap(in: context, bounds: bounds)
                
            case 26...99:
                // 2x2 grid of 25-units
                drawGridLayout(in: context, bounds: bounds, count: count)
                
            case 100:
                // 100-cap: X + square outline (collapse detail)
                drawHundredCap(in: context, bounds: bounds)
                
            case 101...999:
                // Row of 100-blocks
                drawHundredBlocksRow(in: context, bounds: bounds, count: count)
                
            case 1000:
                // 1000-cap: 10 squares + horizontal line
                drawThousandCap(in: context, bounds: bounds)
                
            case 1001...9999:
                // Stack of 1000-rows
                drawThousandStack(in: context, bounds: bounds, count: count)
                
            default:
                // 10,000+: 10x10 grid + diagonal closure
                drawTenThousandCap(in: context, bounds: bounds)
            }
        }
        .frame(width: size, height: heightForCount)
        .accessibilityLabel(accessibilityLabel)
        .onAppear {
            if animated && !reduceMotion {
                withAnimation(TallyMotion.strokeDraw) {
                    animationProgress = 1.0
                }
            } else {
                animationProgress = 1.0
            }
        }
    }
    
    private var accessibilityLabel: String {
        if count == 1 {
            return "1 tally mark"
        } else {
            return "\(count) tally marks"
        }
    }
    
    /// Compute appropriate height based on count
    /// - 1-99: Square (1:1)
    /// - 100-999: Taller box (1:2 aspect) to show box clearly
    /// - 1000+: Even taller for row/stack layouts
    private var heightForCount: CGFloat {
        switch count {
        case 0...99:
            return size
        case 100...999:
            // 100-cap and row of blocks need vertical space
            return size * 2
        case 1000...9999:
            // Stack of rows needs more vertical space
            return size * 2.5
        default:
            // 10,000+: grid layout
            return size * 3
        }
    }
    
    // MARK: - Drawing Functions
    
    private func drawVerticalStrokes(in context: GraphicsContext, bounds: CGRect, count: Int) {
        let strokeWidth = bounds.width / 8
        let strokeHeight = bounds.height * 0.8
        let spacing = strokeWidth * 1.5
        let totalWidth = CGFloat(count - 1) * spacing
        let startX = (bounds.width - totalWidth) / 2
        let startY = (bounds.height - strokeHeight) / 2
        
        for i in 0..<count {
            let x = startX + CGFloat(i) * spacing
            let path = Path { p in
                p.move(to: CGPoint(x: x, y: startY))
                p.addLine(to: CGPoint(x: x, y: startY + strokeHeight))
            }
            context.stroke(path, with: .color(.tallyInk), lineWidth: 2.5)
        }
    }
    
    private func drawFiveGate(in context: GraphicsContext, bounds: CGRect) {
        // Draw 4 vertical strokes
        drawVerticalStrokes(in: context, bounds: bounds, count: 4)
        
        // Draw diagonal slash (accent color)
        let inset = bounds.width * 0.15
        let slashPath = Path { p in
            p.move(to: CGPoint(x: inset, y: bounds.height * 0.8))
            p.addLine(to: CGPoint(x: bounds.width - inset, y: bounds.height * 0.2))
        }
        context.stroke(slashPath, with: .color(.tallyAccent), lineWidth: 3.0)
    }
    
    private func drawXLayout(in context: GraphicsContext, bounds: CGRect, count: Int) {
        let fiveGates = count / 5
        let remainder = count % 5
        
        // For 6-9: show 5-gate on left + partial on right side by side
        if count >= 6 && count <= 9 {
            let halfWidth = bounds.width * 0.48
            let gateSize = halfWidth
            
            // Draw 5-gate on left
            var leftContext = context
            leftContext.translateBy(x: 0, y: (bounds.height - gateSize) / 2)
            drawFiveGate(
                in: leftContext,
                bounds: CGRect(origin: .zero, size: CGSize(width: gateSize, height: gateSize))
            )
            
            // Draw remainder strokes on right
            var rightContext = context
            rightContext.translateBy(x: bounds.width - halfWidth, y: (bounds.height - gateSize) / 2)
            drawVerticalStrokes(
                in: rightContext,
                bounds: CGRect(origin: .zero, size: CGSize(width: gateSize, height: gateSize)),
                count: remainder
            )
            return
        }
        
        // For 10+: X-layout arrangement
        let gateSize = bounds.width * 0.28
        let center = CGPoint(x: bounds.width / 2, y: bounds.height / 2)
        
        // Positions: center, NE, NW, SE, SW
        let positions: [CGPoint] = [
            center, // 0 - center
            CGPoint(x: center.x + gateSize * 0.8, y: center.y - gateSize * 0.8), // 1 - NE
            CGPoint(x: center.x - gateSize * 0.8, y: center.y - gateSize * 0.8), // 2 - NW
            CGPoint(x: center.x + gateSize * 0.8, y: center.y + gateSize * 0.8), // 3 - SE
            CGPoint(x: center.x - gateSize * 0.8, y: center.y + gateSize * 0.8), // 4 - SW
        ]
        
        // Draw completed 5-gates
        for i in 0..<min(fiveGates, 4) {
            let pos = positions[i]
            let gateBounds = CGRect(
                x: pos.x - gateSize / 2,
                y: pos.y - gateSize / 2,
                width: gateSize,
                height: gateSize
            )
            var gateContext = context
            gateContext.translateBy(x: gateBounds.origin.x, y: gateBounds.origin.y)
            drawFiveGate(
                in: gateContext,
                bounds: CGRect(origin: .zero, size: gateBounds.size)
            )
        }
        
        // Draw partial strokes in next position
        if remainder > 0 && fiveGates < 4 {
            let pos = positions[min(fiveGates, 4)]
            let gateBounds = CGRect(
                x: pos.x - gateSize / 2,
                y: pos.y - gateSize / 2,
                width: gateSize,
                height: gateSize
            )
            var gateContext = context
            gateContext.translateBy(x: gateBounds.origin.x, y: gateBounds.origin.y)
            drawVerticalStrokes(
                in: gateContext,
                bounds: CGRect(origin: .zero, size: gateBounds.size),
                count: remainder
            )
        }
    }
    
    private func drawTwentyFiveCap(in context: GraphicsContext, bounds: CGRect) {
        // Draw full X layout with all 24 marks visible (4 five-gates + 4 strokes)
        drawXLayout(in: context, bounds: bounds, count: 24)
        
        // Draw 5th five-gate (the completing mark) in center before X overlay
        let gateSize = bounds.width * 0.28
        let center = CGPoint(x: bounds.width / 2, y: bounds.height / 2)
        let centerGateBounds = CGRect(
            x: center.x - gateSize / 2,
            y: center.y - gateSize / 2,
            width: gateSize,
            height: gateSize
        )
        var centerContext = context
        centerContext.translateBy(x: centerGateBounds.origin.x, y: centerGateBounds.origin.y)
        drawFiveGate(
            in: centerContext,
            bounds: CGRect(origin: .zero, size: centerGateBounds.size)
        )
        
        // Draw X overlay (accent color for the 25th mark closure)
        let inset = bounds.width * 0.1
        let xPath = Path { p in
            // Top-left to bottom-right
            p.move(to: CGPoint(x: inset, y: inset))
            p.addLine(to: CGPoint(x: bounds.width - inset, y: bounds.height - inset))
            // Top-right to bottom-left
            p.move(to: CGPoint(x: bounds.width - inset, y: inset))
            p.addLine(to: CGPoint(x: inset, y: bounds.height - inset))
        }
        context.stroke(xPath, with: .color(.tallyAccent), lineWidth: 4.0)
    }
    
    private func drawGridLayout(in context: GraphicsContext, bounds: CGRect, count: Int) {
        let units = count / 25
        let remainder = count % 25
        let unitSize = bounds.width * 0.45
        let gap = bounds.width * 0.1
        
        // 2x2 grid positions
        let positions: [CGPoint] = [
            CGPoint(x: gap, y: gap), // Top-left
            CGPoint(x: bounds.width - unitSize - gap, y: gap), // Top-right
            CGPoint(x: gap, y: bounds.height - unitSize - gap), // Bottom-left
            CGPoint(x: bounds.width - unitSize - gap, y: bounds.height - unitSize - gap), // Bottom-right
        ]
        
        for i in 0..<min(units, 4) {
            let pos = positions[i]
            var unitContext = context
            unitContext.translateBy(x: pos.x, y: pos.y)
            drawTwentyFiveCap(
                in: unitContext,
                bounds: CGRect(origin: .zero, size: CGSize(width: unitSize, height: unitSize))
            )
        }
        
        // Draw partial unit
        if remainder > 0 && units < 4 {
            let pos = positions[min(units, 3)]
            var unitContext = context
            unitContext.translateBy(x: pos.x, y: pos.y)
            drawXLayout(
                in: unitContext,
                bounds: CGRect(origin: .zero, size: CGSize(width: unitSize, height: unitSize)),
                count: remainder
            )
        }
    }
    
    private func drawHundredCap(in context: GraphicsContext, bounds: CGRect) {
        // Use a square size based on width, centered vertically
        let boxSize = min(bounds.width, bounds.height) * 0.8
        let inset = (bounds.width - boxSize) / 2
        let yInset = (bounds.height - boxSize) / 2
        let xSize = boxSize * 0.35  // Size of each X
        
        // Draw square outline (C3)
        let squarePath = Path { p in
            p.addRect(CGRect(x: inset, y: yInset, width: boxSize, height: boxSize))
        }
        context.stroke(squarePath, with: .color(.tallyInkTertiary), lineWidth: 2.5)
        
        // Draw 4 Xs in 2x2 grid inside the box (accent color)
        let positions: [(x: CGFloat, y: CGFloat)] = [
            (0.25, 0.25), // Top-left
            (0.75, 0.25), // Top-right
            (0.25, 0.75), // Bottom-left
            (0.75, 0.75), // Bottom-right
        ]
        
        for pos in positions {
            let centerX = inset + boxSize * pos.x
            let centerY = yInset + boxSize * pos.y
            let halfX = xSize / 2
            
            let xPath = Path { p in
                // Diagonal 1
                p.move(to: CGPoint(x: centerX - halfX, y: centerY - halfX))
                p.addLine(to: CGPoint(x: centerX + halfX, y: centerY + halfX))
                // Diagonal 2
                p.move(to: CGPoint(x: centerX + halfX, y: centerY - halfX))
                p.addLine(to: CGPoint(x: centerX - halfX, y: centerY + halfX))
            }
            context.stroke(xPath, with: .color(.tallyAccent), lineWidth: 2.0)
        }
    }
    
    private func drawHundredBlocksRow(in context: GraphicsContext, bounds: CGRect, count: Int) {
        let blocks = count / 100
        let remainder = count % 100
        let blockSize = bounds.width / 11 // Fit up to 10 with spacing
        let spacing = blockSize * 0.2
        
        for i in 0..<min(blocks, 10) {
            let x = CGFloat(i) * (blockSize + spacing)
            let blockBounds = CGRect(x: x, y: bounds.height / 2 - blockSize / 2, width: blockSize, height: blockSize)
            var blockContext = context
            blockContext.translateBy(x: blockBounds.origin.x, y: blockBounds.origin.y)
            drawHundredCap(
                in: blockContext,
                bounds: CGRect(origin: .zero, size: blockBounds.size)
            )
        }
        
        // Show partial block indicator if needed
        if remainder > 0 && blocks < 10 {
            let x = CGFloat(blocks) * (blockSize + spacing)
            let blockBounds = CGRect(x: x, y: bounds.height / 2 - blockSize / 2, width: blockSize, height: blockSize)
            // Draw simplified representation
            let rect = Path { p in
                p.addRect(blockBounds)
            }
            context.stroke(rect, with: .color(.tallyInkTertiary), lineWidth: 1.5)
        }
    }
    
    private func drawThousandCap(in context: GraphicsContext, bounds: CGRect) {
        let blockSize = bounds.width / 11
        let spacing = blockSize * 0.2
        let startY = bounds.height / 2 - blockSize / 2
        
        // Draw 10 squares
        for i in 0..<10 {
            let x = CGFloat(i) * (blockSize + spacing)
            let squarePath = Path { p in
                p.addRect(CGRect(x: x, y: startY, width: blockSize, height: blockSize))
            }
            context.stroke(squarePath, with: .color(.tallyInkTertiary), lineWidth: 2.0)
        }
        
        // Draw horizontal line through all (accent color)
        let linePath = Path { p in
            p.move(to: CGPoint(x: 0, y: bounds.height / 2))
            p.addLine(to: CGPoint(x: bounds.width, y: bounds.height / 2))
        }
        context.stroke(linePath, with: .color(.tallyAccent), lineWidth: 3.0)
    }
    
    private func drawThousandStack(in context: GraphicsContext, bounds: CGRect, count: Int) {
        let rows = min(count / 1000, 10)
        let rowHeight = bounds.height / 11
        
        for i in 0..<rows {
            let y = CGFloat(i) * rowHeight
            var rowContext = context
            rowContext.translateBy(x: 0, y: y)
            drawThousandCap(
                in: rowContext,
                bounds: CGRect(origin: .zero, size: CGSize(width: bounds.width, height: rowHeight))
            )
        }
    }
    
    private func drawTenThousandCap(in context: GraphicsContext, bounds: CGRect) {
        // Draw 10x10 grid representation
        drawThousandStack(in: context, bounds: bounds, count: 10000)
        
        // Draw diagonal closure stroke (C2)
        let inset = bounds.width * 0.05
        let diagonalPath = Path { p in
            p.move(to: CGPoint(x: inset, y: inset))
            p.addLine(to: CGPoint(x: bounds.width - inset, y: bounds.height - inset))
        }
        context.stroke(diagonalPath, with: .color(.tallyInkSecondary), lineWidth: 4.0)
    }
}

// MARK: - Previews

#Preview("Single Stroke") {
    TallyMarkView(count: 1)
        .padding()
}

#Preview("Five Gate") {
    TallyMarkView(count: 5)
        .padding()
}

#Preview("Twenty Five") {
    TallyMarkView(count: 25)
        .padding()
}

#Preview("Hundred") {
    TallyMarkView(count: 100)
        .padding()
}

#Preview("Thousand") {
    TallyMarkView(count: 1000)
        .padding()
}

#Preview("Range") {
    ScrollView {
        VStack(spacing: 16) {
            ForEach([1, 3, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000], id: \.self) { count in
                VStack {
                    Text("\(count)")
                        .font(.tallyLabelSmall)
                    TallyMarkView(count: count, size: 80)
                }
            }
        }
        .padding()
    }
}
