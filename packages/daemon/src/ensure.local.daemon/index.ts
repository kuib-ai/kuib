// @context @journal/host-layer
import Config from "@kuib-ai/config";
import Protocol from "@kuib-ai/protocol";
import type { AnyEndpoint } from "@kuib-ai/protocol/endpoint/endpoint.any";
import ensureDaemon from "../ensure.daemon";

const ensureLocalDaemon = async function (
  socketOverride?: string,
): Promise<AnyEndpoint> {
  const socketPath = Config.resolveAppPaths({
    daemonSocket: socketOverride,
  }).daemonSocket;
  await ensureDaemon(socketPath);
  return { kind: Protocol.Endpoint.EndpointKindEnum.UNIX, socketPath };
};

export default ensureLocalDaemon;
