// @claim infra/roadmap-graph
import { readFileSync } from "node:fs";

const ROADMAP = new URL("../journal/roadmap/ROADMAP.md", import.meta.url);
const NODE = /^\s*(R\d+)(?:\(\[|\[)"R\d+ · (.*)"(?:\]\)|\])(?::::\w+)?$/;
const EDGE = /^\s*(R\d+) (?:-->|-\. (\w+) \.(->|-)) (R\d+)$/;

type RoadmapNode = { id: string; title: string; horizon: string };

type RoadmapEdge = {
  from: string;
  to: string;
  kind: string;
  directed: boolean;
};

type RoadmapGraph = { nodes: RoadmapNode[]; edges: RoadmapEdge[] };

// @claim infra/roadmap-graph
const readRoadmapGraph = function (): RoadmapGraph {
  const markdown = readFileSync(ROADMAP, "utf8");
  const source = /```mermaid\n([\s\S]*?)```/.exec(markdown)?.[1];
  if (source === undefined) {
    throw new Error(`no mermaid graph in ${ROADMAP.pathname}`);
  }
  const nodes: RoadmapNode[] = [];
  const edges: RoadmapEdge[] = [];
  let horizon = "closed";
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("subgraph ")) {
      horizon = trimmed.slice("subgraph ".length);
      continue;
    }
    if (trimmed === "end") {
      horizon = "closed";
      continue;
    }
    const node = NODE.exec(line);
    if (node?.[1] !== undefined && node[2] !== undefined) {
      nodes.push({ id: node[1], title: node[2], horizon });
      continue;
    }
    const edge = EDGE.exec(line);
    if (edge?.[1] !== undefined && edge[4] !== undefined) {
      edges.push({
        from: edge[1],
        to: edge[4],
        kind: edge[2] ?? "depends",
        directed: edge[2] === undefined || edge[3] === "->",
      });
    }
  }
  return { nodes, edges };
};

// @claim infra/roadmap-graph
const neighbourhood = function (
  graph: RoadmapGraph,
  selected: Set<string>,
): RoadmapGraph {
  const unknown = [...selected].filter(function (id) {
    return !graph.nodes.some(function (node) {
      return node.id === id;
    });
  });
  if (unknown.length > 0) {
    throw new Error(`not on the roadmap graph: ${unknown.join(", ")}`);
  }
  const kept = new Set(selected);
  for (const edge of graph.edges) {
    if (selected.has(edge.from)) kept.add(edge.to);
    if (selected.has(edge.to)) kept.add(edge.from);
  }
  return {
    nodes: graph.nodes.filter(function (node) {
      return kept.has(node.id);
    }),
    edges: graph.edges.filter(function (edge) {
      return kept.has(edge.from) && kept.has(edge.to);
    }),
  };
};

const wrap = function (text: string, width: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    if (current.length > 0 && current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
      continue;
    }
    current = current.length > 0 ? `${current} ${word}` : word;
  }
  lines.push(current);
  return lines;
};

// @claim infra/roadmap-graph
const edgeArrow = function (edge: RoadmapEdge): string {
  if (edge.kind === "depends") {
    return "-->";
  }
  return edge.directed ? `-.->|${edge.kind}|` : `-.-|${edge.kind}|`;
};

export { readRoadmapGraph, neighbourhood, wrap, edgeArrow };
export type { RoadmapGraph, RoadmapNode, RoadmapEdge };
