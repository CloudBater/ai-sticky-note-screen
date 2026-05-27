import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProfileSummary } from './ProfileSummary'
import type { GitHubUser } from '../types'

const baseUser: GitHubUser = {
  login: 'newdev',
  name: 'New Dev',
  avatar_url: '',
  bio: null,
  public_repos: 7,
  followers: 3,
  following: 0,
  created_at: '2022-01-01T00:00:00Z',
  html_url: 'https://github.com/newdev',
  company: null,
  location: null,
  blog: null,
}

describe('ProfileSummary', () => {
  it('shows a fallback repo sentence when user has no starred repos and few followers', () => {
    render(<ProfileSummary user={baseUser} topRepos={[]} />)
    expect(screen.getByText(/7 public repo/i)).toBeInTheDocument()
  })

  it('omits the fallback when user has a starred repo', () => {
    render(<ProfileSummary user={baseUser} topRepos={[{ name: 'cool-lib', stars: 50, language: 'TypeScript', url: 'https://github.com/newdev/cool-lib' }]} />)
    expect(screen.queryByText(/public repo/i)).not.toBeInTheDocument()
  })
})
