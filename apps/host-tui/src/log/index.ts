// @context @journal/host-layer
import { dirname, join } from "node:path";
import createPinoLogger from "@kuib-ai/std/pino";
import env from "../env";

const destination =
  env.KUIB_LOG_PATH ?? join(dirname(env.KUIB_DB_PATH), "kuib.log");

const log = createPinoLogger({
  name: "host-tui",
  level: env.KUIB_LOG_LEVEL,
  destination,
  pretty: true,
}).child({ logPath: destination });

export default log;
