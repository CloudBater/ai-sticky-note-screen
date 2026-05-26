import type { GitHubUser, GitHubRepo } from '../types.js'

const GITHUB_API = 'https://api.github.com'
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry<T> {
  data: T
  fetchedAt: number
  rateLimitRemaining: number | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>()

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.fetchedAt > CACHE_TTL_MS
}

async function githubFetch<T>(path: string): Promise<{ data: T; rateLimitRemaining: number | null }> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'devscore-app/1.0',
  }

  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers })
  const rateLimitRemaining = res.headers.get('X-RateLimit-Remaining')
    ? Number(res.headers.get('X-RateLimit-Remaining'))
    : null

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    const msg = body.message ?? res.statusText
    const err = new Error(msg) as Error & { status: number; rateLimitRemaining: number | null }
    err.status = res.status
    err.rateLimitRemaining = rateLimitRemaining
    throw err
  }

  const data = await res.json() as T
  return { data, rateLimitRemaining }
}

function getCached<T>(key: string): CacheEntry<T> | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry || isExpired(entry)) return null
  return entry
}

function setCached<T>(key: string, data: T, rateLimitRemaining: number | null): CacheEntry<T> {
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now(), rateLimitRemaining }
  cache.set(key, entry)
  return entry
}

export async function fetchUser(
  username: string
): Promise<{ user: GitHubUser; cachedAt: string; rateLimitRemaining: number | null }> {
  const key = `user:${username}`
  const cached = getCached<GitHubUser>(key)
  if (cached) {
    return { user: cached.data, cachedAt: new Date(cached.fetchedAt).toISOString(), rateLimitRemaining: cached.rateLimitRemaining }
  }

  const { data, rateLimitRemaining } = await githubFetch<GitHubUser>(`/users/${username}`)
  const entry = setCached(key, data, rateLimitRemaining)
  return { user: data, cachedAt: new Date(entry.fetchedAt).toISOString(), rateLimitRemaining }
}

export async function fetchRepos(
  username: string
): Promise<{ repos: GitHubRepo[]; cachedAt: string; rateLimitRemaining: number | null }> {
  const key = `repos:${username}`
  const cached = getCached<GitHubRepo[]>(key)
  if (cached) {
    return { repos: cached.data, cachedAt: new Date(cached.fetchedAt).toISOString(), rateLimitRemaining: cached.rateLimitRemaining }
  }

  const { data, rateLimitRemaining } = await githubFetch<GitHubRepo[]>(
    `/users/${username}/repos?per_page=100&sort=updated`
  )
  const entry = setCached(key, data, rateLimitRemaining)
  return { repos: data, cachedAt: new Date(entry.fetchedAt).toISOString(), rateLimitRemaining }
}
