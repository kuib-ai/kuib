// @context @journal/ux-iteration-process
import { createEffect, createSignal, on, Show } from "solid-js";
import * as path from "node:path";
import type { ScrollBoxRenderable } from "@opentui/core";
import { useBindings, useKeymap } from "@opentui/keymap/solid";
import type { Wireframe } from "../load.wireframes";
import { createPersistentSignal } from "../persistent";

type PickerFocus = {
  path: string;
};

type PickerProps = {
  workspaceRoot: string;
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
  const keymap = useKeymap();
  const [index, setIndex] = createSignal(0);
  const stateFile = path.join(
    props.workspaceRoot,
    "node_modules",
    ".cache",
    "kuib-wireframes.json",
  );
  const [leftPaneOpen, setLeftPaneOpen] = createPersistentSignal(
    stateFile,
    true,
  );
  let preview: ScrollBoxRenderable | undefined;
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

  createEffect(
    on(
      () => current()?.path,
      () => {
        preview?.scrollTo(0);
      },
    ),
  );

  const scrollPreview = function (delta: number): void {
    preview?.scrollBy(delta);
  };

  const scrollPreviewTop = function (): void {
    preview?.scrollTo(0);
  };

  const scrollPreviewBottom = function (): void {
    if (preview === undefined) {
      return;
    }
    const maxTop = Math.max(preview.scrollHeight - preview.viewport.height, 0);
    preview.scrollTo({ x: preview.scrollLeft, y: maxTop });
  };

  useBindings(() => ({
    commands: [
      { name: "quit", run: () => props.onQuit() },
      {
        name: "toggle-left-pane",
        run: () => {
          setLeftPaneOpen((open) => !open);
          keymap.clearPendingSequence();
        },
      },
      {
        name: "move-left",
        run: () => {
          move(-1);
        },
      },
      {
        name: "move-right",
        run: () => {
          move(1);
        },
      },
      {
        name: "step-down",
        run: () => {
          if (leftPaneOpen()) {
            move(1);
            return;
          }
          scrollPreview(1);
        },
      },
      {
        name: "step-up",
        run: () => {
          if (leftPaneOpen()) {
            move(-1);
            return;
          }
          scrollPreview(-1);
        },
      },
      {
        name: "page-down",
        run: () => {
          if (leftPaneOpen()) {
            move(10);
            return;
          }
          if (preview) {
            scrollPreview(Math.max(1, Math.floor(preview.viewport.height / 2)));
          }
        },
      },
      {
        name: "page-up",
        run: () => {
          if (leftPaneOpen()) {
            move(-10);
            return;
          }
          if (preview) {
            scrollPreview(
              -Math.max(1, Math.floor(preview.viewport.height / 2)),
            );
          }
        },
      },
      {
        name: "scroll-top",
        run: () => {
          if (leftPaneOpen()) {
            return;
          }
          scrollPreviewTop();
        },
      },
      {
        name: "scroll-bottom",
        run: () => {
          if (leftPaneOpen()) {
            return;
          }
          scrollPreviewBottom();
        },
      },
    ],
    bindings: [
      { key: "q", cmd: "quit" },
      { key: "escape", cmd: "quit" },
      { key: "<leader>p", cmd: "toggle-left-pane" },
      { key: "h", cmd: "move-left" },
      { key: "l", cmd: "move-right" },
      { key: "j", cmd: "step-down" },
      { key: "k", cmd: "step-up" },
      { key: "down", cmd: "step-down" },
      { key: "up", cmd: "step-up" },
      { key: "ctrl+d", cmd: "page-down" },
      { key: "ctrl+u", cmd: "page-up" },
      { key: "pagedown", cmd: "page-down" },
      { key: "pageup", cmd: "page-up" },
      { key: "g", cmd: "scroll-top" },
      { key: "shift+g", cmd: "scroll-bottom" },
    ],
  }));

  return (
    <box flexDirection="row" flexGrow={1}>
      <Show when={leftPaneOpen()}>
        <box flexDirection="column" width={34} paddingLeft={1} paddingRight={1}>
          <text fg="#7aa2f7">wireframes</text>
          <select
            focused={leftPaneOpen()}
            flexGrow={1}
            options={props.wireframes.map((wireframe) => ({
              name: `${wireframe.entry}/${wireframe.screen}`,
              description: wireframe.status,
            }))}
            selectedIndex={index()}
          />
          <text fg="#565f89">
            h/l · j/k move · &lt;leader&gt;p pane · q quit
          </text>
        </box>
      </Show>
      <box flexDirection="column" flexGrow={1}>
        <box width="100%" backgroundColor="black" height={1}>
          <text fg={statusColor[current()?.status ?? ""] ?? "#e0af68"}>
            {current()?.path ?? "no wireframes found"}
          </text>
        </box>
        <scrollbox
          ref={(renderable: ScrollBoxRenderable) => {
            preview = renderable;
          }}
          flexGrow={1}
          scrollX
          focusable={false}
        >
          <text wrapMode="none">{current()?.content ?? ""}</text>
        </scrollbox>
        <text fg="#565f89" marginTop={1}>
          {leftPaneOpen()
            ? "h/l · j/k move · <leader>p pane · q quit"
            : "h/l move · j/k scroll · g/G top/bottom · <leader>p pane · q quit"}
        </text>
      </box>
    </box>
  );
};

export default Picker;
export type { PickerFocus, PickerProps };
