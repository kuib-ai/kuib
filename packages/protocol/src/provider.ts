/**
 * Provider interface — kuib's provider contract.
 *
 * Schemas for model info, capabilities, and request/response wire formats.
 * The actual LanguageModel / Provider / ProviderRegistry interfaces remain
 * as TypeScript interfaces (they have methods, not just data).
 *
 * The design: AI SDK-compatible but completely overridable. The default
 * implementation wraps AI SDK's LanguageModelV3. Anyone can implement
 * the interfaces directly without touching AI SDK.
 */

import { z } from "zod"
import { ProviderID, ModelID } from "./id.js"
import type { TokenUsage } from "./message.js"

// ---------------------------------------------------------------------------
// Auth models
// ---------------------------------------------------------------------------

export const AuthModel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("api-key"), envVar: z.string() }),
  z.object({ type: z.literal("oauth"), issuer: z.string() }),
  z.object({ type: z.literal("none") }),
])
export type AuthModel = z.infer<typeof AuthModel>

// ---------------------------------------------------------------------------
// Model capabilities and limits
// ---------------------------------------------------------------------------

export const ModelCapabilities = z.object({
  reasoning: z.boolean().optional(),
  streaming: z.boolean(),
  vision: z.boolean().optional(),
  audio: z.boolean().optional(),
  pdf: z.boolean().optional(),
  temperature: z.boolean().optional(),
  toolCalling: z.boolean(),
})
export type ModelCapabilities = z.infer<typeof ModelCapabilities>

export const ModelLimits = z.object({
  contextWindow: z.number().int(),
  maxOutput: z.number().int(),
})
export type ModelLimits = z.infer<typeof ModelLimits>

export const ModelInfo = z.object({
  id: ModelID,
  providerID: ProviderID,
  name: z.string(),
  capabilities: ModelCapabilities,
  limits: ModelLimits,
  options: z.record(z.string(), z.unknown()).optional(),
})
export type ModelInfo = z.infer<typeof ModelInfo>

// ---------------------------------------------------------------------------
// Wire format — what goes over the network to/from the LLM
// ---------------------------------------------------------------------------

export const ModelContentPart = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("image"), image: z.string(), mediaType: z.string().optional() }),
  z.object({ type: z.literal("file"), data: z.string(), mediaType: z.string() }),
  z.object({ type: z.literal("tool-call"), toolCallId: z.string(), toolName: z.string(), args: z.unknown() }),
  z.object({ type: z.literal("tool-result"), toolCallId: z.string(), toolName: z.string(), result: z.unknown() }),
  z.object({ type: z.literal("reasoning"), text: z.string() }),
])
export type ModelContentPart = z.infer<typeof ModelContentPart>

export const ModelMessage = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.array(ModelContentPart)]),
})
export type ModelMessage = z.infer<typeof ModelMessage>

export const ToolDefinition = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
})
export type ToolDefinition = z.infer<typeof ToolDefinition>

export const ModelToolCall = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()),
})
export type ModelToolCall = z.infer<typeof ModelToolCall>

export const ModelResponse = z.object({
  text: z.string(),
  toolCalls: z.array(ModelToolCall),
  usage: z.lazy(() => {
    // Avoid circular import — TokenUsage shape inlined
    return z.object({
      input: z.number().int(),
      output: z.number().int(),
      reasoning: z.number().int().optional(),
      cache: z.object({ read: z.number().int(), write: z.number().int() }).optional(),
    })
  }),
  finishReason: z.string(),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
})
export type ModelResponse = z.infer<typeof ModelResponse>

export const StreamChunk = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text-delta"), text: z.string() }),
  z.object({ type: z.literal("reasoning-delta"), text: z.string() }),
  z.object({ type: z.literal("tool-call-start"), toolCallId: z.string(), toolName: z.string() }),
  z.object({ type: z.literal("tool-call-delta"), toolCallId: z.string(), args: z.string() }),
  z.object({ type: z.literal("tool-call-complete"), toolCallId: z.string(), toolName: z.string(), args: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal("tool-result"), toolCallId: z.string(), result: z.unknown() }),
  z.object({ type: z.literal("step-start") }),
  z.object({ type: z.literal("step-finish"), usage: z.object({ input: z.number(), output: z.number(), reasoning: z.number().optional(), cache: z.object({ read: z.number(), write: z.number() }).optional() }), finishReason: z.string() }),
  z.object({ type: z.literal("error"), error: z.unknown() }),
])
export type StreamChunk = z.infer<typeof StreamChunk>

// ---------------------------------------------------------------------------
// Behavioral interfaces — these have methods, so they stay as TS interfaces
// ---------------------------------------------------------------------------

export interface ModelRequest {
  readonly system?: string[]
  readonly messages: ModelMessage[]
  readonly tools?: ToolDefinition[]
  readonly toolChoice?: "auto" | "required" | "none"
  readonly maxOutputTokens?: number
  readonly temperature?: number
  readonly topP?: number
  readonly topK?: number
  readonly providerOptions?: Record<string, unknown>
  readonly signal?: AbortSignal
  readonly headers?: Record<string, string>
}

export interface LanguageModel {
  readonly provider: ProviderID
  readonly modelID: ModelID
  generate(request: ModelRequest): Promise<ModelResponse>
  stream(request: ModelRequest): ModelStream
}

export interface ModelStream {
  readonly stream: AsyncIterable<StreamChunk>
  readonly response: Promise<ModelResponse>
}

export interface Provider {
  readonly id: ProviderID
  readonly name: string
  readonly auth: AuthModel
  languageModel(modelID: ModelID): LanguageModel
  listModels?(): Promise<ModelInfo[]>
}

export interface ProviderRegistry {
  register(provider: Provider): void
  get(id: ProviderID): Provider | undefined
  list(): Provider[]
  resolve(providerID: ProviderID, modelID: ModelID): LanguageModel
}
