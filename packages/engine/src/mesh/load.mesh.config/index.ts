// @context @journal/distributed-mesh-state
import { existsSync, readFileSync } from "node:fs";
import { parse as parseToml } from "@std/toml";
import MeshConfig from "../mesh.config/index.ts";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";

const loadMeshConfig = function (path: string): NodeDescriptor[] {
  if (!existsSync(path)) {
    return [];
  }
  const raw = parseToml(readFileSync(path, "utf8"));
  return MeshConfig.parse(raw).nodes;
};

export default loadMeshConfig;
