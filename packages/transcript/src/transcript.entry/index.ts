// @claim core/transcript-fold
import { TranscriptRoleEnum } from "../transcript.role.enum/index.ts";

// @claim core/transcript-fold
type TranscriptEntry = {
  id: string;
  role: TranscriptRoleEnum;
  text: string;
};

export type { TranscriptEntry };
