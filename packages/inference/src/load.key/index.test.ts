import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import Protocol from "@kuib-ai/protocol";
import LoadKey from "./index.ts";

it("uses only the provider's named key and gives environment precedence", function () {
  const name = "KUIB_ANTHROPIC_API_KEY";
  expect(
    LoadKey.loadKey(
      Protocol.ProviderEnum.ANTHROPIC,
      { [name]: "environment" },
      `${name}="dotenv"`,
    ),
  ).toBe("environment");
  expect(
    LoadKey.loadKey(Protocol.ProviderEnum.ANTHROPIC, {}, `${name}="dotenv"`),
  ).toBe("dotenv");
  expect(function () {
    LoadKey.loadKey(
      Protocol.ProviderEnum.ANTHROPIC,
      { KUIB_META_API_KEY: "wrong" },
      "",
    );
  }).toThrow("missing-key");
});

it("loads only the named credential with environment precedence and platform dotenv quoting", function () {
  const dotenv =
    'KUIB_ANTHROPIC_API_KEY="synthetic quoted key"\r\nKUIB_MIMO_API_KEY=synthetic-mimo\r\nUNRELATED_SECRET=unrelated\r\n';
  expect(LoadKey.loadKey(Protocol.ProviderEnum.ANTHROPIC, {}, dotenv)).toBe(
    "synthetic quoted key",
  );
  const env = { KUIB_ANTHROPIC_API_KEY: "synthetic-secret-key-93" };
  expect(LoadKey.loadKey(Protocol.ProviderEnum.ANTHROPIC, env, dotenv)).toBe(
    env.KUIB_ANTHROPIC_API_KEY,
  );
  expect(env).toEqual({ KUIB_ANTHROPIC_API_KEY: "synthetic-secret-key-93" });
  expect(LoadKey.loadKey(Protocol.ProviderEnum.XIAOMI, {}, dotenv)).toBe(
    "synthetic-mimo",
  );
  expect(function () {
    LoadKey.loadKey(Protocol.ProviderEnum.META, {}, dotenv);
  }).toThrow("missing-key");
  expect(function () {
    LoadKey.loadKey(
      Protocol.ProviderEnum.ANTHROPIC,
      { KUIB_ANTHROPIC_API_KEY: "" },
      dotenv,
    );
  }).toThrow("missing-key");
});
