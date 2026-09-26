// @claim infra/roadmap-terminal
import { spawnSync } from "node:child_process";
import { renderMermaidAscii } from "beautiful-mermaid";
import {
  edgeArrow,
  neighbourhood,
  readRoadmapGraph,
  wrap,
  type RoadmapGraph,
} from "./roadmap.graph.ts";

const LABEL_WIDTH = 28;

// @claim infra/roadmap-terminal
const toMermaid = function (graph: RoadmapGraph): string {
  const lines = ["flowchart LR"];
  for (const node of graph.nodes) {
    const title = node.title.replace(/\[/g, "⟦").replace(/\]/g, "⟧");
    const label = [`${node.id} · ${node.horizon}`, ...wrap(title, LABEL_WIDTH)];
    lines.push(`  ${node.id}["${label.join("<br>")}"]`);
  }
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} ${edgeArrow(edge)} ${edge.to}`);
  }
  return lines.join("\n");
};

const selected = new Set(
  process.argv.slice(2).map(function (arg) {
    return arg.toUpperCase();
  }),
);
const graph = readRoadmapGraph();
const rendered = renderMermaidAscii(
  toMermaid(selected.size > 0 ? neighbourhood(graph, selected) : graph),
  { colorMode: "none" },
);

// @claim infra/roadmap-terminal
if (process.stdout.isTTY === true) {
  spawnSync("less", ["-S"], {
    input: rendered,
    stdio: ["pipe", "inherit", "inherit"],
  });
} else {
  process.stdout.write(`${rendered}\n`);
}
