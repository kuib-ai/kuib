// @context @journal/protocol-design
import createSqliteEventLog from "./sqlite.event.log";
import createSqliteReader from "./read.sqlite.event.log";
import resolveDbPath from "./resolve.db.path";

const EventLogSqlite = {
  createSqliteEventLog,
  createSqliteReader,
  resolveDbPath,
};

export default EventLogSqlite;
