// @claim core/protocol-ids
import { randomUUID } from "node:crypto";
import type { z } from "zod";

// @claim core/protocol-ids
const newID = function <S extends z.ZodType>(schema: S): z.infer<S> {
  return schema.parse(randomUUID());
};

export default newID;
