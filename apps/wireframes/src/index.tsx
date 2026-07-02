// @context @journal/ux-iteration-process
import { render } from "@opentui/solid";
import Env from "@kuib-ai/env";
import WireframeApp from "./app";

const main = function (): void {
  const workspaceRoot = Env.findWorkspaceRoot(import.meta.dir);
  render(() => <WireframeApp workspaceRoot={workspaceRoot} />, {
    exitOnCtrlC: true,
    onDestroy: () => process.exit(0),
  });
};

main();
