// @context @journal/host-layer
import startEngineService from "./start.engine.service/index.ts";
import connectOrSpawn from "./engine.client/index.ts";

const EngineService = {
  startEngineService,
  connectOrSpawn,
};

export default EngineService;
