// @context @journal/distributed-mesh-state
import MeshConfig from "./mesh.config";
import loadMeshConfig from "./load.mesh.config";
import createStaticDiscovery from "./static.discovery";
import createLocalOnlyDiscovery from "./local.only.discovery";
import createTransportFactory from "./transport.factory";

const Mesh = {
  MeshConfig,
  loadMeshConfig,
  createStaticDiscovery,
  createLocalOnlyDiscovery,
  createTransportFactory,
};

export default Mesh;
