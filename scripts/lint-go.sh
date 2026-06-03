#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${repo_root}"

modules=(".")

unformatted="$(
  for module in "${modules[@]}"; do
    if [[ -d "${module}" ]]; then
      find "${module}" \
        \( -path '*/.git' -o -path '*/vendor' -o -path '*/node_modules' -o -path '*/dist' \) -prune \
        -o -name '*.go' -exec gofmt -l {} +
    fi
  done | sort -u
)"

if [[ -n "${unformatted}" ]]; then
  echo "gofmt required for:"
  echo "${unformatted}"
  exit 1
fi

echo "common-lib boundary check"
bash scripts/check-boundaries.sh

proto_breaking_base=${PROTO_BREAKING_BASE:-origin/main}
if git rev-parse --verify "${proto_breaking_base}^{commit}" >/dev/null 2>&1; then
  echo "proto breaking check against ${proto_breaking_base}"
  python3 scripts/check-proto-breaking.py --base "${proto_breaking_base}"
else
  echo "skip proto breaking check; base ref unavailable: ${proto_breaking_base}"
fi

echo "event catalog check"
python3 scripts/check-event-catalog.py

for module in "${modules[@]}"; do
  if [[ -f "${module}/go.mod" ]]; then
    echo "go vet ${module}"
    (cd "${module}" && go vet ./...)
  fi
done
