import { describe, it, expect } from 'vitest'
import { computeScore } from '../src/services/scorer.js'
import type { GitHubUser, GitHubRepo } from '../src/types.js'

const baseUser: GitHubUser = {
  login: 'testuser',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.png',
  bio: null,
  public_repos: 10,
  followers: 100,
  following: 50,
  created_at: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 3 years ago
  html_url: 'https://github.com/testuser',
  company: null,
  location: null,
  blog: null,
}

const makeRepo = (stars: number, language: string | null, fork = false): GitHubRepo => ({
  name: 'repo',
  stargazers_count: stars,
  language,
  fork,
})

describe('computeScore', () => {
  it('returns a total between 0 and 100', () => {
    const score = computeScore(baseUser, [makeRepo(50, 'TypeScript')])
    expect(score.total).toBeGreaterThanOrEqual(0)
    expect(score.total).toBeLessThanOrEqual(100)
  })

  it('gives a higher total to a user with more stars', () => {
    const lowStars = computeScore(baseUser, [makeRepo(1, 'Go')])
    const highStars = computeScore(baseUser, [makeRepo(5000, 'Go')])
    expect(highStars.total).toBeGreaterThan(lowStars.total)
  })

  it('excludes forked repos from star count', () => {
    const withFork = computeScore(baseUser, [makeRepo(1000, 'Rust', true)])
    const withOwned = computeScore(baseUser, [makeRepo(1000, 'Rust', false)])
    expect(withOwned.stars).toBeGreaterThan(withFork.stars)
  })

  it('gives more language diversity points for more unique languages', () => {
    const oneLanguage = computeScore(baseUser, [
      makeRepo(0, 'TypeScript'),
      makeRepo(0, 'TypeScript'),
    ])
    const twoLanguages = computeScore(baseUser, [
      makeRepo(0, 'TypeScript'),
      makeRepo(0, 'Go'),
    ])
    expect(twoLanguages.languageDiversity).toBeGreaterThan(oneLanguage.languageDiversity)
  })

  it('gives more account age points for an older account', () => {
    const newUser: GitHubUser = {
      ...baseUser,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
    }
    const oldUser: GitHubUser = {
      ...baseUser,
      created_at: new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 8 years ago
    }
    const newScore = computeScore(newUser, [])
    const oldScore = computeScore(oldUser, [])
    expect(oldScore.accountAge).toBeGreaterThan(newScore.accountAge)
  })

  it('caps total at 100 even for an unrealistically high-profile user', () => {
    const superUser: GitHubUser = {
      ...baseUser,
      public_repos: 999,
      followers: 999999,
      created_at: new Date(Date.now() - 20 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }
    const manyRepos = Array.from({ length: 50 }, (_, i) =>
      makeRepo(10000, ['TypeScript', 'Go', 'Rust', 'Python', 'Java', 'C++', 'Ruby', 'Swift', 'Kotlin', 'Elixir'][i % 10])
    )
    const score = computeScore(superUser, manyRepos)
    expect(score.total).toBeLessThanOrEqual(100)
  })

  it('returns 0 total for a brand-new user with no repos', () => {
    const emptyUser: GitHubUser = {
      ...baseUser,
      public_repos: 0,
      followers: 0,
      created_at: new Date().toISOString(),
    }
    const score = computeScore(emptyUser, [])
    expect(score.total).toBe(0)
  })

  it('each breakdown component is non-negative', () => {
    const score = computeScore(baseUser, [makeRepo(10, 'Python')])
    expect(score.stars).toBeGreaterThanOrEqual(0)
    expect(score.repos).toBeGreaterThanOrEqual(0)
    expect(score.followers).toBeGreaterThanOrEqual(0)
    expect(score.accountAge).toBeGreaterThanOrEqual(0)
    expect(score.languageDiversity).toBeGreaterThanOrEqual(0)
  })
})
