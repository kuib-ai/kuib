// @claim infra/fixture-convention
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import FixtureDescription from "../fixture.description/index.ts";
import type { FixtureDescription as FixtureDescriptionType } from "../fixture.description/index.ts";
import findProjectRoot from "../find.project.root/index.ts";

const DESCRIPTION = "fixture.json";

type Fixture = FixtureDescriptionType & {
  path: string;
  files: string[];
  bytes: (file: string) => Uint8Array;
  text: (file: string) => string;
};

// @claim infra/fixture-convention
const loadFixture = function (from: string, name: string): Fixture {
  const start = from.startsWith("file:") ? fileURLToPath(from) : from;
  const project = findProjectRoot(start);
  if (project === null) {
    throw new Error(`fixture "${name}": no package.json above ${start}`);
  }
  const path = join(project, "fixtures", name);
  if (!existsSync(path)) {
    throw new Error(`fixture "${name}": ${path} does not exist`);
  }
  const descriptionPath = join(path, DESCRIPTION);
  if (!existsSync(descriptionPath)) {
    throw new Error(
      `fixture "${name}": ${DESCRIPTION} is missing; it says what the fixture shows and whether it was recorded or written.`,
    );
  }
  const description = FixtureDescription.safeParse(
    JSON.parse(readFileSync(descriptionPath, "utf8")),
  );
  if (!description.success) {
    throw new Error(
      `fixture "${name}": ${DESCRIPTION} is invalid: ${description.error.message}`,
    );
  }
  return {
    ...description.data,
    path,
    files: readdirSync(path)
      .filter(function (file) {
        return file !== DESCRIPTION;
      })
      .sort(),
    bytes: function (file) {
      return readFileSync(join(path, file));
    },
    text: function (file) {
      return readFileSync(join(path, file), "utf8");
    },
  };
};

export default loadFixture;
export type { Fixture };
