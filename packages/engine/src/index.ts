// @claim core/package-barrels
import EventLog from "./event.log/index.ts";
import DaemonClient from "./daemon.client/index.ts";
import Provider from "./provider/index.ts";
import runAgent from "./orchestrator/index.ts";
import Mesh from "./mesh/index.ts";

// @claim core/package-barrels
const Engine = {
  EventLog,
  DaemonClient,
  Provider,
  runAgent,
  Mesh,
};

export default Engine;
