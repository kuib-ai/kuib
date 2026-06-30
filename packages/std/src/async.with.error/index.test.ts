import { describe, it, expect } from "vitest";
import Std from "@kuib-ai/std";

describe("asyncWithError", () => {
  it("returns [null, value] on success", async () => {
    const [error, value] = await Std.asyncWithError(Promise.resolve(42));
    expect(error).toBeNull();
    expect(value).toBe(42);
  });

  it("returns [Error, null] on rejection", async () => {
    const [error, value] = await Std.asyncWithError(
      Promise.reject(new Error("boom")),
    );
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("boom");
    expect(value).toBeNull();
  });

  it("wraps non-Error rejections in an Error", async () => {
    const [error] = await Std.asyncWithError(Promise.reject("oops"));
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("oops");
  });
});
