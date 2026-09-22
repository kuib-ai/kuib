// @context @journal/domains/core#^C004
import { randomUUID } from "node:crypto";
import type { z } from "zod";

const newID = function <S extends z.ZodType>(schema: S): z.infer<S> {
  return schema.parse(randomUUID());
};

export default newID;
