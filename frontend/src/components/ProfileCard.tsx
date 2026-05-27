import type { UserProfile } from '../types'
import { ScoreBreakdownPanel } from './ScoreBreakdown'
import { ProfileSummary } from './ProfileSummary'
import { accountAgeInYears } from '../utils'

interface Props {
  profile: UserProfile
  onSearchAnother: () => void
}

function pluralise(n: number, singular: string) {
  return `${n.toLocaleString()} ${n === 1 ? singular : singular + 's'}`
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  return `${Math.floor(diffMins / 60)}h ago`
}

function formatAccountAge(createdAt: string): string {
  const years = accountAgeInYears(createdAt)
  if (years < 1) return `${Math.floor(years * 12)} months`
  return `${years.toFixed(1)} years`
}

export function ProfileCard({ profile, onSearchAnother }: Props) {
  const { user, topRepos, score, cachedAt, rateLimitRemaining } = profile

  return (
    <div className="profile-card">
      <div className="profile-header">
        <img src={user.avatar_url} alt={`${user.login} avatar`} className="avatar" />
        <div className="profile-info">
          <h2 className="profile-name">{user.name ?? user.login}</h2>
          <a
            href={user.html_url}
            target="_blank"
            rel="noreferrer"
            className="profile-login"
          >
            @{user.login}
          </a>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-meta">
            {user.company && <span>🏢 {user.company}</span>}
            {user.location && <span>📍 {user.location}</span>}
            <span>🗓 {formatAccountAge(user.created_at)} on GitHub</span>
          </div>
          <div className="profile-stats">
            <span>{pluralise(user.public_repos, 'repo')}</span>
            <span>{pluralise(user.followers, 'follower')}</span>
            <span>{pluralise(user.following, 'following')}</span>
          </div>
        </div>
      </div>

      <ProfileSummary user={user} topRepos={topRepos} />

      <ScoreBreakdownPanel score={score} />

      {topRepos.length > 0 && (
        <div className="top-repos">
          <h3 className="top-repos-title">Top repos by stars</h3>
          <ul className="repo-list">
            {topRepos.map(repo => (
              <li key={repo.name} className="repo-item">
                <a href={repo.url} target="_blank" rel="noreferrer" className="repo-name">
                  {repo.name}
                </a>
                <span className="repo-stars">★ {repo.stars.toLocaleString()}</span>
                {repo.language && <span className="repo-lang">{repo.language}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-footer">
        <div className="cache-info">
          Data cached {timeAgo(cachedAt)}
          {rateLimitRemaining !== null && (
            <span className={`rate-limit ${rateLimitRemaining < 10 ? 'rate-limit--low' : ''}`}>
              {' '}· {rateLimitRemaining} GitHub API calls remaining
            </span>
          )}
        </div>
        <button className="search-another-btn" onClick={onSearchAnother}>
          Search another developer →
        </button>
      </div>
    </div>
  )
}
