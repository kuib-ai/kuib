import { describe, it, expect } from "bun:test";
import Std from "../index";

describe("withError", () => {
  it("resolves async Promise successfully", async () => {
    const [err, val] = await Std.withError(Promise.resolve(42));
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("catches async Promise rejection", async () => {
    const [err, val] = await Std.withError(Promise.reject("oops"));
    expect(val).toBeNull();
    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe("oops");
  });

  it("resolves async function successfully", async () => {
    const [err, val] = await Std.withError(async () => 42);
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("catches async function rejection", async () => {
    const expectedErr = new Error("Test error");
    const [err, val] = await Std.withError(async (): Promise<string> => {
      throw expectedErr;
    });
    expect(val).toBeNull();
    expect(err).toBe(expectedErr);
  });

  it("returns value when sync function succeeds", () => {
    const [err, val] = Std.withError(() => 42);
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("returns error when sync function throws", () => {
    const expectedErr = new Error("Test error");
    const [err, val] = Std.withError((): string => {
      throw expectedErr;
    });
    expect(val).toBeNull();
    expect(err).toBe(expectedErr);
  });
});
