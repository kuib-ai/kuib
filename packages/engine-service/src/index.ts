// @context @journal/host-layer
import startEngineService from "./start.engine.service";
import connectOrSpawn from "./engine.client";

const EngineService = {
  startEngineService,
  connectOrSpawn,
};

export default EngineService;
