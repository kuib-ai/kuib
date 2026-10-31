import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createTempDir from "../create.temp.dir/index.ts";
import changeCwd from "./index.ts";

describe("changeCwd", function () {
  it("changes the working directory for the scope and restores it", function () {
    const before = process.cwd();
    using dir = createTempDir("cwd-");
    const scope = function (): void {
      using _cwd = changeCwd(dir.path);
      expect(process.cwd()).toBe(dir.path);
    };

    scope();

    expect(process.cwd()).toBe(before);
  });

  it("restores when the scope ends by throwing", function () {
    const before = process.cwd();
    using dir = createTempDir("cwd-");
    const scope = function (): void {
      using _cwd = changeCwd(dir.path);
      throw new Error("the test failed");
    };

    expect(scope).toThrow("the test failed");
    expect(process.cwd()).toBe(before);
  });
});
