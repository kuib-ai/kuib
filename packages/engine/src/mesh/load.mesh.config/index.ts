// @context @journal/distributed-mesh-state
import { existsSync, readFileSync } from "node:fs";
import MeshConfig from "../mesh.config";
import type { NodeDescriptor } from "@kuib-ai/protocol/node/node.descriptor";

const loadMeshConfig = function (path: string): NodeDescriptor[] {
  if (!existsSync(path)) {
    return [];
  }
  const raw = Bun.TOML.parse(readFileSync(path, "utf8"));
  return MeshConfig.parse(raw).nodes;
};

export default loadMeshConfig;
