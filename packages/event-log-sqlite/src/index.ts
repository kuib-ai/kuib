// @context @journal/protocol-design
import createSqliteEventLog from "./sqlite.event.log/index.ts";
import createSqliteReader from "./read.sqlite.event.log/index.ts";

const EventLogSqlite = {
  createSqliteEventLog,
  createSqliteReader,
};

export default EventLogSqlite;
