/**
 * Tool schemas — how tools are defined and registered.
 *
 * Tool input schemas use JSON Schema (plain objects) at the protocol level.
 * The tools package can use Zod internally and convert via z.toJSONSchema().
 */

import { z } from "zod";
import { ToolCallID } from "./id.js";

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const ToolSecurityHints = z.object({
  reads: z.boolean().optional(),
  writes: z.boolean().optional(),
  executes: z.boolean().optional(),
  network: z.boolean().optional(),
});
export type ToolSecurityHints = z.infer<typeof ToolSecurityHints>;

export const ToolSpec = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
  clientSide: z.boolean().optional(),
  security: ToolSecurityHints.optional(),
});
export type ToolSpec = z.infer<typeof ToolSpec>;

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

export const ToolCall = z.object({
  callID: ToolCallID,
  tool: z.string(),
  input: z.record(z.string(), z.unknown()),
});
export type ToolCall = z.infer<typeof ToolCall>;

export const ToolResult = z.object({
  output: z.string(),
  title: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  attachments: z
    .array(
      z.object({
        mime: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
});
export type ToolResult = z.infer<typeof ToolResult>;

export const ToolError = z.object({
  error: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ToolError = z.infer<typeof ToolError>;

// ---------------------------------------------------------------------------
// Behavioral interfaces (have methods — stay as TS interfaces)
// ---------------------------------------------------------------------------

export interface ToolExecutor {
  execute(call: ToolCall & { signal?: AbortSignal }): Promise<ToolResult>;
}

export interface ToolRegistry {
  register(spec: ToolSpec, executor: ToolExecutor): void;
  unregister(name: string): void;
  get(name: string): { spec: ToolSpec; executor: ToolExecutor } | undefined;
  list(): ToolSpec[];
  definitions(): Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
}
