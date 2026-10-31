import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import bytesHash from "./index.ts";

it("hashes raw bytes without text decoding", function () {
  expect(bytesHash(new Uint8Array([0, 255]))).toBe(
    "06eb7d6a69ee19e5fbdf749018d3d2abfa04bcbd1365db312eb86dc7169389b8",
  );
});
