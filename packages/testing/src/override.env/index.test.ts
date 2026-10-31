import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import overrideEnv from "./index.ts";

const SET = "KUIB_TESTING_OVERRIDE_SET";
const UNSET = "KUIB_TESTING_OVERRIDE_UNSET";
const ADDED = "KUIB_TESTING_OVERRIDE_ADDED";

describe("overrideEnv", function () {
  it("sets and deletes the given variables for the scope", function () {
    process.env[SET] = "before";
    const scope = function (): void {
      using _env = overrideEnv({ [SET]: undefined, [UNSET]: "inside" });
      expect(process.env[SET]).toBeUndefined();
      expect(process.env[UNSET]).toBe("inside");
    };

    scope();

    expect(process.env[SET]).toBe("before");
    delete process.env[SET];
  });

  it("restores a variable that was unset to unset", function () {
    delete process.env[UNSET];
    const scope = function (): void {
      using _env = overrideEnv({ [UNSET]: "inside" });
    };

    scope();

    expect(UNSET in process.env).toBe(false);
    expect(process.env[UNSET]).toBeUndefined();
  });

  it("removes variables the code under test added and restores those it changed", function () {
    process.env[SET] = "before";
    const scope = function (): void {
      using _env = overrideEnv();
      process.env[ADDED] = "added by the unit";
      process.env[SET] = "changed by the unit";
    };

    scope();

    expect(ADDED in process.env).toBe(false);
    expect(process.env[SET]).toBe("before");
    delete process.env[SET];
  });

  it("restores when the scope ends by throwing", function () {
    delete process.env[UNSET];
    const scope = function (): void {
      using _env = overrideEnv({ [UNSET]: "inside" });
      throw new Error("the test failed");
    };

    expect(scope).toThrow("the test failed");
    expect(UNSET in process.env).toBe(false);
  });
});
