// @claim core/provider-captures
import Protocol from "@kuib-ai/protocol";
import { parseEnv } from "node:util";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import withError from "@kuib-ai/std/with.error";
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import ResolveCaptureRootUnit from "../resolve.capture.root/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";

const { ROOT } = ResolveCaptureRootUnit;
const { validateProvider } = ValidateRequestUnit;
const { fail } = RefuseCaptureUnit;

const KEYS: Record<ProviderEnum, string> = {
  [Protocol.ProviderEnum.ANTHROPIC]: "KUIB_ANTHROPIC_API_KEY",
  [Protocol.ProviderEnum.XIAOMI]: "KUIB_MIMO_API_KEY",
  [Protocol.ProviderEnum.META]: "KUIB_META_API_KEY",
};

const loadKey = function (
  provider: ProviderEnum,
  env: Record<string, string | undefined>,
  dotenv: string,
): string {
  const name = KEYS[validateProvider(provider)];
  const [error, key] = withError(function () {
    return env[name] ?? parseEnv(dotenv)[name];
  });
  if (error !== null || key === undefined || key.length === 0)
    return fail("missing-key");
  return key;
};

const keyFromFile = function (provider: ProviderEnum): string {
  const name = KEYS[provider];
  const inherited = Deno.env.get(name);
  return loadKey(
    provider,
    { [name]: inherited },
    inherited === undefined && existsSync(join(ROOT, ".env"))
      ? readFileSync(join(ROOT, ".env"), "utf8")
      : "",
  );
};

export default { KEYS, loadKey, keyFromFile };
