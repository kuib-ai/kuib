// @context @journal/ux-iteration-process
import type { CliRenderer } from "@opentui/core";
import type { KeyEvent, Renderable } from "@opentui/core";
import {
  registerLeader,
  registerEscapeClearsPendingSequence,
} from "@opentui/keymap/addons";
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui";
import type { Keymap } from "@opentui/keymap";

const keymaps = new WeakMap<CliRenderer, Keymap<Renderable, KeyEvent>>();

const createWireframeKeymap = function (
  renderer: CliRenderer,
): Keymap<Renderable, KeyEvent> {
  const existing = keymaps.get(renderer);
  if (existing !== undefined) {
    return existing;
  }
  const keymap = createDefaultOpenTuiKeymap(renderer);
  registerLeader(keymap, { trigger: " " });
  registerEscapeClearsPendingSequence(keymap);
  keymaps.set(renderer, keymap);
  return keymap;
};

export default createWireframeKeymap;
