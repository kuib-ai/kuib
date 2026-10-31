import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import write from "./index.ts";

it("refuses a secret before creating a file", function () {
  using dir = createTempDir("capture-write-");
  const path = join(dir.path, "request.json");
  expect(function () {
    write(path, { text: "synthetic-secret-key-93" }, [
      "synthetic-secret-key-93",
    ]);
  }).toThrow("sensitive-data");
  expect(existsSync(path)).toBe(false);
});
