// @context @journal/protocol-design
import { z } from "zod";
import PartText from "../part.text/index.ts";
import PartReasoning from "../part.reasoning/index.ts";
import PartFile from "../part.file/index.ts";
import PartToolCall from "../part.tool.call/index.ts";
import PartStepBoundary from "../part.step.boundary/index.ts";

const PartAssistant = z.discriminatedUnion("type", [
  PartText,
  PartReasoning,
  PartFile,
  PartToolCall,
  PartStepBoundary,
]);
type PartAssistant = z.infer<typeof PartAssistant>;

export default PartAssistant;
export type { PartAssistant };
