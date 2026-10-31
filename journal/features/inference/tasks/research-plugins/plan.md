# research-plugins — plan

Gate: none (no GO needed). Read-only outside the two granted paths.

## Moves, in order

1. Context: AGENTS.md naming and one-home rules; inference D002–D011, D015, D019, D031, G002,
   G003, G007, G016, P02-I03, P03-I01; synthesis shapes 4 and 7; the extension axes (H) of the
   four prior-art files; engine-foundation D001, D002, D004, D007, G001–G003 and the Deno
   bundling research; R009, R216, R217, R221; the claims `^protocol-ports`, `^package-barrels`,
   `^house-structure-rules` and the code they point at. Verified by: listed in `## What was
   read` of the research file.
2. Clones (shallow, sparse) under `/var/tmp/kuib-prior-art/research-plugins/<repo>/`, commit
   recorded per repo: opencode, pi, vscode, backstage, vite, rollup, go-plugin, terraform,
   mcp spec + typescript-sdk, fastify, obsidian-api. Secondary subjects only where they add a
   cut or a harm (fastify encapsulation, OSGi registry, Obsidian, Neovim, Grafana via docs).
3. Per primary subject, read: the plugin interface, the registry, the loader, the path
   built-ins take, special cases for built-ins; then issues/changelogs/RFCs for breaking
   contract changes, ordering/conflict bugs, performance and loading security. Write each
   subject into `## How the subjects cut it` as it is finished (resume point).
4. Deno probes under `/var/tmp/kuib-prior-art/research-plugins/probe/`, workspace Deno
   (2.9.6) with `--no-lock`, through `/var/tmp/kuib-guard.sh 30 1500 --`: a `deno compile`
   binary importing at runtime a local file, `https:`, `jsr:`, `npm:`; which flags
   (`--include`, `--allow-import`, `--allow-read`) each needs; a Worker with permissions; a
   subprocess over stdio. Record command, version, output. Delete binaries once measured.
5. Write `## Deno`, `## Cuts for kuib`, `## Recommendation`, `## Unverified leads`; names held
   against siblings found in step 1 (ports `*.port`, enums `*.enum`, barrels, `start.*`,
   `create.*`, `define.*`).
6. `pnpm journal check`; `report.md` (findings, plan updates, names); `pnpm orchestra done
   research-plugins`.

## Verification

- Every subject statement carries `owner/repo@<short>:path:line` or URL + date; CONFIRMED vs
  INFERRED marked; sub-agent findings reopened in the source before citing.
- Probes carry the exact command, Deno version and deciding output.
- `pnpm journal check` passes with the research file present.

## Undecided by the brief

- Depth on secondary subjects: taken only where a cut or harm is absent from the primaries.
- Which Terraform repository stands for "providers": `hashicorp/terraform` (protocol docs and
  the plugin client) is used; `terraform-plugin-go` only if negotiation details need it.
