// ---------------------------------------------------------------------------
// @kuib/protocol — schemas, events, and interfaces
//
// Zod schemas for runtime validation. Types inferred from schemas.
// Behavioral interfaces (with methods) remain as TypeScript interfaces.
// ---------------------------------------------------------------------------

// IDs — schemas + types
export {
  SessionID,
  MessageID,
  PartID,
  ThreadID,
  DiscussionID,
  ToolCallID,
  ProviderID,
  ModelID,
  DeviceID,
  CheckpointID,
} from "./id.js";

// Messages — schemas + types
export {
  TokenUsage,
  ToolCallPending,
  ToolCallRunning,
  ToolCallCompleted,
  ToolCallError,
  ToolCallState,
  TextPart,
  ReasoningPart,
  FilePart,
  ToolCallPart,
  StepBoundary,
  Part,
  MessageError,
  ModelRef,
  UserMessage,
  AssistantMessage,
  Message,
} from "./message.js";

// Session — schemas + types
export {
  Discussion,
  SessionStatus,
  Session,
  GitState,
  CheckpointState,
  Checkpoint,
  ResumptionStrategy,
} from "./session.js";

// Provider — schemas + types + interfaces
export {
  AuthModel,
  ModelCapabilities,
  ModelLimits,
  ModelInfo,
  ModelContentPart,
  ModelMessage,
  ToolDefinition,
  ModelToolCall,
  ModelResponse,
  StreamChunk,
} from "./provider.js";
export type {
  ModelRequest,
  LanguageModel,
  ModelStream,
  Provider,
  ProviderRegistry,
} from "./provider.js";

// Submissions (SQ — user → engine) — schemas + types
export {
  SendMessage,
  Interrupt,
  ApproveToolCall,
  DenyToolCall,
  ExplainToolCall,
  ToggleDiscussion,
  CreateDiscussion,
  EditMessage,
  ExcludePart,
  SwitchModel,
  CreateCheckpoint,
  ResumeSession,
  RevertToCheckpoint,
  CompactContext,
  Submission,
} from "./submission.js";

// Events (EQ — engine → user) — schemas + types
export {
  TurnStarted,
  TurnCompleted,
  TurnAborted,
  TurnError,
  TextDelta,
  ReasoningDelta,
  ToolCallRequested,
  ToolApprovalRequired,
  ToolCallStarted,
  ToolCallOutput,
  ToolCallFailed,
  ToolExplanation,
  StepStarted,
  StepFinished,
  PartUpdated,
  PartRemoved,
  SessionUpdated,
  MessageUpdated,
  DiscussionUpdated,
  CheckpointCreated,
  ContextCompacted,
  ModelSwitched,
  Event,
} from "./event.js";

// Tools — schemas + types + interfaces
export {
  ToolSecurityHints,
  ToolSpec,
  ToolCall,
  ToolResult,
  ToolError,
} from "./tool.js";
export type { ToolExecutor, ToolRegistry } from "./tool.js";

// I/O — interfaces only (behavioral contracts, no schemas)
export type {
  FileSystem,
  FileStat,
  DirEntry,
  FileWatchEvent,
  Disposable,
  Shell,
  ShellOptions,
  ShellResult,
  ShellProcess,
  Network,
  IOContext,
} from "./io.js";

// Security — schemas + types + interfaces
export {
  Operation,
  Target,
  OPERATION_SCORES,
  TARGET_SCORES,
  CommandEffect,
  SecurityTier,
  RiskAssessment,
  SecurityVerdict,
  SecurityProfile,
  PROFILES,
  ApprovalState,
} from "./security.js";
export type { CommandParser } from "./security.js";

// State — schemas + types + utilities
export {
  Reducers,
  field,
  UsageAccumulator,
  SESSION_STATE,
  applyUpdate,
  createState,
  validateState,
} from "./state.js";
export type {
  Reducer,
  StateField,
  SessionStateDefinition,
  StateValues,
  StateUpdate,
  SessionState,
  SessionStateUpdate,
} from "./state.js";

// Transport — interfaces only
export type {
  Unsubscribe,
  Transport,
  TransportFactory,
  SessionTransport,
} from "./transport.js";
