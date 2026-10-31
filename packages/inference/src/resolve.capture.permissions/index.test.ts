import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { dirname, join, resolve } from "node:path";
import createTempDir from "@kuib-ai/testing/create.temp.dir";
import createCaptureOptions from "../create.capture.options/index.ts";
import createCaptureRequest from "../create.capture.request/index.ts";
import prepare from "../prepare.request/index.ts";
import ResolveCaptureRootUnit from "../resolve.capture.root/index.ts";
import resolveCapturePermissions from "./index.ts";

it("grants only the named run folder, provider hosts and credential names to the child", function () {
  const run = resolve("/var/tmp/capture-run");
  const flags = resolveCapturePermissions(run);
  expect(flags).not.toContain("-A");
  expect(flags).not.toContain("--allow-all");
  expect(
    flags.find(function (flag) {
      return flag.startsWith("--allow-write=");
    }),
  ).toContain(run);
  expect(
    flags.find(function (flag) {
      return flag.startsWith("--allow-read=");
    }),
  ).toContain(run);
  expect(
    flags.find(function (flag) {
      return flag.startsWith("--allow-net=");
    }),
  ).not.toContain("127.0.0.1");
  expect(
    flags.find(function (flag) {
      return flag.startsWith("--allow-env=");
    }),
  ).toBe(
    "--allow-env=KUIB_ANTHROPIC_API_KEY,KUIB_MIMO_API_KEY,KUIB_META_API_KEY",
  );
});

it("prepares inside its scoped fixture grant without reading parent directories", function () {
  using dir = createTempDir("capture-scoped-prepare-");
  const origin = "http://127.0.0.1:3210";
  const options = createCaptureOptions(dir.path, origin);
  const path = prepare(createCaptureRequest(origin), options);
  expect(path.startsWith(options.root)).toBe(true);
  const read = resolveCapturePermissions(dir.path)
    .find(function (flag) {
      return flag.startsWith("--allow-read=");
    })!
    .slice("--allow-read=".length)
    .split(",");
  expect(read).toContain(resolve(dir.path));
  expect(read).not.toContain(dirname(dir.path));
  expect(read).toContain(
    join(ResolveCaptureRootUnit.ROOT, "packages", "inference", "fixtures"),
  );
  expect(read).not.toContain(
    join(ResolveCaptureRootUnit.ROOT, "packages", "inference"),
  );
});

Deno.test({
  name: "denies an actual child read outside its run folder grant",
  fn: async function () {
    using folder = createTempDir("capture-permission-");
    const runFolder = folder.path;
    const outside = join(ResolveCaptureRootUnit.ROOT, "AGENTS.md");
    const script = join(runFolder, "probe.ts");
    await Deno.writeTextFile(
      script,
      `const outside=${JSON.stringify(outside)}; let denied=false; try { Deno.readTextFileSync(outside); } catch (error) { denied=error instanceof Deno.errors.NotCapable || error instanceof Deno.errors.PermissionDenied; } console.log(JSON.stringify({run:Deno.permissions.querySync({name:"read",path:${JSON.stringify(runFolder)}}).state,outside:Deno.permissions.querySync({name:"read",path:outside}).state,writeOutside:Deno.permissions.querySync({name:"write",path:outside}).state,runChild:Deno.permissions.querySync({name:"run"}).state,denied}));`,
    );
    const child = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--no-check",
        ...resolveCapturePermissions(runFolder),
        script,
      ],
      stdout: "piped",
      stderr: "piped",
    }).output();
    expect(child.code).toBe(0);
    expect(JSON.parse(new TextDecoder().decode(child.stdout))).toEqual({
      run: "granted",
      outside: "prompt",
      writeOutside: "prompt",
      runChild: "prompt",
      denied: true,
    });
  },
});
