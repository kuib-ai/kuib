// @context @journal/protocol-design
import { z } from "zod";

const ErrorBase = z.object({
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});
type ErrorBase = z.infer<typeof ErrorBase>;

export default ErrorBase;
export type { ErrorBase };
