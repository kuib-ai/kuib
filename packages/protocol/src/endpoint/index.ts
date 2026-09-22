// @claim core/endpoints
import { EndpointKindEnum } from "./endpoint.kind.enum/index.ts";
import UnixEndpoint from "./unix.endpoint/index.ts";
import TcpEndpoint from "./tcp.endpoint/index.ts";
import AnyEndpoint from "./endpoint.any/index.ts";

// @claim core/endpoints
const Endpoint = {
  EndpointKindEnum,
  UnixEndpoint,
  TcpEndpoint,
  AnyEndpoint,
};

export default Endpoint;
