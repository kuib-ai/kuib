// @claim infra/base-dirs
import { z } from "zod";

// @claim infra/base-dirs
export enum PathKindEnum {
  CONFIG = "config",
  DATA = "data",
  STATE = "state",
  CACHE = "cache",
  RUNTIME = "runtime",
}

const PathKind = z.enum(PathKindEnum);
type PathKind = z.infer<typeof PathKind>;

export default PathKind;
export type { PathKind };
