import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface TallyMarksProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  color?: string
}

export function TallyMarks({ 
  count, 
  size = 'md', 
  animate = false,
  color = 'oklch(0.25 0.02 30)'
}: TallyMarksProps) {
  const sizeMap = {
    sm: { width: 20, height: 30, gap: 4, strokeWidth: 2 },
    md: { width: 30, height: 45, gap: 6, strokeWidth: 2.5 },
    lg: { width: 40, height: 60, gap: 8, strokeWidth: 3 }
  }
  
  const { width, height, gap, strokeWidth } = sizeMap[size]
  const groupSize = 5
  const fullGroups = Math.floor(count / groupSize)
  const remainder = count % groupSize
  
  const groups = useMemo(() => {
    const result: Array<{ id: number; marks: number }> = []
    for (let i = 0; i < fullGroups; i++) {
      result.push({ id: i, marks: 5 })
    }
    if (remainder > 0) {
      result.push({ id: fullGroups, marks: remainder })
    }
    return result
  }, [fullGroups, remainder])
  
  const renderGroup = (marks: number, groupIndex: number) => {
    const elements: React.ReactElement[] = []
    
    for (let i = 0; i < Math.min(marks, 4); i++) {
      const x = width / 2
      const y1 = 5
      const y2 = height - 5
      const offset = (i - 1.5) * (width / 4)
      
      elements.push(
        <motion.line
          key={`mark-${i}`}
          x1={x + offset}
          y1={y1}
          x2={x + offset}
          y2={y2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={
            animate
              ? { 
                  delay: (groupIndex * 5 + i) * 0.05,
                  duration: 0.3,
                  ease: 'easeOut'
                }
              : undefined
          }
        />
      )
    }
    
    if (marks === 5) {
      elements.push(
        <motion.line
          key="cross"
          x1={5}
          y1={height / 2 - 5}
          x2={width - 5}
          y2={height / 2 + 5}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={
            animate
              ? { 
                  delay: (groupIndex * 5 + 4) * 0.05,
                  duration: 0.3,
                  ease: 'easeOut'
                }
              : undefined
          }
        />
      )
    }
    
    return elements
  }
  
  if (count === 0) {
    return (
      <div className="text-muted-foreground italic text-sm">
        No marks yet
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {groups.map((group, index) => (
        <svg
          key={group.id}
          width={width}
          height={height}
          className="inline-block"
          style={{ marginRight: gap }}
        >
          {renderGroup(group.marks, index)}
        </svg>
      ))}
    </div>
  )
}

export function TallyCounter({ 
  count, 
  label,
  color = 'oklch(0.25 0.02 30)',
  showNumeric = true
}: { 
  count: number
  label?: string
  color?: string
  showNumeric?: boolean
}) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
      )}
      <div className="flex items-center gap-4">
        {showNumeric && (
          <div className="text-5xl font-bold geist-mono" style={{ color }}>
            {count.toLocaleString()}
          </div>
        )}
        {count <= 50 && (
          <div className="flex-1">
            <TallyMarks count={count} size="md" color={color} />
          </div>
        )}
      </div>
    </div>
  )
}
