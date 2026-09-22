// @context @journal/domains/core#^C046
import { TranscriptRoleEnum } from "../transcript.role.enum/index.ts";

type TranscriptEntry = {
  id: string;
  role: TranscriptRoleEnum;
  text: string;
};

export type { TranscriptEntry };
