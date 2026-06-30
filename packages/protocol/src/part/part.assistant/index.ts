// @context @journal/protocol-design
import { z } from "zod";
import PartText from "../part.text";
import PartReasoning from "../part.reasoning";
import PartFile from "../part.file";
import PartToolCall from "../part.tool.call";
import PartStepBoundary from "../part.step.boundary";

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
