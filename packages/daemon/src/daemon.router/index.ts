// @context @journal/architecture-overview
import Trpc from "../trpc/index.ts";
import executeCommand from "../procedure/execute.command/index.ts";
import readFile from "../procedure/read.file/index.ts";
import readDir from "../procedure/read.dir/index.ts";
import writeFile from "../procedure/write.file/index.ts";

const daemonRouter = Trpc.router({
  executeCommand,
  readFile,
  writeFile,
  readDir,
});
type DaemonRouter = typeof daemonRouter;

export default daemonRouter;
export type { DaemonRouter };
