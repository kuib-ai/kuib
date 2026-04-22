/**
 * Branded ID types — Zod schemas with branded strings.
 *
 * Each entity gets its own branded type so you can't accidentally
 * pass a SessionID where a MessageID is expected.
 * Runtime validation ensures IDs are non-empty strings.
 */

import { z } from "zod";

export const SessionID = z.string().min(1).brand("SessionID");
export type SessionID = z.infer<typeof SessionID>;

export const MessageID = z.string().min(1).brand("MessageID");
export type MessageID = z.infer<typeof MessageID>;

export const PartID = z.string().min(1).brand("PartID");
export type PartID = z.infer<typeof PartID>;

export const ThreadID = z.string().min(1).brand("ThreadID");
export type ThreadID = z.infer<typeof ThreadID>;

export const DiscussionID = z.string().min(1).brand("DiscussionID");
export type DiscussionID = z.infer<typeof DiscussionID>;

export const ToolCallID = z.string().min(1).brand("ToolCallID");
export type ToolCallID = z.infer<typeof ToolCallID>;

export const ProviderID = z.string().min(1).brand("ProviderID");
export type ProviderID = z.infer<typeof ProviderID>;

export const ModelID = z.string().min(1).brand("ModelID");
export type ModelID = z.infer<typeof ModelID>;

export const DeviceID = z.string().min(1).brand("DeviceID");
export type DeviceID = z.infer<typeof DeviceID>;

export const CheckpointID = z.string().min(1).brand("CheckpointID");
export type CheckpointID = z.infer<typeof CheckpointID>;
