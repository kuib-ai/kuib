# Progress — Tool System

## 2026-07-01 — initial build (readFile)

Done:

- `packages/protocol/src/file.system/{read.file.input,read.file.output}` + `file.system` barrel; `file.system.port` (`FileSystemPort` interface). Added `FileSystem` to the top `Protocol` namespace.
- `packages/tools` package: `tool.spec` (`defineTool` + `ToolSpec`/`ToolContext`), `read.file`, `tool.registry`, barrel.
- `packages/engine`: `provider/build.tools` (registry → AI SDK tools), `daemon.file.system` (`FileSystemPort` backed by the daemon tRPC client). Orchestrator swapped from inline `tool()` blocks to `Provider.buildTools(Tools.registry, { fs })`; dropped the direct `ai` `tool` import. Tool lifecycle events emitted from the `fullStream` loop.
- `packages/daemon`: `read.file` procedure now imports schemas from `protocol`; deleted the duplicated `io/read.file.*`. Added `@kuib-ai/protocol` dep. Engine gained `@kuib-ai/tools` dep.
- `build.messages` type-guard fixed + comments stripped to house style.

Verified: typecheck clean (protocol/tools/daemon/engine); readFile executed end-to-end against minerva + live daemon with lifecycle events logged.

Next:

- `apps/daemon` / `kuib daemon` role so tools run without an ad-hoc daemon start.
- `tool-error` → `TOOL_CALL_FAILED`.
- Risk field on `ToolSpec`.
