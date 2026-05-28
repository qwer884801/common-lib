#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROTO_DIR="${PROTO_DIR:-${ROOT}/proto}"
OUT_DIR="${OUT_DIR:-${ROOT}/gen/python}"
PYTHON="${PYTHON:-python3}"

contract_proto() {
  case "$1" in
    common) printf '%s\n' "${PROTO_DIR}/byte/v/forge/contracts/common/v1/common.proto" ;;
    dashboard) printf '%s\n' "${PROTO_DIR}/byte/v/forge/contracts/dashboard/v1/dashboard.proto" ;;
    observability) printf '%s\n' "${PROTO_DIR}/byte/v/forge/contracts/observability/v1/hotstream.proto" ;;
    browserautomation) printf '%s\n' "${PROTO_DIR}/byte/v/forge/contracts/browserautomation/v1/browser_automation.proto" ;;
    proxyruntime) printf '%s\n' "${PROTO_DIR}/byte/v/forge/contracts/proxyruntime/v1/proxy_runtime.proto" ;;
    mailbox) printf '%s\n' "${PROTO_DIR}/byte/v/forge/contracts/mailbox/v1/mailbox.proto" ;;
    sms) printf '%s\n' "${PROTO_DIR}/byte/v/forge/contracts/sms/v1/sms.proto" ;;
    all) return 1 ;;
    *.proto) printf '%s\n' "$1" ;;
    *) printf 'unknown contract: %s\n' "$1" >&2; return 2 ;;
  esac
}

if ! "${PYTHON}" -c 'import grpc_tools.protoc' >/dev/null 2>&1; then
  printf 'grpcio-tools is required; install it in the target Python environment\n' >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  args=(all)
else
  args=("$@")
fi
protos=()
add_proto() {
  for existing in "${protos[@]}"; do
    if [[ "${existing}" == "$1" ]]; then
      return
    fi
  done
  protos+=("$1")
}

add_proto "$(contract_proto common)"
for arg in "${args[@]}"; do
  if [[ "${arg}" == all ]]; then
    add_proto "$(contract_proto browserautomation)"
    add_proto "$(contract_proto dashboard)"
    add_proto "$(contract_proto observability)"
    add_proto "$(contract_proto mailbox)"
    add_proto "$(contract_proto proxyruntime)"
    add_proto "$(contract_proto sms)"
  else
    add_proto "$(contract_proto "${arg}")"
  fi
done

rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"

"${PYTHON}" -m grpc_tools.protoc \
  -I "${PROTO_DIR}" \
  --python_out="${OUT_DIR}" \
  --pyi_out="${OUT_DIR}" \
  --grpc_python_out="${OUT_DIR}" \
  "${protos[@]}"

find "${OUT_DIR}" -type d -exec sh -c 'touch "$0/__init__.py"' {} \;
