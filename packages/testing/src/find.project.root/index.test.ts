import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import createTempDir from "../create.temp.dir/index.ts";
import findProjectRoot from "./index.ts";

describe("findProjectRoot", function () {
  it("walks up from a file to the folder holding package.json", function () {
    using dir = createTempDir("project-");
    const unit = join(dir.path, "src", "a.unit");
    mkdirSync(unit, { recursive: true });
    writeFileSync(join(dir.path, "package.json"), "{}\n");

    expect(findProjectRoot(join(unit, "index.test.ts"))).toBe(dir.path);
    expect(findProjectRoot(dir.path)).toBe(dir.path);
  });

  it("finds this package from its own test", function () {
    expect(findProjectRoot(import.meta.dirname!)).toBe(
      join(import.meta.dirname!, "..", ".."),
    );
  });

  it("returns null when no folder above holds one", function () {
    expect(findProjectRoot("/")).toBeNull();
  });
});
