import { describe, it, expect } from "bun:test";
import { createSignal } from "solid-js";
import { testRender } from "@opentui/solid";
import Picker from "./index";
import type { PickerFocus } from "./index";
import type { Wireframe } from "../load.wireframes";

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
        () => <Picker wireframes={fixtures} onQuit={() => {}} />,
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
      () => <Picker wireframes={fixtures} onQuit={() => {}} />,
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
        <Picker wireframes={wireframes()} focus={focus()} onQuit={() => {}} />
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
      () => <Picker wireframes={wireframes()} onQuit={() => {}} />,
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
      () => <Picker wireframes={[wide]} onQuit={() => {}} />,
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
        <Picker
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
});
