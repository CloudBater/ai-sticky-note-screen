"""
tests/test_api.py

Commit this file BEFORE the implementation (main.py / github_client.py).
That commit order is what earns the TDD score in GRADING.md.

Run:
    cd backend && pip install -r requirements.txt
    pytest ../tests/test_api.py -v
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# The import below will fail until you create backend/main.py.
# That is intentional — commit this file first, then implement.
# ---------------------------------------------------------------------------
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: E402  (imported after path manipulation)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

MOCK_GITHUB_USER = {
    "login": "octocat",
    "name": "The Octocat",
    "public_repos": 8,
    "followers": 9500,
    "following": 9,
    "created_at": "2011-01-25T18:44:36Z",
    "avatar_url": "https://avatars.githubusercontent.com/u/583231",
    "bio": "GitHub mascot",
}

MOCK_GITHUB_REPOS = [
    {
        "name": "Hello-World",
        "stargazers_count": 2000,
        "language": "Python",
        "updated_at": "2024-01-15T00:00:00Z",
        "fork": False,
    },
    {
        "name": "Spoon-Knife",
        "stargazers_count": 1500,
        "language": "JavaScript",
        "updated_at": "2024-03-01T00:00:00Z",
        "fork": False,
    },
    {
        "name": "forked-repo",
        "stargazers_count": 0,
        "language": "TypeScript",
        "updated_at": "2024-02-01T00:00:00Z",
        "fork": True,
    },
]

MOCK_GITHUB_EVENTS = [
    {"type": "PushEvent", "created_at": "2024-03-10T12:00:00Z"},
    {"type": "PullRequestEvent", "created_at": "2024-03-08T10:00:00Z"},
    {"type": "IssuesEvent", "created_at": "2024-02-20T09:00:00Z"},
]


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def test_health():
    """GET /health should return 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Score endpoint — happy path
# ---------------------------------------------------------------------------

@patch("github_client.fetch_user")
@patch("github_client.fetch_repos")
@patch("github_client.fetch_events")
def test_score_returns_three_dimensions(mock_events, mock_repos, mock_user):
    """GET /api/score?username=octocat returns recency, reach, breadth."""
    mock_user.return_value = MOCK_GITHUB_USER
    mock_repos.return_value = MOCK_GITHUB_REPOS
    mock_events.return_value = MOCK_GITHUB_EVENTS

    response = client.get("/api/score?username=octocat")
    assert response.status_code == 200

    data = response.json()
    assert "recency" in data
    assert "reach" in data
    assert "breadth" in data


@patch("github_client.fetch_user")
@patch("github_client.fetch_repos")
@patch("github_client.fetch_events")
def test_score_values_are_between_0_and_100(mock_events, mock_repos, mock_user):
    """Each dimension score must be in [0, 100]."""
    mock_user.return_value = MOCK_GITHUB_USER
    mock_repos.return_value = MOCK_GITHUB_REPOS
    mock_events.return_value = MOCK_GITHUB_EVENTS

    response = client.get("/api/score?username=octocat")
    data = response.json()

    for dim in ("recency", "reach", "breadth"):
        assert 0 <= data[dim]["score"] <= 100, f"{dim} score out of range"


@patch("github_client.fetch_user")
@patch("github_client.fetch_repos")
@patch("github_client.fetch_events")
def test_score_includes_explanation(mock_events, mock_repos, mock_user):
    """Each dimension must include a 'why' explanation string."""
    mock_user.return_value = MOCK_GITHUB_USER
    mock_repos.return_value = MOCK_GITHUB_REPOS
    mock_events.return_value = MOCK_GITHUB_EVENTS

    response = client.get("/api/score?username=octocat")
    data = response.json()

    for dim in ("recency", "reach", "breadth"):
        assert "why" in data[dim], f"missing 'why' in {dim}"
        assert isinstance(data[dim]["why"], str)
        assert len(data[dim]["why"]) > 0


@patch("github_client.fetch_user")
@patch("github_client.fetch_repos")
@patch("github_client.fetch_events")
def test_score_includes_cache_metadata(mock_events, mock_repos, mock_user):
    """Response must include cache_hit and rate_limit_remaining."""
    mock_user.return_value = MOCK_GITHUB_USER
    mock_repos.return_value = MOCK_GITHUB_REPOS
    mock_events.return_value = MOCK_GITHUB_EVENTS

    response = client.get("/api/score?username=octocat")
    data = response.json()

    assert "cache_hit" in data
    assert "rate_limit_remaining" in data


# ---------------------------------------------------------------------------
# Score endpoint — error cases
# ---------------------------------------------------------------------------

def test_score_missing_username_returns_422():
    """GET /api/score without username param should return 422."""
    response = client.get("/api/score")
    assert response.status_code == 422


@patch("github_client.fetch_user")
def test_score_unknown_user_returns_404(mock_user):
    """If GitHub returns 404, the API should surface a 404."""
    mock_user.side_effect = Exception("404 Not Found")

    response = client.get("/api/score?username=this-user-does-not-exist-xyz")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Caching behaviour
# ---------------------------------------------------------------------------

@patch("github_client.fetch_user")
@patch("github_client.fetch_repos")
@patch("github_client.fetch_events")
def test_second_request_is_cache_hit(mock_events, mock_repos, mock_user):
    """Second identical request should return cache_hit=true."""
    mock_user.return_value = MOCK_GITHUB_USER
    mock_repos.return_value = MOCK_GITHUB_REPOS
    mock_events.return_value = MOCK_GITHUB_EVENTS

    client.get("/api/score?username=octocat")          # warm the cache
    response = client.get("/api/score?username=octocat")  # should be cached
    data = response.json()

    assert data["cache_hit"] is True