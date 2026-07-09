// @context @journal/host-layer
export type CliOption = {
  type: "string" | "boolean";
  short?: string;
  default?: string | boolean | string[] | boolean[];
  multiple?: boolean;
  description?: string;
};

export type CliSchema = {
  description: string;
  options: Record<string, CliOption>;
};
