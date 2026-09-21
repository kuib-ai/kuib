import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { DatabaseSync } from "node:sqlite";
import initSchema from "./index.ts";

type TableNameRow = { name: string };

describe("initSchema", function () {
  it("creates the events table and is idempotent across repeated calls", function () {
    const db = new DatabaseSync(":memory:");
    initSchema(db);
    initSchema(db);
    const row = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'events';",
      )
      .get() as TableNameRow | undefined;
    expect(row?.name).toBe("events");
  });

  it("enables inserts into the events table", function () {
    const db = new DatabaseSync(":memory:");
    initSchema(db);
    db.prepare(
      "INSERT INTO events (sessionID, epoch, seq, envelope, createdAt) VALUES (?, ?, ?, ?, ?);",
    ).run("s1", 0, 0, "{}", 123);
    const count = db.prepare("SELECT COUNT(*) AS n FROM events;").get() as {
      n: number;
    };
    expect(count.n).toBe(1);
  });
});
