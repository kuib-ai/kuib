// @context @journal/distributed-mesh-state
import MeshConfig from "./mesh.config/index.ts";
import loadMeshConfig from "./load.mesh.config/index.ts";
import createStaticDiscovery from "./static.discovery/index.ts";
import createLocalOnlyDiscovery from "./local.only.discovery/index.ts";
import createTransportFactory from "./transport.factory/index.ts";

const Mesh = {
  MeshConfig,
  loadMeshConfig,
  createStaticDiscovery,
  createLocalOnlyDiscovery,
  createTransportFactory,
};

export default Mesh;
