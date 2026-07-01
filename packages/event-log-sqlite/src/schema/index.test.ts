import { describe, it, expect } from "bun:test";
import { Database } from "bun:sqlite";
import initSchema from "./index";

type TableNameRow = { name: string };

describe("initSchema", () => {
  it("creates the events table and is idempotent across repeated calls", () => {
    const db = new Database(":memory:");
    initSchema(db);
    initSchema(db);
    const row = db
      .query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'events';",
      )
      .get() as TableNameRow | null;
    expect(row?.name).toBe("events");
  });

  it("enables inserts into the events table", () => {
    const db = new Database(":memory:");
    initSchema(db);
    db.run(
      "INSERT INTO events (sessionID, epoch, seq, envelope, createdAt) VALUES (?, ?, ?, ?, ?);",
      ["s1", 0, 0, "{}", 123],
    );
    const count = db.query("SELECT COUNT(*) AS n FROM events;").get() as {
      n: number;
    };
    expect(count.n).toBe(1);
  });
});
