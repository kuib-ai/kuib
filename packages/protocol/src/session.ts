/**
 * Session, discussion clusters, and checkpointing.
 *
 * A Session contains Discussions — logical message groupings that can be
 * included/excluded from the context window at runtime.
 *
 * Checkpoints enable cross-device resumption and revert.
 */

import { z } from "zod";
import {
  SessionID,
  ThreadID,
  DiscussionID,
  CheckpointID,
  DeviceID,
  MessageID,
} from "./id.js";
import { Message, TokenUsage, ModelRef } from "./message.js";

// ---------------------------------------------------------------------------
// Discussion — a logical cluster of messages
// ---------------------------------------------------------------------------

export const Discussion = z.object({
  id: DiscussionID,
  sessionID: SessionID,
  title: z.string().optional(),
  included: z.boolean(),
  createdAt: z.number(),
  messageIDs: z.array(MessageID),
});
export type Discussion = z.infer<typeof Discussion>;

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export const SessionStatus = z.enum(["idle", "busy", "waiting", "error"]);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const Session = z.object({
  id: SessionID,
  threadID: ThreadID,
  title: z.string().optional(),
  status: SessionStatus,
  createdAt: z.number(),
  updatedAt: z.number(),
  deviceID: DeviceID,
  cwd: z.string(),
  gitRemote: z.string().optional(),
  model: ModelRef,
  discussions: z.array(Discussion),
  usage: TokenUsage.extend({ cost: z.number() }),
});
export type Session = z.infer<typeof Session>;

// ---------------------------------------------------------------------------
// Checkpoint — serialized session state for persistence/resumption
// ---------------------------------------------------------------------------

export const GitState = z.object({
  branch: z.string(),
  commit: z.string(),
  remote: z.string().optional(),
  modifiedFiles: z.array(z.string()),
});
export type GitState = z.infer<typeof GitState>;

export const CheckpointState = z.object({
  session: Session,
  messages: z.array(Message),
  git: GitState.optional(),
});
export type CheckpointState = z.infer<typeof CheckpointState>;

export const Checkpoint = z.object({
  id: CheckpointID,
  sessionID: SessionID,
  threadID: ThreadID,
  deviceID: DeviceID,
  createdAt: z.number(),
  state: CheckpointState,
});
export type Checkpoint = z.infer<typeof Checkpoint>;

// ---------------------------------------------------------------------------
// Resumption — picking up a session on a different device
// ---------------------------------------------------------------------------

export const ResumptionStrategy = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("remote"),
    deviceID: DeviceID,
  }),
  z.object({
    type: z.literal("recover"),
    checkpointID: CheckpointID,
  }),
  z.object({
    type: z.literal("context-only"),
    checkpointID: CheckpointID,
  }),
]);
export type ResumptionStrategy = z.infer<typeof ResumptionStrategy>;
