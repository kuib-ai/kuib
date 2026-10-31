import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import createCaptureRequest from "./index.ts";

it("builds a request for a loopback origin with a real format identity", function () {
  const request = createCaptureRequest("http://127.0.0.1:3210");
  expect(request.url).toBe("http://127.0.0.1:3210/v1/messages");
  expect(request.messageFormat).toBe("anthropic-messages");
  expect(JSON.parse(request.body).max_tokens).toBe(32);
});
