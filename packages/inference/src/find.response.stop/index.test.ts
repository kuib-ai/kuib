import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import stopOf from "./index.ts";

it("stops authentication and billing failures without treating a plain rejection as a stop", function () {
  const bytes = new TextEncoder();
  expect(stopOf(401, bytes.encode(""))).toBe("authentication-failure");
  expect(
    stopOf(400, bytes.encode('{"error":{"code":"insufficient_quota"}}')),
  ).toBe("billing-failure");
  expect(
    stopOf(400, bytes.encode('{"error":{"code":"bad_request"}}')),
  ).toBeNull();
});
