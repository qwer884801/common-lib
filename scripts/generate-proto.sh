#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PATH="$(go env GOPATH)/bin:$PATH"

rm -rf "$ROOT/gen"
mkdir -p "$ROOT/gen/go"

protoc -I "$ROOT/proto" \
  --go_out="$ROOT" \
  --go_opt=module=github.com/byte-v-forge/common-lib \
  --go-grpc_out="$ROOT" \
  --go-grpc_opt=module=github.com/byte-v-forge/common-lib \
  "$ROOT/proto/byte/v/forge/contracts/common/v1/common.proto" \
  "$ROOT/proto/byte/v/forge/contracts/common/v1/eventbus.proto" \
  "$ROOT/proto/byte/v/forge/contracts/observability/v1/hotstream.proto" \
  "$ROOT/proto/byte/v/forge/contracts/browserautomation/v1/browser_automation.proto" \
  "$ROOT/proto/byte/v/forge/contracts/dashboard/v1/dashboard.proto" \
  "$ROOT/proto/byte/v/forge/contracts/mailbox/v1/mailbox.proto" \
  "$ROOT/proto/byte/v/forge/contracts/proxyruntime/v1/proxy_runtime.proto" \
  "$ROOT/proto/byte/v/forge/contracts/sms/v1/sms.proto" \
  "$ROOT/proto/byte/v/forge/contracts/workflow/v1/workflow.proto"

gofmt -w "$ROOT/gen/go"
