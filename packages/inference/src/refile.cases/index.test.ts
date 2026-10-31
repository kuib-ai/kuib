import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createFixtureCase from "../create.fixture.case/index.ts";
import createPreparedRequest from "../create.prepared.request/index.ts";
import refile from "./index.ts";

it("files a case at its enum-backed identity path without a sequence file", function () {
  using dir = createTempDir("capture-refile-");
  createFixtureCase(dir.path, "unfiled", createPreparedRequest());
  expect(refile(dir.path)).toBe(1);
  expect(
    existsSync(
      join(
        dir.path,
        "openai-chat",
        "meta",
        "muse-spark-1-1",
        "case",
        "request.body",
      ),
    ),
  ).toBe(true);
});
