// @context @journal/host-layer @journal/security-model
import { dirname, join, extname } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import Cli from "@kuib-ai/cli";
import Config from "@kuib-ai/config";
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import Daemon from "@kuib-ai/daemon";
import EventLogSqlite from "@kuib-ai/event-log-sqlite";

import Std from "@kuib-ai/std";
import Telemetry from "@kuib-ai/telemetry";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import type { CliSchema } from "@kuib-ai/cli/cli.schema";

const HOSTED_ORIGIN = "https://code.kuib.ai";

const cliSchema: CliSchema = {
  description: "Kuib AI Web Host",
  options: {
    config: { type: "string", description: "Alternate config.toml path" },
    session: { type: "string", description: "Default session ID" },
    model: { type: "string", description: "Model selector" },
    port: { type: "string", description: "Web listen port" },
    "db-path": { type: "string", description: "Alternate SQLite path" },
    "daemon-socket": {
      type: "string",
      description: "Alternate daemon socket",
    },
  },
};

type WebCliValues = {
  config?: string;
  session?: string;
  model?: string;
  port?: string;
  "db-path"?: string;
  "daemon-socket"?: string;
};

type Pairing = {
  code: string;
  expiresAt: number;
};

const mintToken = function (): string {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
};

const mintPairingCode = function (): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
    if (i === 3) {
      out += "-";
    }
  }
  return out;
};

const detectTailscaleIp = function (
  override: string | undefined,
): string | null {
  if (override !== undefined && override.length > 0) {
    return override;
  }
  const [err, out] = Std.withError(function () {
    return Bun.spawnSync(["tailscale", "ip", "-4"]).stdout.toString().trim();
  });

  if (err || !out) {
    return null;
  }

  const first = out.split("\n")[0]?.trim();
  return first && /^\d+\.\d+\.\d+\.\d+$/.test(first) ? first : null;
};

