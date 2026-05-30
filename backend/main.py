"""
backend/main.py

FastAPI backend proxy for DevScore.
- Proxies GitHub REST API
- 24-hour in-memory cache (cachetools)
- Exposes rate-limit metadata
- Calls Anthropic API for factual activity summary
"""

import os
import time
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from cachetools import TTLCache

import github_client

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="DevScore API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_methods=["GET"],
    allow_headers=["*"],
)

# 24-hour TTL cache, max 256 usernames
cache: TTLCache = TTLCache(maxsize=256, ttl=86400)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Score
# ---------------------------------------------------------------------------

@app.get("/api/score")
def get_score(username: str = Query(..., min_length=1)):
    cache_key = username.lower()

    if cache_key in cache:
        cached = cache[cache_key]
        cached["cache_hit"] = True
        return cached

    # Fetch from GitHub
    try:
        user = github_client.fetch_user(username)
    except Exception as e:
        msg = str(e)
        if "404" in msg:
            raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found")
        raise HTTPException(status_code=502, detail=f"GitHub API error: {msg}")

    try:
        repos = github_client.fetch_repos(username)
        events = github_client.fetch_events(username)
        rate_limit_remaining = github_client.fetch_rate_limit()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {str(e)}")

    # Compute dimensions
    recency = _score_recency(events)
    reach = _score_reach(user, repos)
    breadth = _score_breadth(repos)

    # AI summary (optional — graceful fallback if key missing)
    summary = _generate_summary(user, repos, events)

    result = {
        "username": user["login"],
        "avatar_url": user.get("avatar_url", ""),
        "name": user.get("name") or user["login"],
        "recency": recency,
        "reach": reach,
        "breadth": breadth,
        "summary": summary,
        "cache_hit": False,
        "rate_limit_remaining": rate_limit_remaining,
        "cached_at": datetime.now(timezone.utc).isoformat(),
    }

    cache[cache_key] = result
    return result


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _score_recency(events: list) -> dict:
    """Score based on recent public event frequency (last 90 days)."""
    now = datetime.now(timezone.utc)
    cutoff = now.timestamp() - 90 * 86400

    recent = [
        e for e in events
        if _parse_ts(e.get("created_at", "")) >= cutoff
    ]
    count = len(recent)

    # 30+ events in 90 days → 100, 0 events → 0
    score = min(100, int(count / 30 * 100))

    return {
        "score": score,
        "label": "Recency",
        "why": (
            f"{count} public events in the last 90 days. "
            "Score reflects how frequently you've been active on GitHub recently."
        ),
        "raw": {"events_last_90d": count},
    }


def _score_reach(user: dict, repos: list) -> dict:
    """Score based on followers and total stars."""
    followers = user.get("followers", 0)
    own_repos = [r for r in repos if not r.get("fork", False)]
    total_stars = sum(r.get("stargazers_count", 0) for r in own_repos)

    # followers: 1000+ → 50 pts; stars: 500+ → 50 pts
    follower_pts = min(50, int(followers / 1000 * 50))
    star_pts = min(50, int(total_stars / 500 * 50))
    score = follower_pts + star_pts

    return {
        "score": score,
        "label": "Reach",
        "why": (
            f"{followers} followers and {total_stars} stars across "
            f"{len(own_repos)} original repositories. "
            "Score reflects how much your public work has resonated with others."
        ),
        "raw": {"followers": followers, "total_stars": total_stars, "own_repos": len(own_repos)},
    }


def _score_breadth(repos: list) -> dict:
    """Score based on repo count and language diversity."""
    own_repos = [r for r in repos if not r.get("fork", False)]
    languages = set(r.get("language") for r in own_repos if r.get("language"))

    repo_count = len(own_repos)
    lang_count = len(languages)

    # repos: 10+ → 50 pts; languages: 5+ → 50 pts
    repo_pts = min(50, int(repo_count / 10 * 50))
    lang_pts = min(50, int(lang_count / 5 * 50))
    score = repo_pts + lang_pts

    return {
        "score": score,
        "label": "Breadth",
        "why": (
            f"{repo_count} original repositories across {lang_count} languages "
            f"({', '.join(sorted(languages)) or 'none detected'}). "
            "Score reflects the variety of your public work."
        ),
        "raw": {"repo_count": repo_count, "language_count": lang_count, "languages": sorted(languages)},
    }


def _parse_ts(ts_str: str) -> float:
    try:
        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        return dt.timestamp()
    except Exception:
        return 0.0


# ---------------------------------------------------------------------------
# AI summary (Anthropic)
# ---------------------------------------------------------------------------

def _generate_summary(user: dict, repos: list, events: list) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return ""

    try:
        import anthropic

        own_repos = [r for r in repos if not r.get("fork", False)]
        languages = list(set(r.get("language") for r in own_repos if r.get("language")))
        recent_event_types = [e.get("type", "") for e in events[:10]]

        prompt = (
            f"GitHub user: {user.get('login')}\n"
            f"Public repos: {user.get('public_repos', 0)}\n"
            f"Followers: {user.get('followers', 0)}\n"
            f"Languages used: {', '.join(languages[:8]) or 'unknown'}\n"
            f"Recent activity types: {', '.join(recent_event_types) or 'none'}\n\n"
            "Write a 2-3 sentence factual summary of this developer's observable public GitHub activity. "
            "Describe only what the data shows. Do not make hiring recommendations or career judgments."
        )

        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()

    except Exception:
        return ""
