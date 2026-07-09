import { describe, it, expect } from "bun:test";
import { userInfo, hostname } from "node:os";
import resolveNodeLabel from "./index";

describe("resolveNodeLabel", () => {
  it("returns the configured label when provided", () => {
    expect(resolveNodeLabel("custom-node")).toBe("custom-node");
  });

  it("falls back to username@hostname when no label is configured", () => {
    expect(resolveNodeLabel()).toBe(`${userInfo().username}@${hostname()}`);
  });
});
