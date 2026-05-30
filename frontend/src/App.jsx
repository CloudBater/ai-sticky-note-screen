import { useState } from 'react'
import './App.css'

const API = 'http://localhost:8000'

function ScoreRing({ score, label, color }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score)) / 100
  const dash = pct * circ

  return (
    <div className="score-ring-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1e1e2e" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="48" y="48" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="18" fontFamily="Space Mono" fontWeight="700">
          {score}
        </text>
      </svg>
      <span className="ring-label">{label}</span>
    </div>
  )
}

function DimCard({ dim }) {
  const color =
    dim.label === 'Recency' ? '#00ff9d' :
    dim.label === 'Reach'   ? '#7c6aff' : '#ffd166'
  return (
    <div className="dim-card">
      <ScoreRing score={dim.score} label={dim.label} color={color} />
      <p className="dim-why">{dim.why}</p>
    </div>
  )
}

export default function App() {
  const [input, setInput]   = useState('')
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const lookup = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`${API}/api/score?username=${encodeURIComponent(input.trim())}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const overall = data
    ? Math.round((data.recency.score + data.reach.score + data.breadth.score) / 3)
    : null

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-tag">GitHub Activity Dashboard</div>
        <h1>Dev<span className="accent">Score</span></h1>
        <p className="hero-sub">Transparent, factual GitHub activity metrics. No black boxes.</p>
      </header>

      <main className="main">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Enter a GitHub username"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
          />
          <button className="search-btn" onClick={lookup} disabled={loading}>
            {loading ? '…' : 'Analyse'}
          </button>
        </div>

        {error && <div className="error-box">⚠ {error}</div>}

        {data && (
          <div className="result">
            <div className="profile-row">
              <img className="avatar" src={data.avatar_url} alt={data.username} />
              <div className="profile-info">
                <div className="profile-name">{data.name}</div>
                <a className="profile-handle"
                  href={`https://github.com/${data.username}`}
                  target="_blank" rel="noreferrer">
                  @{data.username}
                </a>
              </div>
              <div className="overall-box">
                <div className="overall-num">{overall}</div>
                <div className="overall-label">avg score</div>
              </div>
            </div>

            <div className="dims-grid">
              <DimCard dim={data.recency} />
              <DimCard dim={data.reach} />
              <DimCard dim={data.breadth} />
            </div>

            {data.summary && (
              <div className="summary-box">
                <div className="summary-label">
                  AI Summary <span className="ai-badge">Claude</span>
                </div>
                <p>{data.summary}</p>
              </div>
            )}

            <div className="meta-row">
              <span className={`cache-badge ${data.cache_hit ? 'hit' : 'miss'}`}>
                {data.cache_hit ? '⚡ cached' : '🔄 live fetch'}
              </span>
              <span className="meta-info">
                GitHub API remaining: <strong>{data.rate_limit_remaining}</strong>
              </span>
              <span className="meta-info">
                as of {new Date(data.cached_at).toLocaleTimeString()}
              </span>
            </div>

            <div className="disclaimer">
              Scores are computed from publicly available GitHub data using transparent heuristics.
              They reflect observable activity only — not ability, character, or hiring suitability.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}