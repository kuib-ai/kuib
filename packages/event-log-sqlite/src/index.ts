// @context @journal/protocol-design
import createSqliteEventLog from "./sqlite.event.log";
import createSqliteReader from "./read.sqlite.event.log";

const EventLogSqlite = {
  createSqliteEventLog,
  createSqliteReader,
};

export default EventLogSqlite;
