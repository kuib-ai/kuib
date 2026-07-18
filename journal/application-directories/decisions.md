---
title: "Application Directories"
type: implementation
status: decided
layer: architecture
created: 2026-07-15
tags: [xdg, paths, config, directories, macos, windows, linux, fhs]
depends-on: ["[[architecture-overview]]", "[[host-layer]]", "[[security-model]]"]
informs: ["[[distributed-mesh-state]]", "[[observability]]", "[[infrastructure-strategy]]"]
---

# Application Directories

Where kuib stores config, data, state, cache, logs, and runtime IPC — per OS — and how `@kuib-ai/env` exposes **base directories only** (no app filenames; no `kuib/` suffix in the infra layer).

## Decision

**Kuib is a CLI/TUI (and daemon), not a macOS GUI app.** Savvy users of tools like git, neovim, gh, docker, terraform expect **XDG-style paths on Unix (including macOS)**. On Windows, use the **Known Folder** API. File names and the app subdirectory (`kuib/`) are **application logic** owned by consumers.

Precedence for resolved paths: `defaults < config file < env override < CLI` (see [[architecture-overview]]). Local **dev** does not write into real user dirs — `@kuib-ai/env` remaps bases under the workspace `dist/<kind>/`.

## Research (2026-07-15)

Sources scraped via Firecrawl:

- [XDG Base Directory Specification v0.8](https://specifications.freedesktop.org/basedir/latest/) (freedesktop)
- [Apple — macOS Library Directory Details](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/MacOSXDirectories/MacOSXDirectories.html)
- [Microsoft — Known Folder IDs](https://learn.microsoft.com/en-us/windows/win32/shell/knownfolderid)
- [dirs crate](https://docs.rs/dirs/latest/dirs/) (platform mapping library)
- [becca.ooo — macOS CLI configs belong in `~/.config`](https://becca.ooo/blog/macos-dotfiles/)
- [Atmos — switched macOS from Application Support to XDG for CLI](https://atmos.tools/changelog/macos-xdg-cli-conventions/)

### Linux — XDG (canonical)

| Kind | Env | Default |
|---|---|---|
| config | `$XDG_CONFIG_HOME` | `$HOME/.config` |
| data | `$XDG_DATA_HOME` | `$HOME/.local/share` |
| state | `$XDG_STATE_HOME` | `$HOME/.local/state` (logs, history — persists but not “important” data) |
| cache | `$XDG_CACHE_HOME` | `$HOME/.cache` |
| runtime | `$XDG_RUNTIME_DIR` | `/run/user/$UID` (must be `0700`, cleared on logout; sockets/PID files) |

Classic FHS (`/etc`, `/var`) is **system/root** scope. Per-user agents must not use it.

### macOS — Apple Library vs CLI expectation

Apple documents (for **apps** with bundle IDs):

| Kind | Apple default |
|---|---|
| app support / data | `~/Library/Application Support/<bundle-id>/` |
| cache | `~/Library/Caches/<bundle-id>/` |
| logs | `~/Library/Logs/` |
| preferences | `~/Library/Preferences/` via `NSUserDefaults` — not hand-edited files |

Libraries like Rust `dirs`, Python `platformdirs`, JS `env-paths` often map “config” → Application Support on macOS. That matches **GUI apps**.

**CLI community expectation (deciding factor for kuib):** config in `~/.config` (honor `$XDG_*` when set). Evidence: Apple-shipped `git`/`vim`/`bash` use home/`~/.config`; chezmoi/yadm/dotbot ignore Application Support by default; Atmos, gh, packer, stripe, kubectl, docker, terraform use `~/.config` on macOS; becca.ooo argues Application Support docs assume `/Applications` + bundle ID + app-managed prefs — none of which apply to a CLI.

**Decision for kuib on macOS:** same XDG defaults as Linux (`~/.config`, `~/.local/share`, `~/.local/state`, `~/.cache`). Runtime: `$XDG_RUNTIME_DIR` if set, else a short `0700` fallback (e.g. `$TMPDIR` — watch unix socket path length).

Do **not** use `~/Library/Application Support/kuib` for the CLI/daemon.

### Windows — Known Folders

| Kind | Known Folder | Default |
|---|---|---|
| config (roaming) | `FOLDERID_RoamingAppData` | `%APPDATA%` → `%USERPROFILE%\AppData\Roaming` |
| data / cache / state (machine-local) | `FOLDERID_LocalAppData` | `%LOCALAPPDATA%` → `%USERPROFILE%\AppData\Local` |
| runtime | no XDG equivalent | prefer a per-user temp / local run dir under LocalAppData (or `%TEMP%`); not Roaming |

Roaming = sync-worthy settings. Local = DB, logs, cache, sockets (don’t roam a SQLite WAL or unix-style IPC).

## Infra API contract (`@kuib-ai/env`)

Expose **base directories only** (Zod `BaseDirs`: `config | data | state | cache | runtime`).

- **Not** in infra: app name `kuib`, `config.toml`, `mesh.config.toml`, `kuib.db`, `engine.sock`, log filenames.
- **Consumers** compose: `join(dirs.config, "kuib", "mesh.config.toml")`, etc.
- **Dev (default when `NODE_ENV !== "production"`):** `resolveDirs()` → `<workspace>/dist/{config,data,state,cache,runtime}` so local runs never pollute real user dirs. Baked into the package — consumers should not reimplement this.
- **Prod:** platform bases above (XDG on Linux+macOS; Known Folders on Windows).
- **Options:** `resolveDirs({ dev?: boolean, cwd?: string, platform?: "darwin" | "linux" | "win32" })` / same on `resolveDir(kind, options)`. Explicit `dev: false` forces platform bases; `dev: true` forces workspace `dist`. `platform` is mainly for tests / explicit routing.

## Example consumer layout (after app suffix)

| Artifact | Linux / macOS | Windows |
|---|---|---|
| `config.toml` | `~/.config/kuib/config.toml` | `%APPDATA%\kuib\config.toml` |
| `mesh.config.toml` | `~/.config/kuib/mesh.config.toml` | `%APPDATA%\kuib\mesh.config.toml` |
| SQLite DB | `~/.local/share/kuib/kuib.db` | `%LOCALAPPDATA%\kuib\kuib.db` |
| logs | `~/.local/state/kuib/kuib.log` | `%LOCALAPPDATA%\kuib\logs\kuib.log` |
| sockets | `$XDG_RUNTIME_DIR/kuib/*.sock` | `%LOCALAPPDATA%\kuib\run\*.sock` (or equivalent) |
| cache | `~/.cache/kuib/` | `%LOCALAPPDATA%\kuib\cache\` |

Secrets stay out of these files (env / keychain) — [[security-model]].

## Consequences

- Cross-device mesh + dotfile managers work the same on Linux and macOS.
- Rejects `dirs`/`env-paths` default macOS Application Support mapping for this product class.
- Windows gets roaming config vs local data correctly.
- Current one-off resolvers (`~/.kuib`, db-next-to-log, etc.) should migrate to this contract when consumers are restructured.
