// @context @journal/ux-iteration-process
import { render } from "@opentui/solid";
import Env from "@kuib-ai/env";
import WireframeApp from "./app";

const main = function (): void {
  const workspaceRoot = Env.findWorkspaceRoot(import.meta.dir);
  render(
    function () {
      return <WireframeApp workspaceRoot={workspaceRoot} />;
    },
    {
      exitOnCtrlC: true,
      onDestroy: function () {
        return process.exit(0);
      },
    },
  );
};

main();
