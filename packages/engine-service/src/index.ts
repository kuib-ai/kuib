// @claim core/package-barrels
import startEngineService from "./start.engine.service/index.ts";
import connectOrSpawn from "./engine.client/index.ts";

// @claim core/package-barrels
const EngineService = {
  startEngineService,
  connectOrSpawn,
};

export default EngineService;
