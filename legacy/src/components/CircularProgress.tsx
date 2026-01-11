import { motion } from 'framer-motion'

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 12,
  color = 'oklch(0.25 0.02 30)',
}: CircularProgressProps) {
  const percentage = Math.min(100, (value / max) * 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const tallyMarks = 20
  const angleStep = 360 / tallyMarks

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="oklch(0.92 0.008 50)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        {Array.from({ length: tallyMarks }).map((_, i) => {
          const angle = (i * angleStep * Math.PI) / 180
          const innerRadius = radius - strokeWidth / 2 - 4
          const outerRadius = radius + strokeWidth / 2 + 4
          const x1 = size / 2 + innerRadius * Math.cos(angle)
          const y1 = size / 2 + innerRadius * Math.sin(angle)
          const x2 = size / 2 + outerRadius * Math.cos(angle)
          const y2 = size / 2 + outerRadius * Math.sin(angle)
          
          const isActive = (i / tallyMarks) * 100 <= percentage
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? color : 'oklch(0.92 0.008 50)'}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={isActive ? 0.6 : 0.2}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold geist-mono" style={{ color }}>
            {Math.round(percentage)}%
          </div>
        </div>
      </div>
    </div>
  )
}
