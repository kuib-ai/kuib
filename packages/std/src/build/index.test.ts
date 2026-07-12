import { describe, it, expect } from "bun:test";
import { z } from "zod";
import Protocol from "@kuib-ai/protocol";
import build from "./index";

describe("build", () => {
  it("fills literal code with autocomplete-friendly input", () => {
    const err = build(Protocol.Error.ErrorDaemonUnreachable, {
      message: "socket down",
      endpoint: "/tmp/x.sock",
    });

    expect(err).toEqual({
      code: Protocol.Error.ErrorCodeEnum.DAEMON_UNREACHABLE,
      message: "socket down",
      endpoint: "/tmp/x.sock",
    });
  });

  it("works for ErrorUnknown with only message", () => {
    expect(build(Protocol.Error.ErrorUnknown, { message: "boom" })).toEqual({
      code: Protocol.Error.ErrorCodeEnum.UNKNOWN,
      message: "boom",
    });
  });

  it("keeps schema literals even if input tries to override them", () => {
    const schema = z.object({
      code: z.literal("X"),
      message: z.string(),
    });

    expect(build(schema, { message: "m", code: "Y" } as never)).toEqual({
      code: "X",
      message: "m",
    });
  });

  it("fills literals wrapped in optional/default", () => {
    const schema = z.object({
      code: z.literal("X").optional(),
      message: z.string(),
    });

    expect(build(schema, { message: "m" })).toEqual({
      code: "X",
      message: "m",
    });
  });

  it("rejects multi-value literals", () => {
    const schema = z.object({
      code: z.literal(["A", "B"]),
      message: z.string(),
    });

    expect(() => build(schema, { message: "m" })).toThrow(
      /multi-value literal/,
    );
  });

  it("applies zod defaults for non-literal fields", () => {
    const schema = z.object({
      code: z.literal("X"),
      message: z.string(),
      retries: z.number().default(3),
    });

    expect(build(schema, { message: "m" })).toEqual({
      code: "X",
      message: "m",
      retries: 3,
    });
  });

  it("caches literals per schema object identity", () => {
    const schema = z.object({
      code: z.literal("X"),
      message: z.string(),
    });

    expect(build(schema, { message: "a" }).code).toBe("X");
    expect(build(schema, { message: "b" }).code).toBe("X");
  });
});
