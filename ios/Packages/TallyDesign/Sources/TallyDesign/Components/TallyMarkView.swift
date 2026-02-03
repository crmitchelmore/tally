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
            guard count > 0 else { return }
            
            if count >= 1000 {
                drawThousandStack(in: context, bounds: bounds, count: count)
            } else {
                drawRemainderRow(in: context, bounds: bounds, count: count)
            }
        }
        .frame(width: widthForCount, height: heightForCount)
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
    /// - 1000+: Stack of 1000-rows + optional remainder row
    private var heightForCount: CGFloat {
        switch count {
        case 0...999:
            return size
        default:
            if count >= 10000 {
                return thousandRowHeight * 10
            }
            let rows = min(count / 1000, 10)
            let remainder = count % 1000
            let remainderHeight = remainder > 0 ? remainderRowHeight : 0
            return thousandRowHeight * CGFloat(rows) + remainderHeight
        }
    }
    
    private var remainderRowHeight: CGFloat {
        count >= 1000 ? size * 0.7 : size
    }
    
    private var thousandRowHeight: CGFloat {
        let totalSpacing = widthForCount * 0.06
        let blockSize = (widthForCount - totalSpacing) / 10
        return blockSize * 1.3
    }
    
    private var widthForCount: CGFloat {
        count >= 1000 ? size * 1.8 : size
    }
    
    private struct RemainderMetrics {
        let height: CGFloat
        let hundredSize: CGFloat
        let xSize: CGFloat
        let strokeWidth: CGFloat
        let strokeSpacing: CGFloat
        let gateWidth: CGFloat
        let gateSpacing: CGFloat
        let itemGap: CGFloat
        let fivesWidth: CGFloat
        let onesWidth: CGFloat
        let totalWidth: CGFloat
    }
    
    private func remainderMetrics(height: CGFloat, hundreds: Int, twentyFives: Int, fives: Int, ones: Int) -> RemainderMetrics {
        let strokeWidth = max(1.8, height * 0.07)
        let strokeSpacing = strokeWidth * 1.6
        let gateWidth = strokeWidth * 4 + strokeWidth * 3
        let gateSpacing = strokeWidth * 2
        let itemGap = height * 0.15
        let hundredSize = height
        let xSize = height * 0.7
        let fivesWidth = fives > 0 ? (gateWidth * CGFloat(fives) + gateSpacing * CGFloat(max(0, fives - 1))) : 0
        let onesWidth = ones > 0 ? (strokeWidth * CGFloat(ones) + strokeSpacing * CGFloat(max(0, ones - 1))) : 0
        let itemCount = hundreds + twentyFives + (fives > 0 ? 1 : 0) + (ones > 0 ? 1 : 0)
        let totalWidth = hundredSize * CGFloat(hundreds)
            + xSize * CGFloat(twentyFives)
            + fivesWidth
            + onesWidth
            + CGFloat(max(0, itemCount - 1)) * itemGap
        return RemainderMetrics(
            height: height,
            hundredSize: hundredSize,
            xSize: xSize,
            strokeWidth: strokeWidth,
            strokeSpacing: strokeSpacing,
            gateWidth: gateWidth,
            gateSpacing: gateSpacing,
            itemGap: itemGap,
            fivesWidth: fivesWidth,
            onesWidth: onesWidth,
            totalWidth: totalWidth
        )
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
    
    private func drawRemainderRow(in context: GraphicsContext, bounds: CGRect, count: Int, alignToTop: Bool = false) {
        let remainder = count % 1000
        let hundreds = remainder / 100
        let twentyFives = (remainder % 100) / 25
        let fives = (remainder % 25) / 5
        let ones = remainder % 5
        let hasRemainder = hundreds > 0 || twentyFives > 0 || fives > 0 || ones > 0
        guard hasRemainder else { return }
        
        let targetHeight = bounds.height
        var metrics = remainderMetrics(height: targetHeight, hundreds: hundreds, twentyFives: twentyFives, fives: fives, ones: ones)
        if metrics.totalWidth > bounds.width {
            let scale = bounds.width / metrics.totalWidth
            metrics = remainderMetrics(height: targetHeight * scale, hundreds: hundreds, twentyFives: twentyFives, fives: fives, ones: ones)
        }
        
        let yOffset: CGFloat = alignToTop ? 0 : (bounds.height - metrics.height) / 2
        var currentX = max((bounds.width - metrics.totalWidth) / 2, 0)
        
        if hundreds > 0 {
            for _ in 0..<hundreds {
                let blockY = yOffset + (metrics.height - metrics.hundredSize)
                let blockBounds = CGRect(x: currentX, y: blockY, width: metrics.hundredSize, height: metrics.hundredSize)
                var blockContext = context
                blockContext.translateBy(x: blockBounds.origin.x, y: blockBounds.origin.y)
                drawHundredCap(in: blockContext, bounds: CGRect(origin: .zero, size: blockBounds.size))
                currentX += metrics.hundredSize + metrics.itemGap
            }
        }
        
        if twentyFives > 0 {
            for _ in 0..<twentyFives {
                let xY = yOffset + (metrics.height - metrics.xSize)
                let xBounds = CGRect(x: currentX, y: xY, width: metrics.xSize, height: metrics.xSize)
                let xPath = Path { p in
                    p.move(to: CGPoint(x: xBounds.minX, y: xBounds.minY))
                    p.addLine(to: CGPoint(x: xBounds.maxX, y: xBounds.maxY))
                    p.move(to: CGPoint(x: xBounds.maxX, y: xBounds.minY))
                    p.addLine(to: CGPoint(x: xBounds.minX, y: xBounds.maxY))
                }
                context.stroke(xPath, with: .color(.tallyAccent), lineWidth: max(2.0, metrics.strokeWidth))
                currentX += metrics.xSize + metrics.itemGap
            }
        }
        
        if fives > 0 {
            let gateHeight = metrics.height
            let totalGateWidth = metrics.fivesWidth
            let gateBounds = CGRect(x: currentX, y: yOffset, width: totalGateWidth, height: gateHeight)
            for i in 0..<fives {
                let gateX = gateBounds.minX + CGFloat(i) * (metrics.gateWidth + metrics.gateSpacing)
                var gateContext = context
                gateContext.translateBy(x: gateX, y: gateBounds.minY)
                drawFiveGate(
                    in: gateContext,
                    bounds: CGRect(origin: .zero, size: CGSize(width: metrics.gateWidth, height: gateHeight))
                )
            }
            currentX += totalGateWidth + metrics.itemGap
        }
        
        if ones > 0 {
            let strokeHeight = metrics.height * 0.85
            let totalWidth = CGFloat(ones - 1) * metrics.strokeSpacing
            let startX = currentX
            let startY = yOffset + metrics.height - strokeHeight
            for i in 0..<ones {
                let x = startX + CGFloat(i) * metrics.strokeSpacing
                let path = Path { p in
                    p.move(to: CGPoint(x: x, y: startY))
                    p.addLine(to: CGPoint(x: x, y: startY + strokeHeight))
                }
                context.stroke(path, with: .color(.tallyInk), lineWidth: metrics.strokeWidth)
            }
        }
    }
    
    private func drawHundredCap(in context: GraphicsContext, bounds: CGRect) {
        // Use a square size based on width, centred vertically
        let boxSize = min(bounds.width, bounds.height) * 0.95
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
        let blockSize = bounds.height
        let spacing = blockSize * 0.25
        
        for i in 0..<min(blocks, 10) {
            let x = CGFloat(i) * (blockSize + spacing)
            let blockBounds = CGRect(x: x, y: 0, width: blockSize, height: blockSize)
            var blockContext = context
            blockContext.translateBy(x: blockBounds.origin.x, y: blockBounds.origin.y)
            drawHundredCap(in: blockContext, bounds: CGRect(origin: .zero, size: blockBounds.size))
        }
        
        // Show partial block indicator if needed
        if remainder > 0 && blocks < 10 {
            let x = CGFloat(blocks) * (blockSize + spacing)
            let blockBounds = CGRect(x: x, y: 0, width: blockSize, height: blockSize)
            let rect = Path { p in
                p.addRect(blockBounds)
            }
            context.stroke(rect, with: .color(.tallyInkTertiary), lineWidth: 1.5)
        }
    }
    
    private func drawThousandCap(in context: GraphicsContext, bounds: CGRect) {
        // Use larger blocks - allow 10% total spacing
        let totalSpacing = bounds.width * 0.06
        let blockSize = (bounds.width - totalSpacing) / 10
        let spacing = totalSpacing / 9
        let rowHeight = blockSize * 1.3
        let startY = (bounds.height - rowHeight) / 2
        
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
        context.stroke(linePath, with: .color(.tallyAccent), lineWidth: max(3.0, blockSize * 0.3))
    }
    
    private func drawThousandStack(in context: GraphicsContext, bounds: CGRect, count: Int) {
        let thousands = count / 1000
        let remainder = count % 1000
        let rows = min(thousands, 10)
        
        let rowHeight = thousandRowHeight
        let stackHeight = rowHeight * CGFloat(rows)
        
        // Draw thousand-rows
        for i in 0..<rows {
            let y = CGFloat(i) * rowHeight
            var rowContext = context
            rowContext.translateBy(x: 0, y: y)
            drawThousandCap(
                in: rowContext,
                bounds: CGRect(origin: .zero, size: CGSize(width: bounds.width, height: rowHeight))
            )
        }
        
        // Draw remainder below the thousand-rows
        if remainder > 0 {
            let remainderY = stackHeight
            let remainderHeight = remainderRowHeight
            var remainderContext = context
            remainderContext.translateBy(x: 0, y: remainderY)
            
            // Route remainder to appropriate renderer
            let remainderBounds = CGRect(origin: .zero, size: CGSize(width: bounds.width, height: remainderHeight))
            drawRemainderRow(in: remainderContext, bounds: remainderBounds, count: remainder, alignToTop: true)
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
