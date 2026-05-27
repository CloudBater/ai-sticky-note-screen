import type { GitHubUser, TopRepo } from '../types'

interface Props {
  user: GitHubUser
  topRepos: TopRepo[]
}

export function ProfileSummary({ user, topRepos }: Props) {
  const years = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  const wholeYears = Math.floor(years)
  const name = user.name ?? user.login

  const sentence1 = wholeYears < 1
    ? `${name} has been on GitHub for less than a year.`
    : `${name} has been on GitHub for ${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}.`

  const topRepo = topRepos[0]
  const sentence2 = topRepo && topRepo.stars > 0
    ? `Their most-starred project is ${topRepo.name}${topRepo.language ? ` (${topRepo.language})` : ''} with ${topRepo.stars.toLocaleString()} ★.`
    : null

  const sentence3 = user.followers > 10000
    ? `With ${user.followers.toLocaleString()} followers, they have notable visibility in the open-source community.`
    : user.followers > 500
      ? `They have an active following of ${user.followers.toLocaleString()} developers.`
      : null

  return (
    <div className="profile-summary">
      {sentence1} {sentence2} {sentence3}
    </div>
  )
}
