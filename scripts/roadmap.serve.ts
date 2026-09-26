// @claim infra/roadmap-serve
import { existsSync, readFileSync, statSync } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { spawnSync } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  edgeArrow,
  neighbourhood,
  readRoadmapGraph,
  type RoadmapGraph,
  type RoadmapNode,
} from "./roadmap.graph.ts";

const ASSETS: Record<string, string> = {
  "/mermaid/": fileURLToPath(
    new URL("../node_modules/mermaid/dist/", import.meta.url),
  ),
  "/layout-elk/": fileURLToPath(
    new URL("../node_modules/@mermaid-js/layout-elk/dist/", import.meta.url),
  ),
};

const CONTENT_TYPES: Record<string, string> = {
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".map": "application/json",
};

// @claim infra/roadmap-canvas
const HORIZON_STYLES: Record<string, string> = {
  now: "fill:#123524,stroke:#34d399,color:#ecfdf5",
  next: "fill:#172a4a,stroke:#60a5fa,color:#eff6ff",
  later: "fill:#3a2a10,stroke:#f59e0b,color:#fffbeb",
  maybe: "fill:#262626,stroke:#a3a3a3,color:#e5e5e5",
  closed: "fill:#1c1c1c,stroke:#525252,color:#a3a3a3",
};

const { values } = parseArgs({
  options: {
    host: { type: "string" },
    port: { type: "string", default: "4700" },
  },
});

type Listener = { host: string; name: string };

type TailscaleSelf = { DNSName?: string; TailscaleIPs?: string[] };

// @claim infra/roadmap-serve
const tailnetListener = function (): Listener | undefined {
  const result = spawnSync("tailscale", ["status", "--json"], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return undefined;
  }
  const self = (JSON.parse(result.stdout) as { Self?: TailscaleSelf }).Self;
  const host = self?.TailscaleIPs?.find(function (ip) {
    return ip.includes(".");
  });
  if (host === undefined) {
    return undefined;
  }
  return { host, name: self?.DNSName?.replace(/\.$/, "") || host };
};

