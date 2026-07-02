// @context @journal/ux-iteration-process
import { createSignal, onCleanup, onMount } from "solid-js";
import { useRenderer } from "@opentui/solid";
import loadWireframes from "../load.wireframes";
import type { Wireframe } from "../load.wireframes";
import watchWireframes from "../watch.wireframes";
import Picker from "../picker";
import type { PickerFocus } from "../picker";

type WireframeAppProps = {
  workspaceRoot: string;
};

const WireframeApp = function (props: WireframeAppProps) {
  const renderer = useRenderer();
  const [wireframes, setWireframes] = createSignal<Wireframe[]>(
    loadWireframes(props.workspaceRoot),
  );
  const [focus, setFocus] = createSignal<PickerFocus | undefined>(undefined);

  onMount(() => {
    const handle = watchWireframes(props.workspaceRoot, (next) => {
      const previousPaths = new Set(
        wireframes().map((wireframe) => wireframe.path),
      );
      setWireframes(next);
      const added = next
        .filter((wireframe) => !previousPaths.has(wireframe.path))
        .sort((a, b) => a.modifiedAt - b.modifiedAt);
      const newest = added[added.length - 1];
      if (newest !== undefined) {
        setFocus({ path: newest.path });
      }
    });
    onCleanup(() => handle.close());
  });

  return (
    <Picker
      wireframes={wireframes()}
      focus={focus()}
      onQuit={() => renderer.destroy()}
    />
  );
};

export default WireframeApp;
export type { WireframeAppProps };
