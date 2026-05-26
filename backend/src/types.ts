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

export interface GitHubRepo {
  name: string
  stargazers_count: number
  language: string | null
  fork: boolean
}

export interface ScoreBreakdown {
  stars: number
  repos: number
  followers: number
  accountAge: number
  languageDiversity: number
  total: number
}

export interface UserProfile {
  user: GitHubUser
  topRepos: { name: string; stars: number; language: string | null; url: string }[]
  score: ScoreBreakdown
  cachedAt: string
  rateLimitRemaining: number | null
}
