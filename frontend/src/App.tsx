import { useState, useCallback } from 'react'
import { SearchForm } from './components/SearchForm'
import { ProfileCard } from './components/ProfileCard'
import { SkeletonCard } from './components/SkeletonCard'
import type { FetchState, UserProfile } from './types'

const RECENT_KEY = 'devscore-recent'
const MAX_RECENT = 5

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(username: string, prev: string[]): string[] {
  const next = [username, ...prev.filter(u => u !== username)].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

async function fetchProfile(username: string): Promise<UserProfile> {
  const res = await fetch(`/api/user/${encodeURIComponent(username)}`)
  const body = await res.json() as UserProfile | { error: string }
  if (!res.ok) {
    const errBody = body as { error: string }
    const err = new Error(errBody.error ?? 'Unknown error') as Error & { status: number }
    err.status = res.status
    throw err
  }
  return body as UserProfile
}

export default function App() {
  const [state, setState] = useState<FetchState>({ status: 'idle' })
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent)

  const search = useCallback(async (username: string) => {
    setState({ status: 'loading' })
    try {
      const data = await fetchProfile(username)
      setRecentSearches(prev => saveRecent(username, prev))
      setState({ status: 'success', data })
    } catch (err) {
      const error = err as Error & { status?: number }
      const isRateLimit = error.status === 429
      setState({ status: 'error', message: error.message, isRateLimit })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">DevScore</h1>
        <p className="app-tagline">GitHub activity at a glance — transparent, heuristic, honest.</p>
      </header>

      <main className="app-main">
        {state.status !== 'success' && (
          <SearchForm
            onSearch={search}
            isLoading={state.status === 'loading'}
            recentSearches={recentSearches}
            onSelectRecent={search}
          />
        )}

        {state.status === 'loading' && <SkeletonCard />}

        {state.status === 'error' && (
          <div className={`error-state ${state.isRateLimit ? 'error-state--rate-limit' : ''}`} role="alert">
            <p className="error-message">{state.message}</p>
            {state.isRateLimit && (
              <p className="error-hint">
                Add a <code>GITHUB_TOKEN</code> to your <code>.env</code> file to raise the limit to 5,000 requests/hour.
              </p>
            )}
            <button className="retry-btn" onClick={reset}>Try another username</button>
          </div>
        )}

        {state.status === 'success' && (
          <ProfileCard profile={state.data} onSearchAnother={reset} />
        )}
      </main>

      <footer className="app-footer">
        Data sourced from the public GitHub REST API.
        Scores are heuristic proxies for open-source activity — not validated employment predictors.
      </footer>
    </div>
  )
}
