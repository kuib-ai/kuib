// @context @journal/infrastructure-strategy
import { z } from "zod";
import UnixEndpoint from "../unix.endpoint";
import TcpEndpoint from "../tcp.endpoint";

const AnyEndpoint = z.discriminatedUnion("kind", [UnixEndpoint, TcpEndpoint]);
type AnyEndpoint = z.infer<typeof AnyEndpoint>;

export default AnyEndpoint;
export type { AnyEndpoint };
