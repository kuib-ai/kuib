// @context @journal/architecture-overview
import Trpc from "../trpc";
import executeCommand from "../procedure/execute.command";
import readFile from "../procedure/read.file";
import readDir from "../procedure/read.dir";
import writeFile from "../procedure/write.file";

const daemonRouter = Trpc.router({
  executeCommand,
  readFile,
  writeFile,
  readDir,
});
type DaemonRouter = typeof daemonRouter;

export default daemonRouter;
export type { DaemonRouter };
