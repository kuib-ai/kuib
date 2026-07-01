// @context @journal/infrastructure-strategy
import { z } from "zod";
import { EndpointKindEnum } from "../endpoint.kind.enum";

const TcpEndpoint = z.object({
  kind: z.literal(EndpointKindEnum.TCP),
  url: z.string().url(),
});
type TcpEndpoint = z.infer<typeof TcpEndpoint>;

export default TcpEndpoint;
export type { TcpEndpoint };
