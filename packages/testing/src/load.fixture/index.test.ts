import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import createTempDir from "../create.temp.dir/index.ts";
import { FixtureOriginEnum } from "../fixture.origin.enum/index.ts";
import loadFixture from "./index.ts";

const project = function (root: string, description: string | null): string {
  const fixture = join(root, "fixtures", "sample");
  const unit = join(root, "src", "a.unit");
  mkdirSync(fixture, { recursive: true });
  mkdirSync(unit, { recursive: true });
  writeFileSync(join(root, "package.json"), "{}\n");
  writeFileSync(join(fixture, "data.txt"), "data");
  if (description !== null) {
    writeFileSync(join(fixture, "fixture.json"), description);
  }
  return pathToFileURL(join(unit, "index.test.ts")).href;
};

describe("loadFixture", function () {
  it("loads a fixture of the project that owns the test, with its description and data", function () {
    const fixture = loadFixture(import.meta.url, "greeting");

    expect(fixture.path).toBe(
      join(import.meta.dirname!, "..", "..", "fixtures", "greeting"),
    );
    expect(fixture.origin).toBe(FixtureOriginEnum.WRITTEN);
    expect(fixture.shows.length).toBeGreaterThan(0);
    expect(fixture.files).toEqual(["hello.txt"]);
    expect(fixture.text("hello.txt")).toBe("hello, fixture\n");
    expect(new TextDecoder().decode(fixture.bytes("hello.txt"))).toBe(
      "hello, fixture\n",
    );
  });

  it("accepts a path in place of a file URL", function () {
    expect(loadFixture(import.meta.dirname!, "greeting").files).toEqual([
      "hello.txt",
    ]);
  });

  it("refuses a fixture without a description", function () {
    using dir = createTempDir("fixture-");
    const from = project(dir.path, null);

    expect(function () {
      return loadFixture(from, "sample");
    }).toThrow("fixture.json is missing");
  });

  it("refuses a description that does not say what it shows or where it came from", function () {
    using dir = createTempDir("fixture-");
    const noOrigin = project(dir.path, '{ "shows": "something" }');

    expect(function () {
      return loadFixture(noOrigin, "sample");
    }).toThrow("fixture.json is invalid");

    writeFileSync(
      join(dir.path, "fixtures", "sample", "fixture.json"),
      '{ "shows": " ", "origin": "recorded" }',
    );
    expect(function () {
      return loadFixture(noOrigin, "sample");
    }).toThrow("fixture.json is invalid");

    writeFileSync(
      join(dir.path, "fixtures", "sample", "fixture.json"),
      '{ "shows": "something", "origin": "guessed" }',
    );
    expect(function () {
      return loadFixture(noOrigin, "sample");
    }).toThrow("fixture.json is invalid");
  });

  it("refuses a fixture that does not exist", function () {
    expect(function () {
      return loadFixture(import.meta.url, "missing");
    }).toThrow("does not exist");
  });

  it("refuses when no project owns the test", function () {
    expect(function () {
      return loadFixture("/", "greeting");
    }).toThrow("no package.json above");
  });
});
