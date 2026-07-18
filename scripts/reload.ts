// Reload kuib's detached background runtime after a code change.
// Kills the auto-spawned daemon + engine-service (which persist across host
// restarts and would otherwise keep serving stale code) and clears their
// sockets so the next host run respawns them fresh.
import { rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = join(dirname(new URL(import.meta.url).pathname), "..");
const runtimeDir = join(repoRoot, "dist", "runtime", "kuib");

const patterns = ["start.daemon", "index.tsx serve", "server/index.ts serve"];
for (const pattern of patterns) {
  spawnSync("pkill", ["-f", pattern]);
}

const sockets = ["daemon.sock", "engine.sock"];
for (const name of sockets) {
  rmSync(join(runtimeDir, name), { force: true });
}

process.stdout.write(
  `kuib reloaded — killed daemon/engine-service, cleared ${runtimeDir}/{${sockets.join(",")}}\n`,
);
