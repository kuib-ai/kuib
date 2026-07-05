import { describe, it, expect } from "bun:test";
import { createSignal } from "solid-js";
import { testRender, useRenderer } from "@opentui/solid";
import { KeymapProvider } from "@opentui/keymap/solid";
import Picker from "./index";
import type { PickerFocus, PickerProps } from "./index";
import type { Wireframe } from "../load.wireframes";
import createWireframeKeymap from "../keymap";
import type { Keymap } from "@opentui/keymap";
import type { KeyEvent, Renderable } from "@opentui/core";

let harnessKeymap: Keymap<Renderable, KeyEvent> | undefined;

const PickerHarness = function (props: PickerProps) {
  const renderer = useRenderer();
  const keymap = createWireframeKeymap(renderer);
  harnessKeymap = keymap;
  return (
    <KeymapProvider keymap={keymap}>
      <Picker {...props} />
    </KeymapProvider>
  );
};

const pressLeaderP = async function (
  mockInput: Awaited<ReturnType<typeof testRender>>["mockInput"],
  renderOnce: Awaited<ReturnType<typeof testRender>>["renderOnce"],
): Promise<void> {
  await mockInput.pressKeys([" ", "p"], 50);
  await renderOnce();
};

const fixtures: Wireframe[] = [
  {
    path: "journal/host-layer/wireframes/session.md",
    entry: "host-layer",
    screen: "session",
    status: "adopted",
    content: "FRAME-SESSION",
    modifiedAt: 1,
  },
  {
    path: "journal/discussions-ux/wireframes/selector.md",
    entry: "discussions-ux",
    screen: "selector",
    status: "exploring",
    content: "FRAME-SELECTOR",
    modifiedAt: 2,
  },
];

