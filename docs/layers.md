# common-lib layering

`common-lib` is a public platform library, not a business aggregation layer.

## Layers

- `proto/byte/v/forge/contracts`: public cross-repository contracts. This is the source of truth for shared domain projections, service APIs, action metadata, events, status and error codes.
- `gen/go` and `ui/src/proto`: generated artifacts from the public proto contracts. They are never edited by hand.
- Runtime helpers such as `httpx`, `redisx`, `eventbus`, `eventoutbox`, `grpchealth`, `protojsonx`, `redactx` and `timex`: provider-free infrastructure primitives.
- `ui`: shared dashboard UI primitives and generated contract consumers. It can host generic shell, table, action and formatting components, but not service-owned pages or provider workflows.

## Forbidden Dependencies

- No import from sibling business/runtime repositories such as `gpt`, `mailbox`, `sms`, `wa-app`, `proxy-runtime`, `browser-automation`, `workflow-runtime` or `webui`.
- No internal/private/provider raw shape in public contracts.
- No business state machine, service-owned persistence model, provider branch, provider credential shape or dashboard page in this repository.
- No handwritten second model when generated proto types exist.

## Refactor Gates

- Run `scripts/check-boundaries.sh` before moving reusable code into `common-lib`.
- Run `scripts/check-proto-breaking.py --base <ref>` before changing public proto contracts.
- Run `scripts/list-contract-consumers.py --source-root ..` when planning a contract migration to identify impacted repositories.
