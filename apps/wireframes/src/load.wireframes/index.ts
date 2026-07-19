// @context @journal/ux-iteration-process
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

type Wireframe = {
  path: string;
  entry: string;
  screen: string;
  status: string;
  content: string;
  modifiedAt: number;
};

const readStatus = function (content: string): string {
  const match = content.match(/^status:\s*(\S+)/m);
  return match?.[1] ?? "unknown";
};

const loadWireframes = function (workspaceRoot: string): Wireframe[] {
  const journalDir = join(workspaceRoot, "journal");
  if (!existsSync(journalDir)) {
    return [];
  }
  const wireframes: Wireframe[] = [];
  for (const dirent of readdirSync(journalDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const wireframeDir = join(journalDir, dirent.name, "wireframes");
    if (!existsSync(wireframeDir)) {
      continue;
    }
    for (const file of readdirSync(wireframeDir)) {
      if (!file.endsWith(".md")) {
        continue;
      }
      const absolutePath = join(wireframeDir, file);
      const content = readFileSync(absolutePath, "utf8");
      wireframes.push({
        path: join("journal", dirent.name, "wireframes", file),
        entry: dirent.name,
        screen: file.replace(/\.md$/, ""),
        status: readStatus(content),
        content,
        modifiedAt: statSync(absolutePath).mtimeMs,
      });
    }
  }
  return wireframes.sort(function (a, b) {
    return a.path.localeCompare(b.path);
  });
};

export default loadWireframes;
export type { Wireframe };
