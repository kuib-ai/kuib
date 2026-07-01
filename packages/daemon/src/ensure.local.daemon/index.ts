// @context @journal/host-layer
import Protocol from "@kuib-ai/protocol";
import type { AnyEndpoint } from "@kuib-ai/protocol/endpoint/endpoint.any";
import ensureDaemon from "../ensure.daemon";
import resolveDaemonSocketPath from "../daemon.socket.path";

const ensureLocalDaemon = async function (
  socketOverride?: string,
): Promise<AnyEndpoint> {
  const socketPath = resolveDaemonSocketPath(socketOverride);
  await ensureDaemon(socketPath);
  return { kind: Protocol.Endpoint.EndpointKindEnum.UNIX, socketPath };
};

export default ensureLocalDaemon;
