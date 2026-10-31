// @claim core/provider-captures
import fixturePath from "@kuib-ai/inference/fixture.path";
import { dirname, join, relative } from "node:path";
import {
  existsSync,
  mkdirSync,
  renameSync,
  rmdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import type { PreparedRequest } from "../prepared.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import safePath from "../resolve.capture.path/index.ts";

const { fail } = RefuseCaptureUnit;
const { parseJson } = ParseCaptureJsonUnit;

const caseFolders = function (root: string): string[] {
  const folders: string[] = [];
  const visit = function (folder: string): void {
    if (existsSync(join(folder, "fixture.json"))) {
      folders.push(folder);
      return;
    }
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.isDirectory())
        visit(safePath(root, relative(root, join(folder, entry.name))));
    }
  };
  visit(root);
  return folders.sort();
};

const pruneFolders = function (root: string): void {
  const visit = function (folder: string): void {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.isDirectory()) visit(join(folder, entry.name));
    }
    if (folder !== root && readdirSync(folder).length === 0) rmdirSync(folder);
  };
  visit(root);
};

const fileCases = function (
  root: string,
  change: (request: PreparedRequest) => PreparedRequest,
  selected: (request: PreparedRequest) => boolean = function () {
    return true;
  },
): number {
  const moves = caseFolders(root)
    .map(function (folder) {
      const request = parseJson(
        readFileSync(join(folder, "request.json"), "utf8"),
      ) as PreparedRequest;
      if (!selected(request)) return null;
      const next = change({ ...request });
      const target = safePath(
        root,
        fixturePath(next.messageFormat, next.provider, next.model, next.name),
      );
      return { folder, target, next };
    })
    .filter(function (move): move is {
      folder: string;
      target: string;
      next: PreparedRequest;
    } {
      return move !== null;
    });
  const sources = new Set(
    moves.map(function (move) {
      return move.folder;
    }),
  );
  const targets = new Set<string>();
  for (const move of moves) {
    if (
      targets.has(move.target) ||
      (move.target !== move.folder &&
        existsSync(move.target) &&
        !sources.has(move.target))
    )
      fail("capture-exists");
    targets.add(move.target);
  }
  const aliases = new Map(
    moves.map(function (move) {
      return [relative(root, move.folder), relative(root, move.target)];
    }),
  );
  for (const move of moves) {
    if (
      JSON.stringify(
        parseJson(readFileSync(join(move.folder, "request.json"), "utf8")),
      ) !== JSON.stringify(move.next)
    )
      writeFileSync(
        join(move.folder, "request.json"),
        `${JSON.stringify(move.next, null, 2)}\n`,
      );
  }
  for (const move of moves) {
    if (move.folder === move.target) continue;
    mkdirSync(dirname(move.target), { recursive: true });
    renameSync(move.folder, move.target);
  }
  pruneFolders(root);
  for (const folder of caseFolders(root)) {
    const requestPath = join(folder, "request.json");
    const request = parseJson(
      readFileSync(requestPath, "utf8"),
    ) as PreparedRequest;
    if (request.replay) {
      const next = aliases.get(request.replay.fixture);
      if (next !== undefined && next !== request.replay.fixture) {
        request.replay.fixture = next;
        writeFileSync(requestPath, `${JSON.stringify(request, null, 2)}\n`);
      }
    }
  }
  return moves.filter(function (move) {
    return move.folder !== move.target;
  }).length;
};

export default fileCases;
