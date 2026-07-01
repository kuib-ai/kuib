// @context @journal/host-layer
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { DaemonRouter } from "@kuib-ai/daemon/daemon.router";

type UnixRequestInit = RequestInit & { unix?: string };

const createDaemonClient = function (socketPath: string) {
  return createTRPCClient<DaemonRouter>({
    links: [
      httpBatchLink({
        url: "http://daemon",
        fetch: function (input, init) {
          const unixInit: UnixRequestInit = { ...init, unix: socketPath };
          return fetch(input, unixInit);
        },
      }),
    ],
  });
};
type DaemonClient = ReturnType<typeof createDaemonClient>;

export default createDaemonClient;
export type { DaemonClient };
