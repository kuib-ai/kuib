// @context @journal/infrastructure-strategy
import { z } from "zod";
import { EndpointKindEnum } from "../endpoint.kind.enum";

const UnixEndpoint = z.object({
  kind: z.literal(EndpointKindEnum.UNIX),
  socketPath: z.string().min(1),
});
type UnixEndpoint = z.infer<typeof UnixEndpoint>;

export default UnixEndpoint;
export type { UnixEndpoint };
