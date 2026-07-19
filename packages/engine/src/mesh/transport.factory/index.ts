// @context @journal/distributed-mesh-state
import createDaemonClient from "../../daemon.client/transport.factory";
import type { NodeID } from "@kuib-ai/protocol/id/node.id";
import type { DiscoveryPort } from "@kuib-ai/protocol/discovery.port";
import type { DaemonClient } from "../../daemon.client/transport.factory";

const createTransportFactory = function (discovery: DiscoveryPort) {
  return function transportFactory(nodeID: NodeID): Promise<DaemonClient> {
    return discovery.resolve(nodeID).then(function (descriptor) {
      if (descriptor.endpoint === undefined) {
        throw new Error(`node has no endpoint: ${nodeID}`);
      }
      return createDaemonClient(descriptor.endpoint);
    });
  };
};
type TransportFactory = ReturnType<typeof createTransportFactory>;

export default createTransportFactory;
export type { TransportFactory };
