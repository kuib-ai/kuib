import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

// Native Xiaomi MiMo endpoint (OpenAI-compatible).
// Docs: https://mimo.mi.com/docs/en-US/price/pay-as-you-go
export const MIMO_BASE_URL = "https://api.xiaomimimo.com/v1";
export const MIMO_MODEL_ID = "mimo-v2.5-pro";

// Built lazily so dotenv has loaded XIAOMI_API_KEY before we read it.
export function createMimoModel(): LanguageModel {
  const apiKey = process.env.XIAOMI_API_KEY;

  if (!apiKey) {
    throw new Error("XIAOMI_API_KEY is not set");
  }

  // openai-compatible (not @ai-sdk/openai) so we don't send OpenAI-only request
  // fields or hit the Responses API — MiMo only speaks Chat Completions.
  // MiMo does automatic prefix caching server-side: no per-request cache flag;
  // hits are billed at the cache-hit rate and reported back in usage
  // (prompt_tokens_details.cached_tokens → usage.inputTokenDetails.cacheReadTokens,
  // surfaced in index.ts).
  const mimo = createOpenAICompatible({
    name: "mimo",
    baseURL: MIMO_BASE_URL,
    apiKey,
  });

  return mimo(MIMO_MODEL_ID);
}
