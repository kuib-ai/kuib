/**
 * Security schemas — risk assessment, approval flow, and profiles.
 *
 * Risk = operation score × target score.
 * Pipeline risk = max across all effects.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Risk axes
// ---------------------------------------------------------------------------

export const Operation = z.enum([
  "read",
  "metadata",
  "local-write",
  "append",
  "overwrite",
  "delete",
  "execute",
  "network-out",
  "install",
  "privilege",
]);
export type Operation = z.infer<typeof Operation>;

export const Target = z.enum([
  "project",
  "temp",
  "user-home",
  "package",
  "network",
  "system-config",
  "system-binary",
  "kernel",
  "root",
]);
export type Target = z.infer<typeof Target>;

export const OPERATION_SCORES: Record<Operation, number> = {
  read: 0,
  metadata: 1,
  "local-write": 2,
  append: 2,
  overwrite: 3,
  delete: 4,
  execute: 3,
  "network-out": 3,
  install: 3,
  privilege: 5,
};

export const TARGET_SCORES: Record<Target, number> = {
  project: 0,
  temp: 0,
  "user-home": 1,
  package: 2,
  network: 3,
  "system-config": 4,
  "system-binary": 4,
  kernel: 5,
  root: 5,
};

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

export const CommandEffect = z.object({
  operation: Operation,
  target: Target,
  description: z.string().optional(),
});
export type CommandEffect = z.infer<typeof CommandEffect>;

export const SecurityTier = z.enum(["auto-approve", "ask", "block"]);
export type SecurityTier = z.infer<typeof SecurityTier>;

export const RiskAssessment = z.object({
  effects: z.array(CommandEffect),
  score: z.number(),
  tier: SecurityTier,
});
export type RiskAssessment = z.infer<typeof RiskAssessment>;

export const SecurityVerdict = z.object({
  tier: SecurityTier,
  assessment: RiskAssessment,
  reason: z.string(),
});
export type SecurityVerdict = z.infer<typeof SecurityVerdict>;

// ---------------------------------------------------------------------------
// Security profiles
// ---------------------------------------------------------------------------

export const SecurityProfile = z.object({
  name: z.string(),
  autoApproveThreshold: z.number(),
  blockThreshold: z.number(),
  allowlist: z.array(z.string()).optional(),
  blocklist: z.array(z.string()).optional(),
});
export type SecurityProfile = z.infer<typeof SecurityProfile>;

export const PROFILES: Record<string, SecurityProfile> = {
  development: {
    name: "development",
    autoApproveThreshold: 4,
    blockThreshold: 20,
  },
  production: {
    name: "production",
    autoApproveThreshold: 0,
    blockThreshold: 10,
  },
  readonly: {
    name: "readonly",
    autoApproveThreshold: 0,
    blockThreshold: 1,
  },
};

// ---------------------------------------------------------------------------
// Approval state
// ---------------------------------------------------------------------------

export const ApprovalState = z.discriminatedUnion("status", [
  z.object({ status: z.literal("pending"), verdict: SecurityVerdict }),
  z.object({ status: z.literal("approved") }),
  z.object({ status: z.literal("denied"), reason: z.string().optional() }),
  z.object({ status: z.literal("explaining"), verdict: SecurityVerdict }),
]);
export type ApprovalState = z.infer<typeof ApprovalState>;

// ---------------------------------------------------------------------------
// Command parser interface (behavioral — stays as TS interface)
// ---------------------------------------------------------------------------

export interface CommandParser {
  parse(command: string): CommandEffect[];
  assess(command: string, profile: SecurityProfile): SecurityVerdict;
}
