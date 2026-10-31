import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createRecordInput from "./index.ts";

it("lets each synthetic ledger row carry its own price", function () {
  const input = createRecordInput({ row: "synthetic/other" });
  expect(input.row).toBe("synthetic/other");
  expect(input.price.inputTokens).toBe(100);
});
