"""
backend/github_client.py

Thin wrapper around GitHub REST API.
All functions raise Exception with status code in the message on failure.
"""

import os
import requests

GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    token = os.getenv("GITHUB_PAT", "")
    h = {"Accept": "application/vnd.github+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def fetch_user(username: str) -> dict:
    resp = requests.get(f"{GITHUB_API}/users/{username}", headers=_headers(), timeout=10)
    if resp.status_code == 404:
        raise Exception(f"404 Not Found: {username}")
    resp.raise_for_status()
    return resp.json()


def fetch_repos(username: str, per_page: int = 100) -> list:
    resp = requests.get(
        f"{GITHUB_API}/users/{username}/repos",
        headers=_headers(),
        params={"per_page": per_page, "sort": "updated"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def fetch_events(username: str, per_page: int = 100) -> list:
    resp = requests.get(
        f"{GITHUB_API}/users/{username}/events/public",
        headers=_headers(),
        params={"per_page": per_page},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def fetch_rate_limit() -> int:
    resp = requests.get(f"{GITHUB_API}/rate_limit", headers=_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data.get("rate", {}).get("remaining", -1)
