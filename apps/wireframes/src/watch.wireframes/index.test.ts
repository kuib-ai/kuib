import { describe, it, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import watchWireframes from "./index";
import type { Wireframe } from "../load.wireframes";

const waitFor = async function (predicate: () => boolean): Promise<boolean> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return predicate();
};

describe("watchWireframes", () => {
  it("delivers the new list when a wireframe is added to an existing entry", async () => {
    const root = mkdtempSync(join(tmpdir(), "kuib-watch-"));
    const dir = join(root, "journal", "host-layer", "wireframes");
    mkdirSync(dir, { recursive: true });

    const seen: { latest: Wireframe[] | null } = { latest: null };
    const handle = watchWireframes(root, (next) => {
      seen.latest = next;
    });

    writeFileSync(join(dir, "session.md"), "---\nstatus: exploring\n---\n");
    expect(await waitFor(() => seen.latest !== null)).toBe(true);
    expect(seen.latest?.[0]?.screen).toBe("session");

    handle.close();
  });

  it("detects a wireframe inside a brand-new entry directory", async () => {
    const root = mkdtempSync(join(tmpdir(), "kuib-watch-"));
    mkdirSync(join(root, "journal"), { recursive: true });

    const seen: { latest: Wireframe[] | null } = { latest: null };
    const handle = watchWireframes(root, (next) => {
      seen.latest = next;
    });

    const dir = join(root, "journal", "discussions-ux", "wireframes");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "selector.md"), "---\nstatus: exploring\n---\n");
    expect(await waitFor(() => (seen.latest?.length ?? 0) > 0)).toBe(true);
    expect(seen.latest?.[0]?.entry).toBe("discussions-ux");

    handle.close();
  });

  it("detects content edits to an existing wireframe", async () => {
    const root = mkdtempSync(join(tmpdir(), "kuib-watch-"));
    const dir = join(root, "journal", "host-layer", "wireframes");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "session.md"), "---\nstatus: exploring\n---\nv1\n");

    const seen: { latest: Wireframe[] | null } = { latest: null };
    const handle = watchWireframes(root, (next) => {
      seen.latest = next;
    });

    writeFileSync(
      join(dir, "session.md"),
      "---\nstatus: adopted\n---\nv2 longer\n",
    );
    expect(await waitFor(() => seen.latest?.[0]?.status === "adopted")).toBe(
      true,
    );

    handle.close();
  });
});
