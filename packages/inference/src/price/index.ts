// @claim core/provider-captures

export type Price = {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite5m?: number;
  cacheWrite1h?: number;
  inputTokens: number;
};
