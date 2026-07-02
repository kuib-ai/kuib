import { describe, it, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import loadWireframes from "./index";

describe("loadWireframes", () => {
  it("discovers journal/*/wireframes/*.md with entry, screen, and status", () => {
    const root = mkdtempSync(join(tmpdir(), "kuib-wireframes-"));
    const dir = join(root, "journal", "host-layer", "wireframes");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "session.md"),
      "---\nscreen: session\nstatus: adopted\n---\nFRAME\n",
    );

    const result = loadWireframes(root);

    expect(result.length).toBe(1);
    expect(result[0]?.entry).toBe("host-layer");
    expect(result[0]?.screen).toBe("session");
    expect(result[0]?.status).toBe("adopted");
    expect(result[0]?.content.includes("FRAME")).toBe(true);
  });

  it("returns empty for a journal without wireframes", () => {
    const root = mkdtempSync(join(tmpdir(), "kuib-wireframes-"));
    mkdirSync(join(root, "journal", "vision"), { recursive: true });

    expect(loadWireframes(root)).toEqual([]);
  });

  it("marks missing frontmatter status as unknown", () => {
    const root = mkdtempSync(join(tmpdir(), "kuib-wireframes-"));
    const dir = join(root, "journal", "discussions-ux", "wireframes");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "selector.md"), "no frontmatter here\n");

    expect(loadWireframes(root)[0]?.status).toBe("unknown");
  });
});
