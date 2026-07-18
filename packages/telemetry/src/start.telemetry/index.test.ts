import { describe, it, expect } from "bun:test";
import startTelemetry from "./index";

describe("startTelemetry", () => {
  it("returns false when endpoint is undefined", () => {
    expect(
      startTelemetry({ endpoint: undefined, serviceName: undefined }),
    ).toBe(false);
  });

  it("returns false when endpoint is an empty string", () => {
    expect(startTelemetry({ endpoint: "", serviceName: "svc" })).toBe(false);
  });

  it("registers provider and telemetry and returns true when endpoint is set", () => {
    expect(
      startTelemetry({
        endpoint: "http://localhost:4318",
        serviceName: "kuib-engine",
      }),
    ).toBe(true);
  });
});
