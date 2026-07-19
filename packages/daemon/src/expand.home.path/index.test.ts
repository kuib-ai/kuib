import { describe, it, expect } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import expandHomePath from "./index";

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
