import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScoreBreakdownPanel } from './ScoreBreakdown'
import type { ScoreBreakdown } from '../types'

const score: ScoreBreakdown = {
  stars: 12.5,
  repos: 9.0,
  followers: 8.3,
  accountAge: 14.0,
  languageDiversity: 7.5,
  total: 51.3,
}

describe('ScoreBreakdownPanel', () => {
  it('renders the total score', () => {
    render(<ScoreBreakdownPanel score={score} />)
    expect(screen.getByText('51.3')).toBeInTheDocument()
  })

  it('renders all five component labels', () => {
    render(<ScoreBreakdownPanel score={score} />)
    expect(screen.getByText('Stars')).toBeInTheDocument()
    expect(screen.getByText('Followers')).toBeInTheDocument()
    expect(screen.getByText('Account age')).toBeInTheDocument()
    expect(screen.getByText('Public repos')).toBeInTheDocument()
    expect(screen.getByText('Languages')).toBeInTheDocument()
  })

  it('renders the heuristic disclaimer', () => {
    render(<ScoreBreakdownPanel score={score} />)
    expect(screen.getByText(/heuristic/i)).toBeInTheDocument()
  })
})
