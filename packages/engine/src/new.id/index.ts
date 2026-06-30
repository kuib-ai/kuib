// @context @journal/protocol-design
import { randomUUID } from "node:crypto";
import type { z } from "zod";

const newID = function <S extends z.ZodType>(schema: S): z.infer<S> {
  return schema.parse(randomUUID());
};

export default newID;
