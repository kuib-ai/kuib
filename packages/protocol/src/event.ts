import z from "zod";
import { PartID } from "./id.js";
import { PartTypeEnum } from "./message.js";

export const PartTextBase = z.object({
  partID: PartID,
});

export const PartTextStart = PartTextBase.extend({}).brand("PartTextStart");

export const PartTextDelta = PartTextBase.extend({
  type: z.literal(PartTypeEnum.TEXT),
  text: z.string(),
}).brand("PartTextDelta");

export const PartTextStop = PartTextBase.extend({}).brand("PartTextStop");

export const PartFileBase = z.object({
  partID: PartID,
});

export const PartFileStart = PartFileBase.extend({}).brand("PartFileStart");

export const PartFileDelta = PartFileBase.extend({
  type: z.literal(PartTypeEnum.TEXT),
  text: z.string(),
}).brand("PartFileDelta");

export const PartFileStop = PartFileBase.extend({}).brand("PartFileStop");
