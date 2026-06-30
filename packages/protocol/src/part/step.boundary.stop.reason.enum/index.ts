// @context @journal/protocol-design
export enum StepBoundaryStopReasonEnum {
  INTERRUPTED = "interrupted",
  TOOL_CALL_REQUEST = "tool-call-request",
  NORMAL = "normal",
  LENGTH = "length",
  CONTENT_FILTER = "content-filter",
}