const main = async function (): Promise<void> {
  const parsed = Cli.parseCli<WebCliValues>("web", cliSchema);
  if (parsed === null) {
    return;
  }
  const values = parsed.values;
  const bootstrap = Config.bootstrapConfig({
    cli: {
      configFile: values.config,
      sessionID: values.session,
      model: values.model,
      webPort: values.port,
      database: values["db-path"],
      daemonSocket: values["daemon-socket"],
    },
  });
  Config.ensureAppPaths(bootstrap.paths);

  Telemetry.startTelemetry({
    endpoint: bootstrap.config.telemetry.endpoint,
    serviceName: "kuib-engine",
  });
  const port = bootstrap.config.web.port;
  const dbPath = bootstrap.paths.database;
  const deviceID = Protocol.ID.DeviceID.parse(crypto.randomUUID());
  const tsIp = detectTailscaleIp(bootstrap.runtime.webTailscaleIP);

  const tsIpEsc = tsIp?.replace(/\./g, "\\.");
  const loopFrag = `localhost|127\\.0\\.0\\.1${tsIpEsc ? "|" + tsIpEsc : ""}`;
  const tsNameFrag = "[a-z0-9-]+\\.ts\\.net";
  const hostRe = new RegExp(`^(${loopFrag}|${tsNameFrag})(:\\d+)?$`, "i");
  const originRe = new RegExp(
    `^https?://(${loopFrag}|${tsNameFrag})(:\\d+)?$`,
    "i",
  );

  const modelConfig = Engine.Provider.resolveModelConfig({
    model: bootstrap.config.model.default,
    baseURL: bootstrap.config.model.baseURL,
    apiKey: bootstrap.secrets.modelApiKey,
    anthropicApiKey: bootstrap.secrets.anthropicApiKey,
    groqApiKey: bootstrap.secrets.groqApiKey,
  });
  const model = Engine.Provider.createModel(modelConfig);
  const daemonEndpoint = await Daemon.resolveDaemonEndpoint(
    bootstrap.runtime.daemonURL,
    bootstrap.paths.daemonSocket,
  );
  const daemonClient = Engine.DaemonClient.createDaemonClient(daemonEndpoint);
  const eventLog = EventLogSqlite.createSqliteEventLog(dbPath);
  const reader = EventLogSqlite.createSqliteReader(dbPath);

  const activeRuns = new Map<string, number>();
  const bump = function (sid: string, delta: number): void {
    activeRuns.set(sid, Math.max(0, (activeRuns.get(sid) ?? 0) + delta));
  };

  const token = mintToken();
  let pairing: Pairing | null = null;
  let pairAttempts = 0;

  const allowedOrigin = function (origin: string | null): string | null {
    if (origin === null) {
      return null;
    }
    if (origin === HOSTED_ORIGIN) {
      return origin;
    }
    if (originRe.test(origin)) {
      return origin;
    }
    return null;
  };

  const hostOk = function (host: string | null): boolean {
    if (host === null) {
      return false;
    }
    return hostRe.test(host);
  };

  const bearer = function (req: Request, url: URL): string | null {
    const header = req.headers.get("authorization");
    if (header?.startsWith("Bearer ")) {
      return header.slice(7);
    }
    return url.searchParams.get("token");
  };

  const cors = function (
    origin: string | null,
    req: Request,
  ): Record<string, string> {
    const headers: Record<string, string> = { vary: "Origin" };
    const ok = allowedOrigin(origin);
    if (ok !== null) {
      headers["access-control-allow-origin"] = ok;
      headers["access-control-allow-methods"] = "GET, POST, OPTIONS";
      headers["access-control-allow-headers"] = "authorization, content-type";
      headers["access-control-max-age"] = "600";
      if (
        req.headers.get("access-control-request-private-network") === "true"
      ) {
        headers["access-control-allow-private-network"] = "true";
      }
    }
    return headers;
  };

  const json = function (
    body: unknown,
    status: number,
    headers: Record<string, string>,
  ): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
  };

  const handler = async function (req: Request): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("origin");
    const ch = cors(origin, req);

    if (!hostOk(req.headers.get("host"))) {
      return json({ error: "bad host" }, 421, ch);
    }
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: ch });
    }
    if (origin !== null && allowedOrigin(origin) === null) {
      return json({ error: "origin not allowed" }, 403, ch);
    }

    if (url.pathname === "/pair" && req.method === "POST") {
      if (pairing === null || Date.now() > pairing.expiresAt) {
        return json({ error: "no active pairing" }, 410, ch);
      }
      if (pairAttempts >= 5) {
        return json({ error: "too many attempts" }, 429, ch);
      }
      pairAttempts++;
      const body = (await req.json().catch(function () {
        return {};
      })) as { code?: string };
      if (body.code !== pairing.code) {
        return json({ error: "bad code" }, 401, ch);
      }
      pairing = null;
      return json({ token }, 200, ch);
    }

    if (url.pathname === "/api/token" && req.method === "GET") {
      if (!bootstrap.runtime.webDev || origin === HOSTED_ORIGIN) {
        return json({ error: "not available" }, 404, ch);
      }
      return json({ token }, 200, ch);
    }

    if (req.method === "GET" && !url.pathname.startsWith("/api")) {
      const distDir = join(
        dirname(new URL(import.meta.url).pathname),
        "..",
        "..",
        "dist",
      );
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const html = readFileSync(join(distDir, "index.html"), "utf8").replace(
          "__KUIB_TOKEN__",
          token,
        );
        return new Response(html, { headers: { "content-type": "text/html" } });
      }
      const filePath = join(distDir, url.pathname);
      if (existsSync(filePath)) {
        const ext = extname(filePath);
        const type =
          ext === ".js"
            ? "text/javascript"
            : ext === ".css"
              ? "text/css"
              : ext === ".html"
                ? "text/html"
                : "application/octet-stream";
        return new Response(readFileSync(filePath), {
          headers: { "content-type": type },
        });
      }
    }

    if (bearer(req, url) !== token) {
      return json({ error: "unauthorized" }, 401, ch);
    }

    const sessionParam =
      url.searchParams.get("sessionID") ?? bootstrap.runtime.sessionID;
    const sessionID = Protocol.ID.SessionID.parse(sessionParam);

    if (url.pathname === "/api/events/since" && req.method === "GET") {
      const afterSeq = Number(url.searchParams.get("afterSeq") ?? "-1");
      const batch: EventEnvelope[] = [];
      reader.replay(sessionID, afterSeq, function (envelope) {
        return batch.push(envelope);
      });
      return json({ events: batch }, 200, ch);
    }

    if (url.pathname === "/api/status" && req.method === "GET") {
      let headSeq = -1;
      reader.replay(sessionID, -1, function (envelope) {
        if (envelope.seq > headSeq) {
          headSeq = envelope.seq;
        }
      });
      return json(
        { activeRun: (activeRuns.get(sessionID) ?? 0) > 0, headSeq },
        200,
        ch,
      );
    }

    if (url.pathname === "/api/submit" && req.method === "POST") {
      if (!req.headers.get("content-type")?.includes("application/json")) {
        return json(
          { error: "content-type must be application/json" },
          415,
          ch,
        );
      }
      const body = (await req.json().catch(function () {
        return {};
      })) as {
        prompt?: string;
        sessionID?: string;
      };
      const submitSession = Protocol.ID.SessionID.parse(
        body.sessionID ?? sessionParam,
      );
      const prompt = (body.prompt ?? "").trim();
      if (prompt.length === 0) {
        return json({ error: "empty prompt" }, 400, ch);
      }
      bump(submitSession, +1);
      void Engine.runAgent({
        prompt,
        sessionID: submitSession,
        deviceID,
        model,
        daemonClient,
        eventLog,
      })
        .catch(function () {})
        .finally(function () {
          return bump(submitSession, -1);
        });
      return json({ ok: true }, 202, ch);
    }

    if (url.pathname === "/api/events" && req.method === "GET") {
      const lastEventId = req.headers.get("last-event-id");
      const afterSeq =
        lastEventId !== null
          ? Number(lastEventId.split(":")[1] ?? "-1")
          : Number(url.searchParams.get("afterSeq") ?? "-1");

      let unsubscribe: (() => void) | null = null;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      const stream = new ReadableStream({
        start(controller): void {
          const enc = new TextEncoder();
          const push = function (text: string): void {
            Std.withError(function () {
              return controller.enqueue(enc.encode(text));
            });
          };
          const send = function (envelope: EventEnvelope): void {
            push(
              `id: ${envelope.epoch}:${envelope.seq}\ndata: ${JSON.stringify(envelope)}\n\n`,
            );
          };
          unsubscribe = reader.subscribe(sessionID, send, afterSeq);
          heartbeat = setInterval(function () {
            return push(`: ping\n\n`);
          }, 15000);
        },
        cancel(): void {
          if (heartbeat !== null) {
            clearInterval(heartbeat);
          }
          unsubscribe?.();
        },
      });
      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
          ...ch,
        },
      });
    }

    return json({ error: "not found" }, 404, ch);
  };

  const bindHosts = ["127.0.0.1", ...(tsIp ? [tsIp] : [])];
  const servers = bindHosts.map(function (hostname) {
    return Bun.serve({ hostname, port, idleTimeout: 255, fetch: handler });
  });
  const server = servers[0]!;

  pairing = { code: mintPairingCode(), expiresAt: Date.now() + 5 * 60 * 1000 };

  const tsLine = tsIp ? `  tailnet:  http://${tsIp}:${server.port}\n` : "";
  process.stdout.write(
    `\nkuib web → http://127.0.0.1:${server.port}\n` +
      tsLine +
      `  open a URL above in a browser (local, no pairing needed)\n` +
      `  or open ${HOSTED_ORIGIN} and paste pairing code:  ${pairing.code}  (5 min, single-use)\n` +
      `  model: ${modelConfig.modelID} via ${modelConfig.npm}\n\n`,
  );
};

void main().catch(function (error: Error) {
  process.stderr.write(`kuib web failed to start: ${error.message}\n`);
  process.exit(1);
});
