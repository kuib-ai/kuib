// @context @journal/architecture-overview
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { DaemonRouter } from "@kuib-ai/daemon/daemon.router";

const createDaemonClient = function (url: string) {
  return createTRPCClient<DaemonRouter>({
    links: [httpBatchLink({ url })],
  });
};
type DaemonClient = ReturnType<typeof createDaemonClient>;

export default createDaemonClient;
export type { DaemonClient };
