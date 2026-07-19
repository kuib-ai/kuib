import { describe, it, expect } from "bun:test";
import startTelemetry from "./index";

describe("startTelemetry", function () {
  it("returns false when endpoint is undefined", function () {
    expect(
      startTelemetry({ endpoint: undefined, serviceName: undefined }),
    ).toBe(false);
  });

  it("returns false when endpoint is an empty string", function () {
    expect(startTelemetry({ endpoint: "", serviceName: "svc" })).toBe(false);
  });

  it("registers provider and telemetry and returns true when endpoint is set", function () {
    expect(
      startTelemetry({
        endpoint: "http://localhost:4318",
        serviceName: "kuib-engine",
      }),
    ).toBe(true);
  });
});
