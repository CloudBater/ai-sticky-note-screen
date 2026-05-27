import type { ScoreBreakdown } from '../types'

interface Props {
  score: ScoreBreakdown
}

interface Tier {
  label: string
  cls: string
}

function getTier(total: number): Tier {
  if (total >= 80) return { label: 'High-Visibility',    cls: 'tier--blue' }
  if (total >= 60) return { label: 'Notable Developer',  cls: 'tier--green' }
  if (total >= 40) return { label: 'Active Contributor', cls: 'tier--yellow' }
  if (total >= 20) return { label: 'Building Presence',  cls: 'tier--muted' }
  return              { label: 'New to Open Source',  cls: 'tier--muted' }
}

const COMPONENTS: { key: keyof Omit<ScoreBreakdown, 'total'>; label: string; max: number; description: string }[] = [
  { key: 'stars', label: 'Stars', max: 30, description: 'Total stars on non-forked repos (log scale)' },
  { key: 'followers', label: 'Followers', max: 20, description: 'GitHub follower count (log scale)' },
  { key: 'accountAge', label: 'Account age', max: 20, description: 'Years since account creation, capped at 10' },
  { key: 'repos', label: 'Public repos', max: 15, description: 'Number of public repos, capped at 50' },
  { key: 'languageDiversity', label: 'Languages', max: 15, description: 'Unique languages across non-forked repos' },
]

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="score-bar-track" title={`${value} / ${max} pts`}>
      <div className="score-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ScoreBreakdownPanel({ score }: Props) {
  const tier = getTier(score.total)
  return (
    <div className="score-breakdown">
      <div className="score-total-row">
        <div className="score-total-left">
          <span className="score-total-value">{score.total}</span>
          <span className="score-total-label">/ 100</span>
        </div>
        <span className={`tier-badge ${tier.cls}`}>{tier.label}</span>
      </div>

      <div className="score-components">
        {COMPONENTS.map(({ key, label, max, description }) => (
          <div key={key} className="score-component" title={description}>
            <div className="score-component-header">
              <span className="score-component-label">{label}</span>
              <span className="score-component-value">{score[key]} / {max}</span>
            </div>
            <ScoreBar value={score[key]} max={max} />
          </div>
        ))}
      </div>

      <p className="score-disclaimer">
        Score is a heuristic based on public GitHub activity. It reflects
        open-source visibility, not overall engineering skill or employability.
      </p>
    </div>
  )
}
