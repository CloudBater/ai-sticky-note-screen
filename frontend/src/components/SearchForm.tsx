import { useState, useEffect, useRef } from 'react'

interface Props {
  onSearch: (username: string) => void
  isLoading: boolean
  recentSearches: string[]
  onSelectRecent: (username: string) => void
}

export function SearchForm({ onSearch, isLoading, recentSearches, onSelectRecent }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSearch(trimmed)
  }

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Enter a GitHub username…"
          aria-label="GitHub username"
          disabled={isLoading}
          className="search-input"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" disabled={isLoading || !value.trim()} className="search-btn">
          {isLoading ? 'Loading…' : 'Score'}
        </button>
      </form>

      {recentSearches.length > 0 && (
        <div className="recent-searches">
          <span className="recent-label">Recent:</span>
          {recentSearches.map(name => (
            <button
              key={name}
              className="recent-chip"
              onClick={() => {
                setValue(name)
                onSelectRecent(name)
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
