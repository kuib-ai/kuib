import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import ScanSensitiveBytes from "./index.ts";

it("refuses raw and encoded credentials before disk writes", function () {
  const bytes = new TextEncoder();
  for (const value of [
    "synthetic-secret-key-93",
    "synthetic%2Dsecret%2Dkey%2D93",
    "c3ludGhldGljLXNlY3JldC1rZXktOTM=",
  ]) {
    expect(function () {
      ScanSensitiveBytes.scan(bytes.encode(value), ["synthetic-secret-key-93"]);
    }).toThrow("sensitive-data");
  }
});
