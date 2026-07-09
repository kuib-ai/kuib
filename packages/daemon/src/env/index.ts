// @context @journal/host-layer
import { z } from "zod";
import Env from "@kuib-ai/env";
import resolveDaemonSocketPath from "../daemon.socket.path";

const DaemonEnvSchema = z.object({
  KUIB_DAEMON_SOCKET: z.string().default(() => resolveDaemonSocketPath()),
  KUIB_DAEMON_PORT: z.coerce.number().int().positive().optional(),
});

const env = Env.bootstrapEnv(DaemonEnvSchema);
export default env;
