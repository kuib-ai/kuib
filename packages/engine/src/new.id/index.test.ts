import { describe, it, expect } from "bun:test";
import { z } from "zod";
import newID from ".";

describe("newID", function () {
  it("returns a schema-valid UUID", function () {
    const id = newID(z.string().uuid());
    expect(z.string().uuid().safeParse(id).success).toBe(true);
  });

  it("throws when the schema is incompatible with a UUID string", function () {
    expect(function () {
      return newID(z.number());
    }).toThrow();
  });
});
