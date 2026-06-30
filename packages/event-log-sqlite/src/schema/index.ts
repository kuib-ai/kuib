// @context @journal/protocol-design
import type { Database } from "bun:sqlite";

const initSchema = function (db: Database): void {
  db.run("PRAGMA journal_mode = WAL;");
  db.run(
    `CREATE TABLE IF NOT EXISTS events (
      sessionID TEXT NOT NULL,
      epoch INTEGER NOT NULL,
      seq INTEGER NOT NULL,
      envelope TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      PRIMARY KEY (sessionID, epoch, seq)
    );`,
  );
};

export default initSchema;
