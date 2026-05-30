import { useState, useMemo, useCallback } from 'react'
import './App.css'

// Allow deployments to override the API URL while keeping local dev zero-config.
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function ScoreRing({ score, label, color }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score)) / 100
  const dash = pct * circ

  return (
    <div className="score-ring-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={`${label}: ${score}`}>
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

const DIM_COLORS = {
  Recency: '#00ff9d',
  Reach:   '#7c6aff',
  Breadth: '#ffd166',
}

function DimCard({ dim }) {
  const color = DIM_COLORS[dim.label] ?? '#aaa'
  return (
    <div className="dim-card">
      <ScoreRing score={dim.score} label={dim.label} color={color} />
      <p className="dim-why">{dim.why}</p>
    </div>
  )
}

export default function App() {
  const [input, setInput]     = useState('')
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Derive the overall score from the three transparent dimensions.
  const overall = useMemo(() => {
    if (!data) return null
    return Math.round((data.recency.score + data.reach.score + data.breadth.score) / 3)
  }, [data])

  const lookup = useCallback(async () => {
    const username = input.trim()
    if (!username) return

    // GitHub usernames are 1-39 characters and cannot start or end with a hyphen.
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
      setError('Invalid GitHub username format.')
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch(
        `${API}/api/score?username=${encodeURIComponent(username)}`,
        { signal: AbortSignal.timeout(15_000) }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      if (e.name === 'TimeoutError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [input])

  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Enter' && !loading) lookup() },
    [lookup, loading]
  )

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
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="GitHub username"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="search-btn"
            onClick={lookup}
            disabled={loading || !input.trim()}
            aria-busy={loading}
          >
            {loading ? '…' : 'Analyse'}
          </button>
        </div>

        {error && (
          <div className="error-box" role="alert">
            ⚠ {error}
          </div>
        )}

        {data && (
          <div className="result">
            <div className="profile-row">
              <img className="avatar" src={data.avatar_url} alt={`${data.username} avatar`} />
              <div className="profile-info">
                <div className="profile-name">{data.name || data.username}</div>
                <a
                  className="profile-handle"
                  href={`https://github.com/${data.username}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @{data.username}
                </a>
              </div>
              <div className="overall-box" aria-label={`Overall score: ${overall}`}>
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
              {data.cached_at && (
                <span className="meta-info">
                  as of {new Date(data.cached_at).toLocaleTimeString()}
                </span>
              )}
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
