// @context @journal/protocol-design
import { PartTypeEnum } from "./part.type.enum/index.ts";
import { StepBoundaryKindEnum } from "./step.boundary.kind.enum/index.ts";
import { StepBoundaryStopReasonEnum } from "./step.boundary.stop.reason.enum/index.ts";
import PartText from "./part.text/index.ts";
import PartReasoning from "./part.reasoning/index.ts";
import PartFile from "./part.file/index.ts";
import PartToolCall from "./part.tool.call/index.ts";
import PartStepBoundary from "./part.step.boundary/index.ts";
import PartUser from "./part.user/index.ts";
import PartAssistant from "./part.assistant/index.ts";
import AnyPart from "./part.any/index.ts";

const Part = {
  PartTypeEnum,
  StepBoundaryKindEnum,
  StepBoundaryStopReasonEnum,
  PartText,
  PartReasoning,
  PartFile,
  PartToolCall,
  PartStepBoundary,
  PartUser,
  PartAssistant,
  AnyPart,
};

export default Part;
