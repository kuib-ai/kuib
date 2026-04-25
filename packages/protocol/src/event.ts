/**
 * Events — the Event Queue (EQ).
 *
 * Events the engine emits TO the user/TUI.
 * The single source of truth for what the engine is doing.
 */

import { z } from "zod";
import {
  SessionID,
  MessageID,
  PartID,
  ToolCallID,
  CheckpointID,
  ProviderID,
  ModelID,
} from "./id.js";
import { Message, Part, TokenUsage, MessageAssistantError } from "./message.js";
import { SessionStatus, Discussion } from "./session.js";
import { SecurityVerdict } from "./security.js";

// ---------------------------------------------------------------------------
// Turn lifecycle
// ---------------------------------------------------------------------------

export const TurnStarted = z.object({
  type: z.literal("turn-started"),
  sessionID: SessionID,
  messageID: MessageID,
});
export type TurnStarted = z.infer<typeof TurnStarted>;

export const TurnCompleted = z.object({
  type: z.literal("turn-completed"),
  sessionID: SessionID,
  messageID: MessageID,
  tokens: TokenUsage,
  cost: z.number(),
  finishReason: z.string(),
});
export type TurnCompleted = z.infer<typeof TurnCompleted>;

export const TurnAborted = z.object({
  type: z.literal("turn-aborted"),
  sessionID: SessionID,
  messageID: MessageID,
  reason: z.string(),
});
export type TurnAborted = z.infer<typeof TurnAborted>;

export const TurnError = z.object({
  type: z.literal("turn-error"),
  sessionID: SessionID,
  messageID: MessageID,
  error: MessageAssistantError,
});
export type TurnError = z.infer<typeof TurnError>;

// ---------------------------------------------------------------------------
// Streaming content
// ---------------------------------------------------------------------------

export const TextDelta = z.object({
  type: z.literal("text-delta"),
  sessionID: SessionID,
  messageID: MessageID,
  partID: PartID,
  delta: z.string(),
});
export type TextDelta = z.infer<typeof TextDelta>;

export const ReasoningDelta = z.object({
  type: z.literal("reasoning-delta"),
  sessionID: SessionID,
  messageID: MessageID,
  partID: PartID,
  delta: z.string(),
});
export type ReasoningDelta = z.infer<typeof ReasoningDelta>;

// ---------------------------------------------------------------------------
// Tool lifecycle
// ---------------------------------------------------------------------------

export const ToolCallRequested = z.object({
  type: z.literal("tool-call-requested"),
  sessionID: SessionID,
  messageID: MessageID,
  callID: ToolCallID,
  tool: z.string(),
  input: z.record(z.string(), z.unknown()),
});
export type ToolCallRequested = z.infer<typeof ToolCallRequested>;

export const ToolApprovalRequired = z.object({
  type: z.literal("tool-approval-required"),
  sessionID: SessionID,
  callID: ToolCallID,
  tool: z.string(),
  input: z.record(z.string(), z.unknown()),
  verdict: SecurityVerdict,
  explanation: z.string().optional(),
});
export type ToolApprovalRequired = z.infer<typeof ToolApprovalRequired>;

export const ToolCallStarted = z.object({
  type: z.literal("tool-call-started"),
  sessionID: SessionID,
  callID: ToolCallID,
});
export type ToolCallStarted = z.infer<typeof ToolCallStarted>;

export const ToolCallOutput = z.object({
  type: z.literal("tool-call-output"),
  sessionID: SessionID,
  callID: ToolCallID,
  output: z.string(),
  title: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});
export type ToolCallOutput = z.infer<typeof ToolCallOutput>;

export const ToolCallFailed = z.object({
  type: z.literal("tool-call-failed"),
  sessionID: SessionID,
  callID: ToolCallID,
  error: z.string(),
});
export type ToolCallFailed = z.infer<typeof ToolCallFailed>;

export const ToolExplanation = z.object({
  type: z.literal("tool-explanation"),
  sessionID: SessionID,
  callID: ToolCallID,
  explanation: z.string(),
});
export type ToolExplanation = z.infer<typeof ToolExplanation>;

// ---------------------------------------------------------------------------
// Step boundaries
// ---------------------------------------------------------------------------

export const StepStarted = z.object({
  type: z.literal("step-started"),
  sessionID: SessionID,
  messageID: MessageID,
});
export type StepStarted = z.infer<typeof StepStarted>;

export const StepFinished = z.object({
  type: z.literal("step-finished"),
  sessionID: SessionID,
  messageID: MessageID,
  tokens: TokenUsage,
  finishReason: z.string(),
});
export type StepFinished = z.infer<typeof StepFinished>;

// ---------------------------------------------------------------------------
// Part updates
// ---------------------------------------------------------------------------

export const PartUpdated = z.object({
  type: z.literal("part-updated"),
  sessionID: SessionID,
  messageID: MessageID,
  part: Part.and(z.object({ id: PartID })),
});
export type PartUpdated = z.infer<typeof PartUpdated>;

export const PartRemoved = z.object({
  type: z.literal("part-removed"),
  sessionID: SessionID,
  messageID: MessageID,
  partID: PartID,
});
export type PartRemoved = z.infer<typeof PartRemoved>;

// ---------------------------------------------------------------------------
// Session-level events
// ---------------------------------------------------------------------------

export const SessionUpdated = z.object({
  type: z.literal("session-updated"),
  sessionID: SessionID,
  status: SessionStatus,
});
export type SessionUpdated = z.infer<typeof SessionUpdated>;

export const MessageUpdated = z.object({
  type: z.literal("message-updated"),
  sessionID: SessionID,
  message: Message,
});
export type MessageUpdated = z.infer<typeof MessageUpdated>;

export const DiscussionUpdated = z.object({
  type: z.literal("discussion-updated"),
  sessionID: SessionID,
  discussion: Discussion,
});
export type DiscussionUpdated = z.infer<typeof DiscussionUpdated>;

export const CheckpointCreated = z.object({
  type: z.literal("checkpoint-created"),
  sessionID: SessionID,
  checkpointID: CheckpointID,
});
export type CheckpointCreated = z.infer<typeof CheckpointCreated>;

export const ContextCompacted = z.object({
  type: z.literal("context-compacted"),
  sessionID: SessionID,
  summary: z.string(),
});
export type ContextCompacted = z.infer<typeof ContextCompacted>;

export const ModelSwitched = z.object({
  type: z.literal("model-switched"),
  sessionID: SessionID,
  providerID: ProviderID,
  modelID: ModelID,
});
export type ModelSwitched = z.infer<typeof ModelSwitched>;

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export const Event = z.discriminatedUnion("type", [
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
]);
export type Event = z.infer<typeof Event>;
