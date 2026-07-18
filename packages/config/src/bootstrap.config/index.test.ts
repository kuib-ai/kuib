import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import Std from "@kuib-ai/std";
import bootstrapConfig from ".";
import ensureAppPaths from "../ensure.app.paths";

const originalEnv = { ...process.env };
let workspace = "";

const resetEnv = function (): void {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
};

const writeConfig = function (source: string): string {
  const path = join(workspace, "dist", "config", "kuib", "config.toml");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, source);
  return path;
};

beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), "kuib-config-"));
  writeFileSync(join(workspace, "pnpm-workspace.yaml"), "packages: []\n");
  for (const key of Object.keys(process.env)) {
    if (key === "NODE_ENV" || key.startsWith("KUIB_")) {
      delete process.env[key];
    }
  }
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
  resetEnv();
});

describe("bootstrapConfig", () => {
  it("loads defaults and derives all development application paths", () => {
    const result = bootstrapConfig({ cwd: workspace, mode: "test" });

    expect(result.config.model.default).toBe("groq/llama-3.3-70b-versatile");
    expect(result.config.target.node).toBe(result.config.node.label);
    expect(result.config.telemetry.endpoint).toBeUndefined();
    expect(result.paths).toEqual({
      configFile: join(workspace, "dist", "config", "kuib", "config.toml"),
      meshConfigFile: join(
        workspace,
        "dist",
        "config",
        "kuib",
        "mesh.config.toml",
      ),
      database: join(workspace, "dist", "data", "kuib", "kuib.db"),
      log: join(workspace, "dist", "state", "kuib", "kuib.log"),
      daemonSocket: join(workspace, "dist", "runtime", "kuib", "daemon.sock"),
      engineSocket: join(workspace, "dist", "runtime", "kuib", "engine.sock"),
      cacheDir: join(workspace, "dist", "cache", "kuib"),
    });
    expect(existsSync(dirname(result.paths.database))).toBe(false);
  });

  it("applies config file, environment, then CLI precedence", () => {
    writeConfig(`
[node]
label = "file@node"
[target]
node = "file@target"
[model]
default = "groq/file-model"
[logging]
level = "debug"
[web]
port = 4000
`);
    process.env["KUIB_TARGET_NODE"] = "env@target";
    process.env["KUIB_WEB_PORT"] = "5000";

    const result = bootstrapConfig({
      cwd: workspace,
      mode: "test",
      cli: {
        targetNode: "cli@target",
        model: "anthropic/cli-model",
        webPort: 6000,
      },
    });

    expect(result.config.node.label).toBe("file@node");
    expect(result.config.target.node).toBe("cli@target");
    expect(result.config.model.default).toBe("anthropic/cli-model");
    expect(result.config.logging.level).toBe(Std.LogLevelEnum.DEBUG);
    expect(result.config.web.port).toBe(6000);
  });

  it("loads an alternate config file selected by CLI", () => {
    const path = join(workspace, "alternate.toml");
    writeFileSync(path, '[model]\ndefault = "groq/alternate"\n');

    const result = bootstrapConfig({
      cwd: workspace,
      mode: "test",
      cli: { configFile: path },
    });

    expect(result.paths.configFile).toBe(path);
    expect(result.config.model.default).toBe("groq/alternate");
  });

  it("derives production paths from platform base directories", () => {
    const base = join(workspace, "xdg");
    process.env["XDG_CONFIG_HOME"] = join(base, "config");
    process.env["XDG_DATA_HOME"] = join(base, "data");
    process.env["XDG_STATE_HOME"] = join(base, "state");
    process.env["XDG_CACHE_HOME"] = join(base, "cache");
    process.env["XDG_RUNTIME_DIR"] = join(base, "runtime");

    const result = bootstrapConfig({ cwd: workspace, mode: "production" });

    expect(result.paths.configFile).toBe(
      join(base, "config", "kuib", "config.toml"),
    );
    expect(result.paths.database).toBe(join(base, "data", "kuib", "kuib.db"));
    expect(result.paths.log).toBe(join(base, "state", "kuib", "kuib.log"));
    expect(result.paths.daemonSocket).toBe(
      join(base, "runtime", "kuib", "daemon.sock"),
    );
    expect(result.paths.cacheDir).toBe(join(base, "cache", "kuib"));
  });

  it("keeps secrets and operational overrides outside KuibConfig", () => {
    process.env["KUIB_GROQ_API_KEY"] = "secret";
    process.env["KUIB_DAEMON_URL"] = "http://node.test:8080";
    process.env["KUIB_DB_PATH"] = join(workspace, "custom.db");

    const result = bootstrapConfig({ cwd: workspace, mode: "test" });

    expect(result.secrets.groqApiKey).toBe("secret");
    expect(result.runtime.daemonURL).toBe("http://node.test:8080");
    expect(result.paths.database).toBe(join(workspace, "custom.db"));
    expect("groqApiKey" in result.config).toBe(false);
  });

  it("creates application directories only when explicitly requested", () => {
    const result = bootstrapConfig({ cwd: workspace, mode: "test" });

    ensureAppPaths(result.paths);

    expect(existsSync(dirname(result.paths.database))).toBe(true);
    expect(existsSync(dirname(result.paths.log))).toBe(true);
    expect(existsSync(dirname(result.paths.daemonSocket))).toBe(true);
    expect(existsSync(result.paths.cacheDir)).toBe(true);
  });

  it("rejects unknown config fields instead of silently ignoring typos", () => {
    writeConfig('[logging]\nlevle = "debug"\n');

    expect(() => bootstrapConfig({ cwd: workspace, mode: "test" })).toThrow();
  });
});