const escapeHtml = function (text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const nodeLine = function (node: RoadmapNode): string {
  const title = node.title.replace(/</g, "#lt;").replace(/>/g, "#gt;");
  return `${node.id}["<b>${node.id}</b><br>${title}"]:::${node.horizon}`;
};

// @claim infra/roadmap-canvas
const toMermaid = function (graph: RoadmapGraph, grouped: boolean): string {
  const lines = ["flowchart TB"];
  for (const [horizon, style] of Object.entries(HORIZON_STYLES)) {
    lines.push(`  classDef ${horizon} ${style}`);
  }
  if (grouped) {
    for (const horizon of Object.keys(HORIZON_STYLES)) {
      const members = graph.nodes.filter(function (node) {
        return node.horizon === horizon;
      });
      if (members.length === 0) continue;
      lines.push(`  subgraph ${horizon}`);
      for (const node of members) lines.push(`    ${nodeLine(node)}`);
      lines.push("  end");
    }
  } else {
    for (const node of graph.nodes) lines.push(`  ${nodeLine(node)}`);
  }
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} ${edgeArrow(edge)} ${edge.to}`);
  }
  if (!grouped) {
    const unlinked = graph.nodes.filter(function (node) {
      return !graph.edges.some(function (edge) {
        return edge.from === node.id || edge.to === node.id;
      });
    });
    const height = Math.ceil(Math.sqrt(unlinked.length));
    for (let start = 0; start < unlinked.length; start += height) {
      const column = unlinked.slice(start, start + height).map(function (node) {
        return node.id;
      });
      if (column.length > 1) lines.push(`  ${column.join(" ~~~ ")}`);
    }
  }
  return lines.join("\n");
};

// @claim infra/roadmap-canvas
const page = function (
  graph: RoadmapGraph,
  focus: string | undefined,
  grouped: boolean,
): string {
  const source = JSON.stringify(toMermaid(graph, grouped)).replace(
    /</g,
    "\\u003c",
  );
  const query = grouped ? "?group=horizon" : "";
  const scope =
    focus === undefined
      ? `${graph.nodes.length} items`
      : `${escapeHtml(focus)} and its neighbours · <a href="/${query}">all items</a>`;
  const toggle = grouped
    ? `<a href="?">ungroup</a>`
    : `<a href="?group=horizon">group by horizon</a>`;
  const legend = Object.keys(HORIZON_STYLES)
    .map(function (horizon) {
      return `<span class="chip ${horizon}">${horizon}</span>`;
    })
    .join("");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>kuib roadmap</title>
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; background: #0d0f12; color: #d4d4d8; font: 13px system-ui, sans-serif; }
  a { color: #93c5fd; }
  #bar { position: fixed; top: 0; left: 0; right: 0; z-index: 2; display: flex; gap: 14px; align-items: center; padding: 8px 14px; background: rgba(13, 15, 18, 0.9); border-bottom: 1px solid #27272a; }
  #bar .hint { margin-left: auto; color: #71717a; }
  #bar button { background: #18181b; color: #d4d4d8; border: 1px solid #3f3f46; border-radius: 4px; padding: 2px 9px; cursor: pointer; }
  .chip { padding: 1px 7px; border-radius: 3px; border: 1px solid; }
  .chip.now { background: #123524; border-color: #34d399; }
  .chip.next { background: #172a4a; border-color: #60a5fa; }
  .chip.later { background: #3a2a10; border-color: #f59e0b; }
  .chip.maybe { background: #262626; border-color: #a3a3a3; }
  .chip.closed { background: #1c1c1c; border-color: #525252; }
  #stage { position: fixed; inset: 0; cursor: grab; touch-action: none; }
  #stage:active { cursor: grabbing; }
  #view { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
  #view g.node { cursor: pointer; }
  #view.failed { padding: 60px 20px; white-space: pre-wrap; color: #fca5a5; }
</style>
</head>
<body>
<div id="bar">
  <strong>kuib roadmap</strong>
  <span>${scope}</span>
  ${toggle}
  <span>${legend}</span>
  <button data-zoom="out">−</button><button data-zoom="in">+</button><button data-zoom="fit">fit</button>
  <span class="hint">drag to pan · pinch or ⌘/ctrl+scroll to zoom · f fits · click an item to focus</span>
</div>
<div id="stage"><div id="view">rendering…</div></div>
<script type="application/json" id="graph">${source}</script>
<script type="module">
  const stage = document.getElementById("stage");
  const view = document.getElementById("view");
  const started = performance.now();
  const ticker = setInterval(function () {
    view.textContent = "rendering… " + Math.round((performance.now() - started) / 1000) + "s";
  }, 1000);

  const render = async function () {
    const mermaid = (await import("/mermaid/mermaid.esm.min.mjs")).default;
    const elkLayouts = (await import("/layout-elk/mermaid-layout-elk.esm.min.mjs")).default;
    mermaid.registerLayoutLoaders(elkLayouts);
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "strict",
      maxTextSize: 1000000,
      maxEdges: 5000,
      layout: "elk",
      elk: { layeringStrategy: "COFFMAN_GRAHAM", layeringLayerBound: 10, mergeEdges: false },
      flowchart: { useMaxWidth: false, nodeSpacing: 40, rankSpacing: 80, wrappingWidth: 220 },
    });
    const source = JSON.parse(document.getElementById("graph").textContent);
    return (await mermaid.render("roadmap", source)).svg;
  };

  let svg;
  try {
    svg = await render();
  } catch (error) {
    clearInterval(ticker);
    view.classList.add("failed");
    view.textContent = "render failed: " + ((error && error.stack) || error);
    throw error;
  }
  clearInterval(ticker);
  view.innerHTML = svg;
  const svgElement = view.querySelector("svg");
  const box = svgElement.viewBox.baseVal;
  svgElement.setAttribute("width", box.width);
  svgElement.setAttribute("height", box.height);
  svgElement.style.maxWidth = "none";

  let scale = 1;
  let x = 0;
  let y = 0;
  const apply = function () {
    view.style.transform = "translate(" + x + "px, " + y + "px) scale(" + scale + ")";
  };
  const fit = function () {
    const top = document.getElementById("bar").offsetHeight;
    const width = stage.clientWidth;
    const height = stage.clientHeight - top;
    scale = Math.min(1.5, (width / box.width) * 0.95, (height / box.height) * 0.95);
    x = (width - box.width * scale) / 2;
    y = top + (height - box.height * scale) / 2;
    apply();
  };
  const zoomAt = function (factor, cx, cy) {
    const next = Math.min(8, Math.max(0.02, scale * factor));
    const k = next / scale;
    x = cx - (cx - x) * k;
    y = cy - (cy - y) * k;
    scale = next;
    apply();
  };
  const zoomCentre = function (factor) {
    zoomAt(factor, stage.clientWidth / 2, stage.clientHeight / 2);
  };

  stage.addEventListener("wheel", function (event) {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      zoomAt(Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY);
      return;
    }
    x -= event.deltaX;
    y -= event.deltaY;
    apply();
  }, { passive: false });

  let drag = null;
  stage.addEventListener("pointerdown", function (event) {
    drag = { x: event.clientX, y: event.clientY, moved: false };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", function (event) {
    if (drag === null) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    x += dx;
    y += dy;
    drag.x = event.clientX;
    drag.y = event.clientY;
    apply();
  });
  stage.addEventListener("pointerup", function (event) {
    const moved = drag !== null && drag.moved;
    drag = null;
    if (moved) return;
    const node = document.elementFromPoint(event.clientX, event.clientY)?.closest("g.node");
    const id = node?.dataset.id ?? /flowchart-(R\\d+)-/.exec(node?.id ?? "")?.[1];
    if (id) location.href = "/" + id + location.search;
  });

  document.querySelectorAll("[data-zoom]").forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.dataset.zoom;
      if (action === "fit") fit();
      else zoomCentre(action === "in" ? 1.25 : 0.8);
    });
  });
  addEventListener("keydown", function (event) {
    if (event.key === "f" || event.key === "0") fit();
    if (event.key === "+" || event.key === "=") zoomCentre(1.25);
    if (event.key === "-") zoomCentre(0.8);
  });

  fit();
</script>
</body>
</html>
`;
};

