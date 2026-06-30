// @context @journal/architecture-overview
import EventLog from "./event.log";
import DaemonClient from "./daemon.client";
import Provider from "./provider";
import runAgent from "./orchestrator";

const Engine = {
  EventLog,
  DaemonClient,
  Provider,
  runAgent,
};

export default Engine;
