// @claim core/protocol-errors
import { z } from "zod";

// @claim core/protocol-errors
const ErrorBase = z.object({
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});
type ErrorBase = z.infer<typeof ErrorBase>;

export default ErrorBase;
export type { ErrorBase };
