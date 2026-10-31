import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createFixtureCase from "../create.fixture.case/index.ts";
import createPreparedRequest from "../create.prepared.request/index.ts";
import fileCases from "./index.ts";

it("preflights a case move and retains its body bytes", function () {
  using dir = createTempDir("capture-file-cases-");
  createFixtureCase(dir.path, "wrong-place", createPreparedRequest());
  expect(
    fileCases(dir.path, function (request) {
      return request;
    }),
  ).toBe(1);
  const target = join(
    dir.path,
    "openai-chat",
    "meta",
    "muse-spark-1-1",
    "case",
  );
  expect(existsSync(join(target, "request.json"))).toBe(true);
  expect(readFileSync(join(target, "request.body"))).toEqual(
    Buffer.from([0, 255, 10]),
  );
});
