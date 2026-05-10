import { OpenAICompatibleProvider } from "./openai-compatible";

export class MoonshotCnProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, baseUrl: string, model: string) {
    super("moonshot-cn", "Moonshot CN", apiKey, baseUrl, model);
  }
}
