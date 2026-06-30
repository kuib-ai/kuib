// @context @journal/protocol-design
import { PartTypeEnum } from "./part.type.enum";
import { StepBoundaryKindEnum } from "./step.boundary.kind.enum";
import { StepBoundaryStopReasonEnum } from "./step.boundary.stop.reason.enum";
import PartText from "./part.text";
import PartReasoning from "./part.reasoning";
import PartFile from "./part.file";
import PartToolCall from "./part.tool.call";
import PartStepBoundary from "./part.step.boundary";
import PartUser from "./part.user";
import PartAssistant from "./part.assistant";
import AnyPart from "./part.any";

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
