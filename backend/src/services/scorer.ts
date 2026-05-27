import type { GitHubUser, GitHubRepo, ScoreBreakdown } from '../types.js'

// Log scale helpers — handle the power-law distribution of GitHub activity.
// A user with 10k stars shouldn't score 100x a user with 100 stars.
function logScore(value: number, max: number, points: number): number {
  if (value <= 0) return 0
  return Math.min((Math.log2(value + 1) / Math.log2(max + 1)) * points, points)
}

function linearScore(value: number, cap: number, points: number): number {
  return Math.min(value, cap) / cap * points
}

export function computeScore(user: GitHubUser, repos: GitHubRepo[]): ScoreBreakdown {
  const ownRepos = repos.filter(r => !r.fork)
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0)
  const uniqueLanguages = new Set(ownRepos.map(r => r.language).filter(Boolean)).size
  const ageMs = Date.now() - new Date(user.created_at).getTime()
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25)

  const stars = logScore(totalStars, 5000, 30)
  const reposPoints = linearScore(user.public_repos, 50, 15)
  const followers = logScore(user.followers, 10000, 20)
  const accountAge = linearScore(Math.min(ageYears, 10), 10, 20)
  const languageDiversity = linearScore(uniqueLanguages, 10, 15)

  const total = stars + reposPoints + followers + accountAge + languageDiversity

  const round1 = (n: number) => Math.round(n * 10) / 10

  return {
    stars: round1(stars),
    repos: round1(reposPoints),
    followers: round1(followers),
    accountAge: round1(accountAge),
    languageDiversity: round1(languageDiversity),
    total: round1(Math.min(total, 100)),
  }
}
