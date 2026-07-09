// @context @journal/distributed-mesh-state
import { userInfo, hostname } from "node:os";

const resolveNodeLabel = function (configured?: string): string {
  if (configured) {
    return configured;
  }
  return `${userInfo().username}@${hostname()}`;
};

export default resolveNodeLabel;
