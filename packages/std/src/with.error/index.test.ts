import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import Std from "../index";

describe("withError", function () {
  it("resolves async Promise successfully", async function () {
    const [err, val] = await Std.withError(Promise.resolve(42));
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("maps async Promise rejection to Protocol.Error", async function () {
    const [err, val] = await Std.withError(Promise.reject("oops"));
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.UNKNOWN);
    expect(err?.message).toBe("oops");
  });

  it("resolves async function successfully", async function () {
    const [err, val] = await Std.withError(async function () {
      return 42;
    });
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("maps async function throw to Protocol.Error", async function () {
    const [err, val] = await Std.withError(async function (): Promise<string> {
      throw new Error("Test error");
    });
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.UNKNOWN);
    expect(err?.message).toBe("Test error");
  });

  it("returns value when sync function succeeds", function () {
    const [err, val] = Std.withError(function () {
      return 42;
    });
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("maps sync throw to Protocol.Error", function () {
    const [err, val] = Std.withError(function (): string {
      throw new Error("Test error");
    });
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.UNKNOWN);
    expect(err?.message).toBe("Test error");
  });

  it("passes through an already classified Protocol.Error", function () {
    const classified = Protocol.Error.ErrorConfigInvalid.parse({
      code: Protocol.Error.ErrorCodeEnum.CONFIG_INVALID,
      message: "bad key",
      key: "KUIB_MODEL",
    });
    const [err, val] = Std.withError(function (): string {
      throw classified;
    });
    expect(val).toBeNull();
    expect(err).toEqual(classified);
  });

  it("uses a custom mapError", function () {
    const [err, val] = Std.withError(
      function (): string {
        throw new Error("x");
      },
      function () {
        return Protocol.Error.ErrorDaemonUnreachable.parse({
          code: Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE,
          message: "down",
          endpoint: "/tmp/daemon.sock",
        });
      },
    );
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE);
    if (err?.code === Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE) {
      expect(err.endpoint).toBe("/tmp/daemon.sock");
    }
  });
});

describe("isErr", function () {
  it("narrows failure results", function () {
    const result = Std.withError(function (): number {
      throw new Error("nope");
    });
    if (!Std.isErr(result)) {
      throw new Error("expected err");
    }
    expect(result[0].message).toBe("nope");
  });

  it("is false for success", function () {
    const result = Std.withError(function () {
      return 1;
    });
    expect(Std.isErr(result)).toBe(false);
  });
});

describe("mapError", function () {
  it("preserves exec-style details", function () {
    const cause = Object.assign(new Error("fail"), {
      stdout: "out",
      stderr: "err",
      code: 2,
    });
    const mapped = Std.mapError(cause);
    expect(mapped.code).toBe(Protocol.Error.ErrorCodeEnum.UNKNOWN);
    expect(mapped.details?.stdout).toBe("out");
    expect(mapped.details?.stderr).toBe("err");
    expect(mapped.details?.code).toBe(2);
  });
});
