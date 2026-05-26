import { Router } from 'express'
import { fetchUser, fetchRepos } from '../services/github.js'
import { computeScore } from '../services/scorer.js'
import type { UserProfile } from '../types.js'

const router = Router()

router.get('/:username', async (req, res) => {
  const { username } = req.params

  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) {
    res.status(400).json({ error: 'Invalid GitHub username format.' })
    return
  }

  try {
    const [userResult, reposResult] = await Promise.all([
      fetchUser(username),
      fetchRepos(username),
    ])

    const { user, cachedAt, rateLimitRemaining: rlUser } = userResult
    const { repos, rateLimitRemaining: rlRepos } = reposResult

    const rateLimitRemaining = rlUser ?? rlRepos

    const score = computeScore(user, repos)

    const ownRepos = repos.filter(r => !r.fork)
    const topRepos = ownRepos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(r => ({
        name: r.name,
        stars: r.stargazers_count,
        language: r.language,
        url: `https://github.com/${username}/${r.name}`,
      }))

    const profile: UserProfile = {
      user,
      topRepos,
      score,
      cachedAt,
      rateLimitRemaining,
    }

    res.json(profile)
  } catch (err) {
    const error = err as Error & { status?: number; rateLimitRemaining?: number | null }

    if (error.status === 404) {
      res.status(404).json({ error: `GitHub user "${username}" not found.` })
      return
    }

    if (error.status === 403 || error.status === 429) {
      res.status(429).json({
        error: 'GitHub API rate limit reached. Try again in a few minutes, or add a GITHUB_TOKEN to .env.',
        rateLimitRemaining: error.rateLimitRemaining ?? 0,
      })
      return
    }

    console.error('Upstream GitHub error:', error)
    res.status(502).json({ error: 'Failed to fetch data from GitHub. Please try again.' })
  }
})

export default router
