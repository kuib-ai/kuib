// @context @journal/domains/core#^C015
import { EndpointKindEnum } from "./endpoint.kind.enum/index.ts";
import UnixEndpoint from "./unix.endpoint/index.ts";
import TcpEndpoint from "./tcp.endpoint/index.ts";
import AnyEndpoint from "./endpoint.any/index.ts";

const Endpoint = {
  EndpointKindEnum,
  UnixEndpoint,
  TcpEndpoint,
  AnyEndpoint,
};

export default Endpoint;
