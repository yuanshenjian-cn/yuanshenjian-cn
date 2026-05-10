import { OpenAICompatibleProvider } from "./openai-compatible";

export class TencentTokenHubProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, baseUrl: string, model: string) {
    super("tencent-tokenhub", "Tencent TokenHub", apiKey, baseUrl, model);
  }
}
