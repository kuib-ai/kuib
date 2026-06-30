// @context @journal/provider-architecture
import { createOpenAI } from "@ai-sdk/openai";

const minerva = createOpenAI({
  baseURL: "http://100.70.111.96:11434/v1",
  apiKey: "ollama",
});

export default minerva;
