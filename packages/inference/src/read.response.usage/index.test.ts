import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import usageOf from "./index.ts";

it("keeps the final usage from a stream", function () {
  const bytes = new TextEncoder().encode(
    'data: {"usage":{"input_tokens":3}}\n\ndata: {"usage":{"output_tokens":7}}\n\n',
  );
  expect(usageOf(bytes)).toEqual({ input_tokens: 3, output_tokens: 7 });
});
