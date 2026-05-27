export interface ScoreBreakdown {
  stars: number
  repos: number
  followers: number
  accountAge: number
  languageDiversity: number
  total: number
}

export interface TopRepo {
  name: string
  stars: number
  language: string | null
  url: string
}

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
  html_url: string
  company: string | null
  location: string | null
  blog: string | null
}

export interface UserProfile {
  user: GitHubUser
  topRepos: TopRepo[]
  score: ScoreBreakdown
  cachedAt: string
  rateLimitRemaining: number | null
}

export type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: UserProfile }
  | { status: 'error'; message: string; isRateLimit: boolean }
