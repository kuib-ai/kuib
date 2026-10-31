import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import ParseCaptureJson from "./index.ts";

it("refuses invalid JSON and arrays as objects", function () {
  expect(function () {
    ParseCaptureJson.parseJson("{");
  }).toThrow("invalid-json");
  expect(ParseCaptureJson.object([])).toBeNull();
  expect(ParseCaptureJson.object({ a: 1 })).toEqual({ a: 1 });
});
