// @claim core/model-ref-usage
import { z } from "zod";

// @claim core/model-ref-usage
const TokenUsage = z.object({
  input: z.number().int(),
  output: z.number().int(),
  reasoning: z.number().int().optional(),
  cache: z
    .object({
      read: z.number().int(),
      write: z.number().int(),
    })
    .optional(),
});
type TokenUsage = z.infer<typeof TokenUsage>;

export default TokenUsage;
export type { TokenUsage };
