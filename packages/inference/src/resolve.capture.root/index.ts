// @claim core/provider-captures
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

const FIXTURES = join(ROOT, "packages", "inference", "fixtures");

export default { ROOT, FIXTURES };
