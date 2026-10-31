// @claim core/provider-captures
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import prepare from "../prepare.request/index.ts";
import record from "../record.exchange/index.ts";
import sequence from "../sequence.requests/index.ts";
import liftStop from "../lift.stop/index.ts";
import reprice from "../reprice.ledger/index.ts";
import audit from "../audit.fixture/index.ts";
import refile from "../refile.cases/index.ts";
import rename from "../rename.identity/index.ts";
import type { CaptureRequest } from "../capture.request/index.ts";
import type { PreparedRequest } from "../prepared.request/index.ts";
import type { RecordInput } from "../record.input/index.ts";
import ResolveCaptureRootUnit from "../resolve.capture.root/index.ts";
import LoadKeyUnit from "../load.key/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import type { CaptureIdentity } from "../capture.identity/index.ts";
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import formatCaptureError from "../format.capture.error/index.ts";
import withError from "@kuib-ai/std/with.error";

const { FIXTURES } = ResolveCaptureRootUnit;
const { keyFromFile, KEYS } = LoadKeyUnit;
const { parseJson, object } = ParseCaptureJsonUnit;
const { validateProvider } = ValidateRequestUnit;
const { CaptureError, fail } = RefuseCaptureUnit;

type CaptureOperationContext = {
  root: string;
  input: ReadableStream<Uint8Array>;
  keyFromFile: (provider: ProviderEnum) => string;
};

const DEFAULT_CONTEXT: CaptureOperationContext = {
  root: FIXTURES,
  input: Deno.stdin.readable,
  keyFromFile,
};

const execute = async function (
  args: string[],
  context: CaptureOperationContext,
): Promise<void> {
  const command = args[0];
  if (command === "refile") {
    console.log(JSON.stringify({ refiled: refile(context.root) }));
    return;
  }
  if (command === "rename") {
    console.log(
      JSON.stringify({
        renamed: rename(
          context.root,
          args[1] as CaptureIdentity,
          args[2] ?? "",
          args[3] ?? "",
        ),
      }),
    );
    return;
  }
  if (command === "audit") {
    console.log(
      JSON.stringify(
        audit(
          context.root,
          Object.keys(KEYS).map(function (provider) {
            return context.keyFromFile(validateProvider(provider));
          }),
        ),
      ),
    );
    return;
  }
  const runFolder = args[1];
  if (runFolder === undefined) throw new CaptureError("invalid-run-folder");
  const path = args[2];
  const base = { root: context.root, ledger: join(runFolder, "ledger.jsonl") };
  if (command === "lift" || command === "reprice") {
    const review = object(parseJson(await new Response(context.input).text()));
    if (
      review === null ||
      typeof review.ordinal !== "number" ||
      typeof review.reviewer !== "string" ||
      typeof review.reason !== "string"
    )
      throw new CaptureError("invalid-stop-review");
    const values = Object.keys(KEYS).map(function (provider) {
      return context.keyFromFile(validateProvider(provider));
    });
    const options = { ...base, key: values[0]!, secrets: values.slice(1) };
    if (command === "lift") {
      liftStop(review.ordinal, review.reviewer, review.reason, options);
      console.log(JSON.stringify({ lifted: review.ordinal }));
      return;
    }
    reprice(
      review.ordinal,
      review.costUsd as number,
      review.reviewer,
      review.reason,
      options,
    );
    console.log(JSON.stringify({ repriced: review.ordinal }));
    return;
  }
  if (command === "prepare" && path === undefined) {
    const request = parseJson(
      await new Response(context.input).text(),
    ) as CaptureRequest;
    const provider = validateProvider(request.provider);
    const prepared = prepare(request, {
      ...base,
      key: context.keyFromFile(provider),
    });
    console.log(relative(context.root, prepared));
    return;
  }
  if (command === "record" && path !== undefined) {
    const prepared = parseJson(readFileSync(path, "utf8")) as PreparedRequest;
    const provider = validateProvider(prepared.provider);
    const run = parseJson(
      await new Response(context.input).text(),
    ) as RecordInput;
    const result = await record(path, run, {
      ...base,
      key: context.keyFromFile(provider),
    });
    console.log(
      JSON.stringify({
        fixture: result.fixture,
        status: result.status,
        state: result.state,
        stop: result.stop,
        costUsd: result.costUsd,
      }),
    );
    return;
  }
  if (command === "sequence" && path !== undefined) {
    const entries = parseJson(readFileSync(path, "utf8")) as {
      path: string;
      run: RecordInput;
    }[];
    if (
      !Array.isArray(entries) ||
      !entries.every(function (entry) {
        return typeof entry?.path === "string" && object(entry.run) !== null;
      })
    )
      fail("invalid-sequence");
    const keys: Record<string, string> = {};
    for (const entry of entries) {
      const prepared = parseJson(
        readFileSync(entry.path, "utf8"),
      ) as PreparedRequest;
      const provider = validateProvider(prepared.provider);
      keys[provider] ??= context.keyFromFile(provider);
    }
    const result = await sequence(entries, { ...base, keys });
    console.log(
      JSON.stringify({
        recorded: result.results.length,
        stop: result.stop,
      }),
    );
    return;
  }
  fail("invalid-command");
};

const main = async function (
  args: string[],
  context: CaptureOperationContext = DEFAULT_CONTEXT,
): Promise<void> {
  const [error] = await withError(
    function () {
      return execute(args, context);
    },
    function (cause) {
      return cause;
    },
  );
  if (error === null) return;
  console.error(formatCaptureError(error));
  Deno.exitCode = 1;
};

export default main;

if (import.meta.main) await main(Deno.args);
