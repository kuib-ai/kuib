// @claim infra/testing-helpers
const createLoopbackServer = function (
  handler: (request: Request) => Response | Promise<Response>,
): { url: string; [Symbol.asyncDispose](): Promise<void> } {
  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0, onListen: function () {} },
    handler,
  );
  return {
    url: `http://127.0.0.1:${server.addr.port}`,
    async [Symbol.asyncDispose]() {
      await server.shutdown();
    },
  };
};

export default createLoopbackServer;
