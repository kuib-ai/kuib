import { describe, it, afterEach } from "@std/testing/bdd";
import { expect } from "@std/expect";
import Protocol from "@kuib-ai/protocol";
import type { AnyEndpoint } from "@kuib-ai/protocol/endpoint/endpoint.any";
import createDaemonClient from "./index.ts";

type UnixRequestInit = RequestInit & { client?: Deno.HttpClient };

const realFetch = globalThis.fetch;

type Capture = {
  input: RequestInfo | URL;
  init: UnixRequestInit | undefined;
};

const installCapturingFetch = function (): Capture[] {
  const captured: Capture[] = [];
  const stub = function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    captured.push({ input, init });
    return Promise.reject(new Error("stubbed fetch"));
  };
  globalThis.fetch = stub;
  return captured;
};

describe("createDaemonClient transport factory", function () {
  afterEach(function () {
    globalThis.fetch = realFetch;
  });

  it("routes the TCP branch through endpoint.url with no unix socket init", async function () {
    const captured = installCapturingFetch();
    const endpoint: AnyEndpoint = {
      kind: Protocol.Endpoint.EndpointKindEnum.TCP,
      url: "http://127.0.0.1:9999",
    };
    const client = createDaemonClient(endpoint);
    await expect(client.readFile.query({ path: "/x" })).rejects.toThrow();
    expect(captured).toHaveLength(1);
    expect(String(captured[0]!.input).startsWith("http://127.0.0.1:9999")).toBe(
      true,
    );
    expect(captured[0]!.init?.client).toBe(undefined);
  });

  it("routes the unix branch through a unix-socket Deno.HttpClient", async function () {
    const captured = installCapturingFetch();
    const endpoint: AnyEndpoint = {
      kind: Protocol.Endpoint.EndpointKindEnum.UNIX,
      socketPath: "/run/kuib/daemon.sock",
    };
    const client = createDaemonClient(endpoint);
    await expect(client.readFile.query({ path: "/x" })).rejects.toThrow();
    expect(captured).toHaveLength(1);
    expect(captured[0]!.init?.client).toBeInstanceOf(Deno.HttpClient);
    expect(String(captured[0]!.input).startsWith("http://daemon")).toBe(true);
  });
});
