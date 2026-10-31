import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createCaptureOptions from "./index.ts";

it("keeps a synthetic run's ledger and fixtures inside its root", function () {
  const options = createCaptureOptions(
    "/var/tmp/a-run",
    "http://127.0.0.1:3210",
  );
  expect(options.root).toBe("/var/tmp/a-run/fixtures");
  expect(options.ledger).toBe("/var/tmp/a-run/ledger.jsonl");
  expect(options.origins).toEqual(["http://127.0.0.1:3210"]);
});
