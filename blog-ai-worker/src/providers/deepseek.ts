import { OpenAICompatibleProvider } from "./openai-compatible";

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, baseUrl: string, model: string) {
    super("deepseek", "DeepSeek", apiKey, baseUrl, model);
  }
}
