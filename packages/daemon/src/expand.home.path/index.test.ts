import { describe, it, expect } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import expandHomePath from "./index";

describe("expandHomePath", () => {
  it("expands bare '~' to the home directory", () => {
    expect(expandHomePath("~")).toBe(homedir());
  });

  it("expands '~/foo' to join(homedir, 'foo')", () => {
    expect(expandHomePath("~/foo")).toBe(join(homedir(), "foo"));
  });

  it("returns non-tilde paths unchanged, including '~user'", () => {
    expect(expandHomePath("/etc/passwd")).toBe("/etc/passwd");
    expect(expandHomePath("~user")).toBe("~user");
  });
});