// @claim infra/roadmap-serve
const serveAsset = function (
  response: ServerResponse,
  root: string,
  relative: string,
): void {
  const file = normalize(join(root, relative));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, {
    "content-type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
  });
  response.end(readFileSync(file));
};

// @claim infra/roadmap-serve
const handle = function (
  request: IncomingMessage,
  response: ServerResponse,
): void {
  const url = new URL(request.url ?? "/", "http://roadmap");
  for (const [prefix, root] of Object.entries(ASSETS)) {
    if (url.pathname.startsWith(prefix)) {
      serveAsset(response, root, url.pathname.slice(prefix.length));
      return;
    }
  }
  const focus = /^\/(R\d+)$/i.exec(url.pathname)?.[1]?.toUpperCase();
  if (url.pathname !== "/" && focus === undefined) {
    response.writeHead(404);
    response.end();
    return;
  }
  const grouped = url.searchParams.get("group") === "horizon";
  const full = readRoadmapGraph();
  const known = full.nodes.some(function (node) {
    return node.id === focus;
  });
  if (focus !== undefined && !known) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end(`${focus} is not on the roadmap graph\n`);
    return;
  }
  const graph =
    focus === undefined ? full : neighbourhood(full, new Set([focus]));
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(page(graph, focus, grouped));
};

const port = Number(values.port);
const tailnet = tailnetListener();
// @claim infra/roadmap-serve
const listeners: Listener[] =
  values.host !== undefined
    ? [{ host: values.host, name: values.host }]
    : [
        { host: "127.0.0.1", name: "localhost" },
        ...(tailnet !== undefined ? [tailnet] : []),
      ];

for (const listener of listeners) {
  createServer(handle).listen(port, listener.host, function () {
    process.stdout.write(`kuib roadmap → http://${listener.name}:${port}\n`);
  });
}
