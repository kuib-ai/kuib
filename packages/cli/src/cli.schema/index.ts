// @claim host/cli-package
// @claim host/cli-package
export type CliOption = {
  type: "string" | "boolean";
  short?: string;
  default?: string | boolean | string[] | boolean[];
  multiple?: boolean;
  description?: string;
};

// @claim host/cli-package
export type CliSchema = {
  description: string;
  options: Record<string, CliOption>;
};
