// @context @journal/host-layer
import { TranscriptRoleEnum } from "../transcript.role.enum";

type TranscriptEntry = {
  id: string;
  role: TranscriptRoleEnum;
  text: string;
};

export type { TranscriptEntry };
