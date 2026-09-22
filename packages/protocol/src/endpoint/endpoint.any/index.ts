// @claim core/endpoints
import { z } from "zod";
import UnixEndpoint from "../unix.endpoint/index.ts";
import TcpEndpoint from "../tcp.endpoint/index.ts";

// @claim core/endpoints
const AnyEndpoint = z.discriminatedUnion("kind", [UnixEndpoint, TcpEndpoint]);
type AnyEndpoint = z.infer<typeof AnyEndpoint>;

export default AnyEndpoint;
export type { AnyEndpoint };
