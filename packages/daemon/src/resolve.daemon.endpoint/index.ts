// @context @journal/host-layer
import Protocol from "@kuib-ai/protocol";
import type { AnyEndpoint } from "@kuib-ai/protocol/endpoint/endpoint.any";
import type { TcpEndpoint } from "@kuib-ai/protocol/endpoint/tcp.endpoint";
import ensureLocalDaemon from "../ensure.local.daemon";

const resolveDaemonEndpoint = async function (
  remoteUrl: string | undefined,
  socketOverride: string | undefined,
): Promise<AnyEndpoint> {
  if (remoteUrl !== undefined) {
    const remote: TcpEndpoint = {
      kind: Protocol.Endpoint.EndpointKindEnum.TCP,
      url: remoteUrl,
    };
    return remote;
  }
  return ensureLocalDaemon(socketOverride);
};

export default resolveDaemonEndpoint;
