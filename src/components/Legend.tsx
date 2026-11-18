import { colorFor } from '../lib/colors'
import { rangeLabel, type DrawMode } from '../lib/geometry'

export default function Legend({ minutes, mode }: { minutes: number[]; mode: DrawMode }) {
  const asc = [...minutes].sort((a, b) => a - b)
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {asc.map((m, i) => (
        <li key={m} className="flex items-center gap-2 text-sm">
          <span className="h-3.5 w-3.5 rounded-sm" style={{ background: colorFor(m), opacity: 0.85 }} />
          {rangeLabel(mode, m, asc[i - 1])}
        </li>
      ))}
    </ul>
  )
}
