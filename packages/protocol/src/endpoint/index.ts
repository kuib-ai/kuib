// @context @journal/infrastructure-strategy
import { EndpointKindEnum } from "./endpoint.kind.enum";
import UnixEndpoint from "./unix.endpoint";
import TcpEndpoint from "./tcp.endpoint";
import AnyEndpoint from "./endpoint.any";

const Endpoint = {
  EndpointKindEnum,
  UnixEndpoint,
  TcpEndpoint,
  AnyEndpoint,
};

export default Endpoint;
