#!/usr/bin/env bash
# Create release branch(es) + same-named annotated tag(s), push, checkout dev.
# Usage: create-release-refs.sh <分支名称> [分支名称...]
set -euo pipefail

if [[ $# -lt 1 ]]; then
  cat <<'EOF' >&2
本 Skill 需要传入变量 [分支名称]（可多个）。
示例：bash ~/.cursor/skills/git-release-branch-tag/scripts/create-release-refs.sh releases/v0.3.3
或：bash ~/.cursor/skills/git-release-branch-tag/scripts/create-release-refs.sh releases/v0.3.3 releases/hotfix-ocr
EOF
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "error: not inside a git repository" >&2
  exit 1
fi
cd "${ROOT}"

TIP="$(git rev-parse HEAD)"
echo "tip=${TIP}"
echo "names=$*"

for NAME in "$@"; do
  if [[ -z "${NAME}" ]]; then
    continue
  fi
  if git show-ref --verify --quiet "refs/tags/${NAME}"; then
    echo "error: tag already exists: ${NAME}" >&2
    exit 1
  fi
  if git show-ref --verify --quiet "refs/heads/${NAME}"; then
    echo "error: local branch already exists: ${NAME}" >&2
    exit 1
  fi
  if git ls-remote --exit-code --heads origin "${NAME}" >/dev/null 2>&1; then
    echo "error: remote branch already exists: ${NAME}" >&2
    exit 1
  fi
  if git ls-remote --exit-code --tags origin "${NAME}" >/dev/null 2>&1; then
    echo "error: remote tag already exists: ${NAME}" >&2
    exit 1
  fi

  git branch "${NAME}" "${TIP}"
  git tag -a "${NAME}" -m "${NAME}" "${TIP}"
  git push -u origin "refs/heads/${NAME}:refs/heads/${NAME}"
  git push origin "refs/tags/${NAME}"
  echo "ok branch+tag: ${NAME}"
done

git checkout dev
git status -sb
echo "done: back on $(git branch --show-current)"
