import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createFixtureCase from "./index.ts";
import createPreparedRequest from "../create.prepared.request/index.ts";

it("writes only a synthetic case's envelope, description and body", function () {
  using dir = createTempDir("capture-case-");
  const folder = createFixtureCase(
    dir.path,
    "openai-chat/meta/muse-spark-1-1/case",
    createPreparedRequest(),
  );
  expect(existsSync(join(folder, "request.body"))).toBe(true);
  expect(existsSync(join(folder, "sequence.json"))).toBe(false);
});
