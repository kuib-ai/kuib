// @context @journal/ux-iteration-process
import { createEffect, createSignal, on } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import type { Wireframe } from "../load.wireframes";

type PickerFocus = {
  path: string;
};

type PickerProps = {
  wireframes: Wireframe[];
  focus?: PickerFocus;
  onQuit: () => void;
};

const statusColor: Record<string, string> = {
  exploring: "#e0af68",
  adopted: "#9ece6a",
  superseded: "#565f89",
};

const Picker = function (props: PickerProps) {
  const [index, setIndex] = createSignal(0);
  const current = (): Wireframe | undefined => props.wireframes[index()];

  const move = function (delta: number): void {
    setIndex((prev) =>
      Math.min(Math.max(prev + delta, 0), props.wireframes.length - 1),
    );
  };

  createEffect(
    on(
      () => props.focus,
      (focus) => {
        if (focus === undefined) {
          return;
        }
        const at = props.wireframes.findIndex(
          (wireframe) => wireframe.path === focus.path,
        );
        if (at >= 0) {
          setIndex(at);
        }
      },
    ),
  );

  createEffect(() => {
    const lastIndex = Math.max(props.wireframes.length - 1, 0);
    setIndex((prev) => Math.min(prev, lastIndex));
  });

  useKeyboard((key) => {
    if (key.name === "q" || key.name === "escape") {
      props.onQuit();
      return;
    }
    if (key.name === "h" || key.name === "k" || key.name === "up") {
      move(-1);
    }
    if (key.name === "l" || key.name === "j" || key.name === "down") {
      move(1);
    }
  });

  return (
    <box flexDirection="row" flexGrow={1}>
      <box flexDirection="column" width={34} paddingLeft={1} paddingRight={1}>
        <text fg="#7aa2f7">wireframes</text>
        <select
          flexGrow={1}
          options={props.wireframes.map((wireframe) => ({
            name: `${wireframe.entry}/${wireframe.screen}`,
            description: wireframe.status,
          }))}
          selectedIndex={index()}
        />
        <text fg="#565f89">h/l · j/k move · q quit</text>
      </box>
      <box flexDirection="column" flexGrow={1}>
        <text fg={statusColor[current()?.status ?? ""] ?? "#e0af68"}>
          {current()?.path ?? "no wireframes found"}
        </text>
        <scrollbox flexGrow={1} scrollX>
          <text wrapMode="none">{current()?.content ?? ""}</text>
        </scrollbox>
      </box>
    </box>
  );
};

export default Picker;
export type { PickerFocus, PickerProps };
