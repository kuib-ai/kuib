import { describe, it, expect } from "bun:test";
import Protocol from "@kuib-ai/protocol";
import errorFields from "./index";

describe("errorFields", function () {
  it("passes through Protocol.Error", function () {
    const err = Protocol.Error.ErrorConfigInvalid.parse({
      code: Protocol.Error.ErrorCodeEnum.CONFIG_INVALID,
      message: "bad",
      key: "KUIB_MODEL",
    });
    expect(errorFields(err)).toEqual({ err });
  });

  it("maps a thrown Error to unknown", function () {
    expect(errorFields(new Error("boom"))).toEqual({
      err: {
        code: Protocol.Error.ErrorCodeEnum.UNKNOWN,
        message: "boom",
      },
    });
  });
});
