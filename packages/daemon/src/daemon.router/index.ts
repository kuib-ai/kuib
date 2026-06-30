// @context @journal/architecture-overview
import Trpc from "../trpc";
import executeCommand from "../procedure/execute.command";
import readFile from "../procedure/read.file";
import writeFile from "../procedure/write.file";

const daemonRouter = Trpc.router({
  executeCommand,
  readFile,
  writeFile,
});
type DaemonRouter = typeof daemonRouter;

export default daemonRouter;
export type { DaemonRouter };
