// @context @journal/distributed-mesh-state
import Protocol from "@kuib-ai/protocol";
import Engine from "@kuib-ai/engine";
import Daemon from "@kuib-ai/daemon";
import Env from "@kuib-ai/env";
import type { Env as EnvValues } from "@kuib-ai/env/env.schema";
import type { DaemonClient } from "@kuib-ai/engine/daemon.client/transport.factory";

const resolveDaemonClient = function (
  env: EnvValues,
  localLabel: string,
): Promise<DaemonClient> {
  if (
    env.KUIB_TARGET_NODE !== undefined &&
    env.KUIB_TARGET_NODE !== localLabel
  ) {
    const nodes = Engine.Mesh.loadMeshConfig(
      Env.resolveMeshConfigPath(env.KUIB_MESH_CONFIG),
    );
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
