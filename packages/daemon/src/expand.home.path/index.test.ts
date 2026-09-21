import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { homedir } from "node:os";
import { join } from "node:path";
import expandHomePath from "./index.ts";

describe("expandHomePath", function () {
  it("expands bare '~' to the home directory", function () {
    expect(expandHomePath("~")).toBe(homedir());
  });

  it("expands '~/foo' to join(homedir, 'foo')", function () {
    expect(expandHomePath("~/foo")).toBe(join(homedir(), "foo"));
  });

  it("returns non-tilde paths unchanged, including '~user'", function () {
    expect(expandHomePath("/etc/passwd")).toBe("/etc/passwd");
    expect(expandHomePath("~user")).toBe("~user");
  });
});
