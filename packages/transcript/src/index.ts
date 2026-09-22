// @context @journal/domains/core#^C002
import { TranscriptRoleEnum } from "./transcript.role.enum/index.ts";
import foldTranscript from "./fold.transcript/index.ts";

const Transcript = {
  TranscriptRoleEnum,
  foldTranscript,
};

export default Transcript;
