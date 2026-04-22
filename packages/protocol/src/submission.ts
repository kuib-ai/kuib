/**
 * Submissions — the Submission Queue (SQ).
 *
 * Operations the user/TUI sends TO the engine.
 * Inspired by codex's Op enum.
 */

import { z } from "zod";
import {
  SessionID,
  MessageID,
  DiscussionID,
  ToolCallID,
  ProviderID,
  ModelID,
  CheckpointID,
  DeviceID,
} from "./id.js";
import { Part } from "./message.js";
import { ResumptionStrategy } from "./session.js";

export const SendMessage = z.object({
  type: z.literal("send-message"),
  sessionID: SessionID,
  discussionID: DiscussionID,
  parts: z.array(Part),
  model: z.object({ providerID: ProviderID, modelID: ModelID }).optional(),
  variant: z.string().optional(),
});
export type SendMessage = z.infer<typeof SendMessage>;

export const Interrupt = z.object({
  type: z.literal("interrupt"),
  sessionID: SessionID,
});
export type Interrupt = z.infer<typeof Interrupt>;

export const ApproveToolCall = z.object({
  type: z.literal("approve-tool-call"),
  sessionID: SessionID,
  callID: ToolCallID,
});
export type ApproveToolCall = z.infer<typeof ApproveToolCall>;

export const DenyToolCall = z.object({
  type: z.literal("deny-tool-call"),
  sessionID: SessionID,
  callID: ToolCallID,
  reason: z.string().optional(),
});
export type DenyToolCall = z.infer<typeof DenyToolCall>;

export const ExplainToolCall = z.object({
  type: z.literal("explain-tool-call"),
  sessionID: SessionID,
  callID: ToolCallID,
});
export type ExplainToolCall = z.infer<typeof ExplainToolCall>;

export const ToggleDiscussion = z.object({
  type: z.literal("toggle-discussion"),
  sessionID: SessionID,
  discussionID: DiscussionID,
  included: z.boolean(),
});
export type ToggleDiscussion = z.infer<typeof ToggleDiscussion>;

export const CreateDiscussion = z.object({
  type: z.literal("create-discussion"),
  sessionID: SessionID,
  title: z.string().optional(),
});
export type CreateDiscussion = z.infer<typeof CreateDiscussion>;

export const EditMessage = z.object({
  type: z.literal("edit-message"),
  sessionID: SessionID,
  messageID: MessageID,
  parts: z.array(Part),
});
export type EditMessage = z.infer<typeof EditMessage>;

export const ExcludePart = z.object({
  type: z.literal("exclude-part"),
  sessionID: SessionID,
  messageID: MessageID,
  partIndex: z.number().int(),
  excluded: z.boolean(),
});
export type ExcludePart = z.infer<typeof ExcludePart>;

export const SwitchModel = z.object({
  type: z.literal("switch-model"),
  sessionID: SessionID,
  providerID: ProviderID,
  modelID: ModelID,
});
export type SwitchModel = z.infer<typeof SwitchModel>;

export const CreateCheckpoint = z.object({
  type: z.literal("create-checkpoint"),
  sessionID: SessionID,
});
export type CreateCheckpoint = z.infer<typeof CreateCheckpoint>;

export const ResumeSession = z.object({
  type: z.literal("resume-session"),
  checkpointID: CheckpointID,
  strategy: ResumptionStrategy,
  deviceID: DeviceID,
});
export type ResumeSession = z.infer<typeof ResumeSession>;

export const RevertToCheckpoint = z.object({
  type: z.literal("revert-to-checkpoint"),
  sessionID: SessionID,
  checkpointID: CheckpointID,
});
export type RevertToCheckpoint = z.infer<typeof RevertToCheckpoint>;

export const CompactContext = z.object({
  type: z.literal("compact-context"),
  sessionID: SessionID,
  auto: z.boolean(),
});
export type CompactContext = z.infer<typeof CompactContext>;

export const Submission = z.discriminatedUnion("type", [
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
]);
export type Submission = z.infer<typeof Submission>;
