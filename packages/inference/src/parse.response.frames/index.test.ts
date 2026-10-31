import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import frames from "./index.ts";

it("parses JSON and valid SSE frames while skipping broken frames and DONE", function () {
  expect(frames('{"a":1}')).toEqual([{ a: 1 }]);
  expect(frames('data: {"a":1}\n\ndata: broken\n\ndata: [DONE]\n\n')).toEqual([
    { a: 1 },
  ]);
});
