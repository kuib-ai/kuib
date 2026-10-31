// @claim core/inference-fixtures
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import loadFixture from "@kuib-ai/testing/load.fixture";
import Protocol from "@kuib-ai/protocol";
import type { MessageFormatEnum } from "@kuib-ai/protocol/message.format.enum";
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import type { ModelEnum } from "@kuib-ai/protocol/model.enum";
import fixturePath from "./index.ts";

const ROOT = join(import.meta.dirname!, "..", "..", "fixtures");

describe("fixturePath", function () {
  it("builds the four-level folder from enum values and a case", function () {
    expect(
      fixturePath(
        Protocol.MessageFormatEnum.OPENAI_CHAT,
        Protocol.ProviderEnum.META,
        Protocol.ModelEnum.MUSE_SPARK_1_1,
        "plain",
      ),
    ).toBe(
      join(
        Protocol.MessageFormatEnum.OPENAI_CHAT,
        Protocol.ProviderEnum.META,
        Protocol.ModelEnum.MUSE_SPARK_1_1,
        "plain",
      ),
    );
  });

  it("keeps every recorded case aligned with the enums and its envelope", function () {
    let cases = 0;
    let responses = 0;
    for (const messageFormat of readdirSync(ROOT)) {
      expect(Object.values(Protocol.MessageFormatEnum)).toContain(
        messageFormat,
      );
      for (const provider of readdirSync(join(ROOT, messageFormat))) {
        expect(Object.values(Protocol.ProviderEnum)).toContain(provider);
        for (const model of readdirSync(join(ROOT, messageFormat, provider))) {
          expect(Object.values(Protocol.ModelEnum)).toContain(model);
          for (const name of readdirSync(
            join(ROOT, messageFormat, provider, model),
          )) {
            const relative = fixturePath(
              messageFormat as MessageFormatEnum,
              provider as ProviderEnum,
              model as ModelEnum,
              name,
            );
            const folder = join(ROOT, relative);
            const fixture = loadFixture(import.meta.url, relative);
            const request = JSON.parse(
              readFileSync(join(folder, "request.json"), "utf8"),
            );
            expect(fixture.origin).toBe("recorded");
            expect(fixture.files).toContain("request.body");
            expect(request.messageFormat).toBe(messageFormat);
            expect(request.provider).toBe(provider);
            expect(request.model).toBe(model);
            expect(request.name).toBe(name);
            expect(Object.keys(request).sort()).toEqual(
              [
                "messageFormat",
                "provider",
                "model",
                "name",
                "method",
                "url",
                "authHeader",
                "headers",
                ...(request.replay === undefined ? [] : ["replay"]),
              ].sort(),
            );
            expect(existsSync(join(folder, "sequence.json"))).toBe(false);
            const files = ["response.json", "response.body", "transport.json"];
            const found = files.filter(function (file) {
              return existsSync(join(folder, file));
            });
            expect(found.length === 0 || found.length === 3).toBe(true);
            if (found.length === 3) responses++;
            cases++;
          }
        }
      }
    }
    expect(cases).toBe(709);
    expect(responses).toBe(707);
  });
});
