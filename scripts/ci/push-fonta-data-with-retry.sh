#!/usr/bin/env bash

set -euo pipefail

repo_dir="${1:?Cal indicar el directori del repositori fonta-data}"
branch="${2:-fonta-data}"
max_attempts="${3:-3}"

for attempt in $(seq 1 "$max_attempts"); do
  if git -C "$repo_dir" push origin "HEAD:$branch"; then
    exit 0
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    echo "No s'ha pogut publicar $branch després de $max_attempts intents." >&2
    exit 1
  fi

  wait_seconds=$((attempt * 5))
  echo "GitHub ha rebutjat temporalment l'intent $attempt; nou intent en ${wait_seconds}s." >&2
  sleep "$wait_seconds"
  git -C "$repo_dir" fetch origin "$branch"
  git -C "$repo_dir" rebase "origin/$branch"
done
