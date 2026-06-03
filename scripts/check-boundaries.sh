#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

failures=0

run_search() {
  local pattern=$1
  local root=$2
  shift 2
  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$@" "$root" || true
    return
  fi
  local grep_args=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --glob)
        grep_args+=("--include=$2")
        shift 2
        ;;
      *)
        shift
        ;;
    esac
  done
  grep -RInE "${grep_args[@]}" "$pattern" "$root" 2>/dev/null || true
}

report_matches() {
  local title=$1
  local matches=$2
  if [[ -z "$matches" ]]; then
    return
  fi
  printf '%s\n%s\n' "$title" "$matches" >&2
  failures=1
}

business_repo_pattern='github\.com/byte-v-forge/(gpt|gpt-private|gopay-app|mailbox|sms|wa-app|proxy-runtime|browser-automation|workflow-runtime|webui)(/|")'
go_matches=$(run_search "$business_repo_pattern" "$repo_root" --glob '*.go')
report_matches "common-lib Go code must not import business or runtime repositories:" "$go_matches"

ui_private_pattern='(from|import)\s*["'\''][^"'\'']*/(internal|private|provider|providers)/'
ui_matches=$(run_search "$ui_private_pattern" "$repo_root/ui/src" --glob '*.ts' --glob '*.tsx')
report_matches "common-lib UI code must not import internal/private/provider paths:" "$ui_matches"

proto_private_pattern='(package|import).*byte\.v\.forge\.(internal|private|provider|providers)\b'
proto_matches=$(run_search "$proto_private_pattern" "$repo_root/proto/byte/v/forge/contracts" --glob '*.proto')
report_matches "public contract proto must not expose internal/private/provider namespaces:" "$proto_matches"

if [[ "$failures" != "0" ]]; then
  exit 1
fi

printf 'common-lib boundary check passed\n'
