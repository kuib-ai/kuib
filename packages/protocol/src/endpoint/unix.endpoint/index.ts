// @claim core/endpoints
import { z } from "zod";
import { EndpointKindEnum } from "../endpoint.kind.enum/index.ts";

// @claim core/endpoints
const UnixEndpoint = z.object({
  kind: z.literal(EndpointKindEnum.UNIX),
  socketPath: z.string().min(1),
});
type UnixEndpoint = z.infer<typeof UnixEndpoint>;

export default UnixEndpoint;
export type { UnixEndpoint };
