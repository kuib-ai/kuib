// @claim core/daemon-client
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import Protocol from "@kuib-ai/protocol";
import type { DaemonRouter } from "@kuib-ai/daemon/daemon.router";
import type { AnyEndpoint } from "@kuib-ai/protocol/endpoint/endpoint.any";

type UnixRequestInit = RequestInit & { client: Deno.HttpClient };

// @claim core/daemon-client
const createDaemonClient = function (endpoint: AnyEndpoint) {
  if (endpoint.kind === Protocol.Endpoint.EndpointKindEnum.TCP) {
    return createTRPCClient<DaemonRouter>({
      links: [httpBatchLink({ url: endpoint.url })],
    });
  }
  const client = Deno.createHttpClient({
    proxy: { transport: "unix", path: endpoint.socketPath },
  });
  const unixFetch = function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const unixInit: UnixRequestInit = { ...init, client };
    return fetch(input, unixInit);
  };
  return createTRPCClient<DaemonRouter>({
    links: [
      httpBatchLink({
        url: "http://daemon",
        fetch: unixFetch,
      }),
    ],
  });
};
type DaemonClient = ReturnType<typeof createDaemonClient>;

export default createDaemonClient;
export type { DaemonClient };
