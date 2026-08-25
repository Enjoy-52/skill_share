#!/usr/bin/env bash
# Release milestone: commit, push, releases/vX branch, tag, back to dev.
set -euo pipefail

VERSION="${1:-}"
BASE_BRANCH="${BASE_BRANCH:-dev}"
REPO_ROOT="${REPO_ROOT:-}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-}"
DRY_RUN="${DRY_RUN:-0}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>   e.g. v1.0.0 or 1.0.0" >&2
  exit 1
fi

normalize_version() {
  local v="$1"
  v="${v#v}"
  v="${v#V}"
  echo "v${v}"
}

run_git() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] git $*"
    return 0
  fi
  git "$@"
}

VER="$(normalize_version "$VERSION")"
RELEASE_BRANCH="releases/${VER}"

if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [[ -z "$REPO_ROOT" ]]; then
  echo "Not a git repository. Set REPO_ROOT." >&2
  exit 1
fi
cd "$REPO_ROOT"
echo "Repo: $REPO_ROOT"
echo "Version: $VER | Release branch: $RELEASE_BRANCH | Base: $BASE_BRANCH"

CURRENT="$(git branch --show-current)"
if [[ "$CURRENT" != "$BASE_BRANCH" ]]; then
  echo "Checking out $BASE_BRANCH (was on $CURRENT)"
  run_git checkout "$BASE_BRANCH"
fi

run_git pull origin "$BASE_BRANCH" || true

if [[ -n "$(git status --porcelain)" ]]; then
  MSG="${COMMIT_MESSAGE:-chore(release): milestone $VER}"
  echo "Committing changes..."
  run_git add -A
  run_git commit -m "$MSG"
else
  echo "Working tree clean, skip commit."
fi

echo "Pushing $BASE_BRANCH..."
run_git push origin "$BASE_BRANCH"

if git show-ref --verify --quiet "refs/heads/$RELEASE_BRANCH"; then
  echo "Branch $RELEASE_BRANCH exists, merging $BASE_BRANCH"
  run_git checkout "$RELEASE_BRANCH"
  run_git merge "$BASE_BRANCH" --no-edit
else
  echo "Creating $RELEASE_BRANCH..."
  run_git checkout -b "$RELEASE_BRANCH"
fi

run_git push -u origin "$RELEASE_BRANCH"

if git rev-parse "$VER" >/dev/null 2>&1; then
  echo "Tag $VER already exists, skip tag create."
else
  run_git tag -a "$VER" -m "Release $VER"
fi
run_git push origin "$VER"

echo "Back to $BASE_BRANCH..."
run_git checkout "$BASE_BRANCH"

echo ""
echo "Done."
echo "  Branch: $RELEASE_BRANCH (pushed)"
echo "  Tag:    $VER (pushed)"
echo "  Current: $BASE_BRANCH"
