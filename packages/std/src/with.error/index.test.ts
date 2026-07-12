import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import Std from "../index";

describe("withError", () => {
  it("resolves async Promise successfully", async () => {
    const [err, val] = await Std.withError(Promise.resolve(42));
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("maps async Promise rejection to Protocol.Error", async () => {
    const [err, val] = await Std.withError(Promise.reject("oops"));
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.UNKNOWN);
    expect(err?.message).toBe("oops");
  });

  it("resolves async function successfully", async () => {
    const [err, val] = await Std.withError(async () => 42);
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("maps async function throw to Protocol.Error", async () => {
    const [err, val] = await Std.withError(async (): Promise<string> => {
      throw new Error("Test error");
    });
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.UNKNOWN);
    expect(err?.message).toBe("Test error");
  });

  it("returns value when sync function succeeds", () => {
    const [err, val] = Std.withError(() => 42);
    expect(err).toBeNull();
    expect(val).toBe(42);
  });

  it("maps sync throw to Protocol.Error", () => {
    const [err, val] = Std.withError((): string => {
      throw new Error("Test error");
    });
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.UNKNOWN);
    expect(err?.message).toBe("Test error");
  });

  it("passes through an already classified Protocol.Error", () => {
    const classified = Protocol.Error.ErrorConfigInvalid.parse({
      code: Protocol.Error.ErrorCodeEnum.CONFIG_INVALID,
      message: "bad key",
      key: "KUIB_MODEL",
    });
    const [err, val] = Std.withError((): string => {
      throw classified;
    });
    expect(val).toBeNull();
    expect(err).toEqual(classified);
  });

  it("uses a custom mapError", () => {
    const [err, val] = Std.withError(
      (): string => {
        throw new Error("x");
      },
      () =>
        Protocol.Error.ErrorDaemonUnreachable.parse({
          code: Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE,
          message: "down",
          endpoint: "/tmp/daemon.sock",
        }),
    );
    expect(val).toBeNull();
    expect(err?.code).toBe(Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE);
    if (err?.code === Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE) {
      expect(err.endpoint).toBe("/tmp/daemon.sock");
    }
  });
});

describe("isErr", () => {
  it("narrows failure results", () => {
    const result = Std.withError((): number => {
      throw new Error("nope");
    });
    if (!Std.isErr(result)) {
      throw new Error("expected err");
    }
    expect(result[0].message).toBe("nope");
  });

  it("is false for success", () => {
    const result = Std.withError(() => 1);
    expect(Std.isErr(result)).toBe(false);
  });
});

describe("mapError", () => {
  it("preserves exec-style details", () => {
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
