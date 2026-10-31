import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createPreparedRequest from "./index.ts";

it("keeps run fields out of a synthetic envelope", function () {
  const request = createPreparedRequest();
  expect(request.method).toBe("POST");
  expect(Object.keys(request)).not.toContain("row");
  expect(Object.keys(request)).not.toContain("price");
});
