import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import Protocol from "@kuib-ai/protocol";
import cutAt from "./index.ts";

it("cuts at a thinking delta and uses Meta's visible text fallback", function () {
  expect(
    cutAt(
      'data: {"delta":{"type":"thinking_delta","thinking":"x"}}\n\n',
      "thinking",
      Protocol.ProviderEnum.ANTHROPIC,
    ),
  ).toBe(true);
  expect(
    cutAt(
      'data: {"choices":[{"delta":{"content":"x"}}]}\n\n',
      "thinking",
      Protocol.ProviderEnum.META,
    ),
  ).toBe(true);
  expect(
    cutAt(
      'data: {"choices":[{"delta":{"content":"x"}}]}\n\n',
      "thinking",
      Protocol.ProviderEnum.XIAOMI,
    ),
  ).toBe(false);
});
