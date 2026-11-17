import { colorFor } from '../lib/colors'

export default function Legend({ minutes }: { minutes: number[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {[...minutes].sort((a, b) => a - b).map((m) => (
        <li key={m} className="flex items-center gap-2 text-sm">
          <span className="h-3.5 w-3.5 rounded-sm" style={{ background: colorFor(m), opacity: 0.85 }} />
          hasta {m} min
        </li>
      ))}
    </ul>
  )
}
