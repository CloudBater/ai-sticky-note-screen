import type { GitHubUser, TopRepo } from '../types'
import { accountAgeInYears } from '../utils'

interface Props {
  user: GitHubUser
  topRepos: TopRepo[]
}

export function ProfileSummary({ user, topRepos }: Props) {
  const wholeYears = Math.floor(accountAgeInYears(user.created_at))
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

  const fallback = sentence2 === null && sentence3 === null
    ? `They have ${user.public_repos.toLocaleString()} public ${user.public_repos === 1 ? 'repository' : 'repositories'}.`
    : null

  return (
    <div className="profile-summary">
      {sentence1} {sentence2 ?? fallback} {sentence3}
    </div>
  )
}
