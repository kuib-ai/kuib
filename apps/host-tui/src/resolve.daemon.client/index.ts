// @context @journal/distributed-mesh-state
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import Daemon from "@kuib-ai/daemon";
import type { DaemonClient } from "@kuib-ai/engine/daemon.client/transport.factory";

export type DaemonConfig = {
  targetNode: string;
  meshConfigFile: string;
  daemonURL?: string;
  daemonSocket: string;
};

const resolveDaemonClient = function (
  config: DaemonConfig,
  localLabel: string,
): Promise<DaemonClient> {
  if (config.targetNode !== localLabel) {
    const nodes = Engine.Mesh.loadMeshConfig(config.meshConfigFile);
    const discovery = Engine.Mesh.createStaticDiscovery(nodes);
    const nodeID = Protocol.ID.NodeID.parse(config.targetNode);
    return Engine.Mesh.createTransportFactory(discovery)(nodeID);
  }
  return Daemon.resolveDaemonEndpoint(
    config.daemonURL,
    config.daemonSocket,
  ).then(function (endpoint) {
    return Engine.DaemonClient.createDaemonClient(endpoint);
  });
};

export default resolveDaemonClient;
