// @claim core/package-barrels
import createSqliteEventLog from "./sqlite.event.log/index.ts";
import createSqliteReader from "./read.sqlite.event.log/index.ts";

// @claim core/package-barrels
const EventLogSqlite = {
  createSqliteEventLog,
  createSqliteReader,
};

export default EventLogSqlite;
