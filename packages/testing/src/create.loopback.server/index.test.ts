import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createLoopbackServer from "./index.ts";

it("serves a synthetic response only on loopback", async function () {
  await using http = createLoopbackServer(function () {
    return new Response("ok");
  });
  expect(http.url).toContain("http://127.0.0.1:");
  expect((await fetch(http.url)).status).toBe(200);
});
