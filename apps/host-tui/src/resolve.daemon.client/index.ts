// @context @journal/distributed-mesh-state
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import Daemon from "@kuib-ai/daemon";
import type { DaemonClient } from "@kuib-ai/engine/daemon.client/transport.factory";

export type EnvArgs = {
  KUIB_TARGET_NODE: string;
  KUIB_MESH_CONFIG: string;
  KUIB_DAEMON_URL?: string;
  KUIB_DAEMON_SOCKET: string;
};

const resolveDaemonClient = function (
  env: EnvArgs,
  localLabel: string,
): Promise<DaemonClient> {
  if (env.KUIB_TARGET_NODE !== localLabel) {
    const nodes = Engine.Mesh.loadMeshConfig(env.KUIB_MESH_CONFIG);
    const discovery = Engine.Mesh.createStaticDiscovery(nodes);
    const nodeID = Protocol.ID.NodeID.parse(env.KUIB_TARGET_NODE);
    return Engine.Mesh.createTransportFactory(discovery)(nodeID);
  }
  return Daemon.resolveDaemonEndpoint(
    env.KUIB_DAEMON_URL,
    env.KUIB_DAEMON_SOCKET,
  ).then((endpoint) => Engine.DaemonClient.createDaemonClient(endpoint));
};

export default resolveDaemonClient;
