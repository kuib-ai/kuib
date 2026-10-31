import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureRequest from "../create.capture.request/index.ts";
import createCaptureOptions from "../create.capture.options/index.ts";
import createRecordInput from "../create.record.input/index.ts";
import prepare from "../prepare.request/index.ts";
import readPrepared from "./index.ts";

it("joins run price and row only for recording and rejects identity overrides", function () {
  using dir = createTempDir("capture-read-prepared-");
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions(dir.path, origin);
  const path = prepare(createCaptureRequest(origin), options);
  const input = readPrepared(path, createRecordInput(), options);
  expect(input.request.row).toBe("synthetic/plain");
  expect(input.request.price.output).toBe(10);
  expect(Object.keys(input.prepared)).not.toContain("price");
  expect(function () {
    readPrepared(
      path,
      { ...createRecordInput(), provider: "meta" } as never,
      options,
    );
  }).toThrow("invalid-run-input");
});
