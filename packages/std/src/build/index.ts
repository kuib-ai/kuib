// @context @journal/house-style-linting
import { z } from "zod";

type LiteralKeys<Shape extends z.ZodRawShape> = {
  [K in keyof Shape]: Shape[K] extends z.ZodLiteral<
    string | number | bigint | boolean | null | undefined
  >
    ? K
    : never;
}[keyof Shape & string];

type BuildInput<S extends z.ZodObject> = Omit<
  z.input<S>,
  LiteralKeys<S["shape"]>
>;

const literalCache = new WeakMap<object, Record<string, unknown>>();

const unwrapField = function (field: z.ZodType): z.ZodType {
  if (field instanceof z.ZodOptional || field instanceof z.ZodNullable) {
    return unwrapField(field.unwrap() as z.ZodType);
  }
  if (field instanceof z.ZodDefault) {
    return unwrapField(field.unwrap() as z.ZodType);
  }
  return field;
};

const singleLiteralValue = function (field: z.ZodLiteral): unknown | undefined {
  if (field.values.size !== 1) {
    return undefined;
  }
  return field.values.values().next().value;
};

const collectLiterals = function (
  shape: z.ZodRawShape,
): Record<string, unknown> {
  const literals: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(shape)) {
    const inner = unwrapField(field as z.ZodType);
    if (!(inner instanceof z.ZodLiteral)) {
      continue;
    }
    const value = singleLiteralValue(inner);
    if (value === undefined) {
      throw new TypeError(
        `build: field "${key}" is a multi-value literal and cannot be auto-filled`,
      );
    }
    literals[key] = value;
  }

  return literals;
};

const literalsFor = function (schema: z.ZodObject): Record<string, unknown> {
  const cached = literalCache.get(schema);
  if (cached !== undefined) {
    return cached;
  }
  const literals = collectLiterals(schema.shape);
  literalCache.set(schema, literals);
  return literals;
};

const build = function <S extends z.ZodObject>(
  schema: S,
  input: BuildInput<S>,
): z.infer<S> {
  if (!(schema instanceof z.ZodObject)) {
    throw new TypeError(
      "build: expected a Zod object schema (not a union/effect). Pass a concrete variant such as Protocol.Error.ErrorUnknown.",
    );
  }

  return schema.parse({ ...input, ...literalsFor(schema) });
};

export default build;
export type { BuildInput, LiteralKeys };