describe("wireframe picker", () => {
  it("renders the first wireframe with its file path and flips with l/h", async () => {
    const { renderer, mockInput, waitForFrame, captureCharFrame } =
      await testRender(
        () => <PickerHarness wireframes={fixtures} onQuit={() => {}} />,
        { width: 110, height: 24 },
      );

    await waitForFrame((frame) => frame.includes("FRAME-SESSION"));
    expect(
      captureCharFrame().includes("journal/host-layer/wireframes/session.md"),
    ).toBe(true);

    await mockInput.typeText("l");
    await waitForFrame((frame) => frame.includes("FRAME-SELECTOR"));
    expect(
      captureCharFrame().includes(
        "journal/discussions-ux/wireframes/selector.md",
      ),
    ).toBe(true);

    await mockInput.typeText("h");
    await waitForFrame((frame) => frame.includes("FRAME-SESSION"));

    renderer.destroy();
  });

  it("clamps navigation at list boundaries", async () => {
    const { renderer, mockInput, waitForFrame } = await testRender(
      () => <PickerHarness wireframes={fixtures} onQuit={() => {}} />,
      { width: 110, height: 24 },
    );

    await mockInput.typeText("h");
    await waitForFrame((frame) => frame.includes("FRAME-SESSION"));

    await mockInput.typeText("lll");
    await waitForFrame((frame) => frame.includes("FRAME-SELECTOR"));

    renderer.destroy();
  });

  it("focuses a newly added wireframe when focus changes", async () => {
    const [wireframes, setWireframes] = createSignal(fixtures);
    const [focus, setFocus] = createSignal<PickerFocus | undefined>(undefined);

    const { renderer, waitForFrame } = await testRender(
      () => (
        <PickerHarness
          wireframes={wireframes()}
          focus={focus()}
          onQuit={() => {}}
        />
      ),
      { width: 110, height: 24 },
    );

    await waitForFrame((frame) => frame.includes("FRAME-SESSION"));

    const added: Wireframe = {
      path: "journal/context-bootstrap/wireframes/project-map.md",
      entry: "context-bootstrap",
      screen: "project-map",
      status: "exploring",
      content: "FRAME-PROJECT-MAP",
      modifiedAt: 3,
    };
    setWireframes([...fixtures, added]);
    setFocus({ path: added.path });

    await waitForFrame((frame) => frame.includes("FRAME-PROJECT-MAP"));

    renderer.destroy();
  });

  it("clamps the selection when the list shrinks", async () => {
    const [wireframes, setWireframes] = createSignal(fixtures);

    const { renderer, mockInput, waitForFrame } = await testRender(
      () => <PickerHarness wireframes={wireframes()} onQuit={() => {}} />,
      { width: 110, height: 24 },
    );

    await mockInput.typeText("l");
    await waitForFrame((frame) => frame.includes("FRAME-SELECTOR"));

    setWireframes(fixtures.slice(0, 1));
    await waitForFrame((frame) => frame.includes("FRAME-SESSION"));

    renderer.destroy();
  });

  it("clips frame lines wider than the preview pane instead of wrapping", async () => {
    const wide: Wireframe = {
      path: "journal/host-layer/wireframes/wide.md",
      entry: "host-layer",
      screen: "wide",
      status: "exploring",
      content: "┌" + "─".repeat(100) + "WRAPMARK",
      modifiedAt: 1,
    };

    const { renderer, waitForFrame, captureCharFrame } = await testRender(
      () => <PickerHarness wireframes={[wide]} onQuit={() => {}} />,
      { width: 110, height: 24 },
    );

    await waitForFrame((frame) => frame.includes("┌────"));
    expect(captureCharFrame().includes("WRAPMARK")).toBe(false);

    renderer.destroy();
  });

  it("calls onQuit on q", async () => {
    let quits = 0;
    const { renderer, mockInput, waitFor } = await testRender(
      () => (
        <PickerHarness
          wireframes={fixtures}
          onQuit={() => {
            quits++;
          }}
        />
      ),
      { width: 110, height: 24 },
    );

    await mockInput.typeText("q");
    await waitFor(() => quits === 1);
    expect(quits).toBe(1);

    renderer.destroy();
  });

  it("toggles the left pane with <leader>p", async () => {
    const { renderer, mockInput, renderOnce, waitForFrame, captureCharFrame } =
      await testRender(
        () => <PickerHarness wireframes={fixtures} onQuit={() => {}} />,
        { width: 110, height: 24 },
      );

    await waitForFrame((frame) => frame.includes("wireframes"));
    expect(captureCharFrame().includes("host-layer/session")).toBe(true);

    await pressLeaderP(mockInput, renderOnce);
    expect(captureCharFrame().includes("j/k scroll")).toBe(true);
    harnessKeymap?.clearPendingSequence();

    await pressLeaderP(mockInput, renderOnce);
    expect(captureCharFrame().includes("h/l · j/k move · <leader>p")).toBe(
      true,
    );
    expect(captureCharFrame().includes("host-layer/session")).toBe(true);

    renderer.destroy();
  });

  it("scrolls the preview with j/k when the left pane is closed", async () => {
    const lines = Array.from({ length: 40 }, (_, index) => `LINE-${index}`);
    const tall: Wireframe = {
      path: "journal/host-layer/wireframes/tall.md",
      entry: "host-layer",
      screen: "tall",
      status: "exploring",
      content: lines.join("\n"),
      modifiedAt: 1,
    };

    const { renderer, mockInput, renderOnce, waitForFrame, captureCharFrame } =
      await testRender(
        () => <PickerHarness wireframes={[tall]} onQuit={() => {}} />,
        { width: 110, height: 24 },
      );

    await waitForFrame((frame) => frame.includes("LINE-0"));
    harnessKeymap?.runCommand("toggle-left-pane");
    await renderOnce();
    expect(captureCharFrame().includes("j/k scroll")).toBe(true);
    harnessKeymap?.clearPendingSequence();

    for (let step = 0; step < 10; step++) {
      await mockInput.pressKey("j");
      await renderOnce();
    }
    expect(captureCharFrame().includes("LINE-0")).toBe(false);
    expect(captureCharFrame().includes("LINE-10")).toBe(true);

    harnessKeymap?.runCommand("scroll-bottom");
    await renderOnce();
    expect(captureCharFrame().includes("LINE-39")).toBe(true);

    harnessKeymap?.runCommand("scroll-top");
    await renderOnce();
    expect(captureCharFrame().includes("LINE-0")).toBe(true);

    await mockInput.pressKey("g", { shift: true });
    await renderOnce();
    expect(captureCharFrame().includes("LINE-39")).toBe(true);

    renderer.destroy();
  });
});
