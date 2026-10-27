import type { AiProvider } from "../types.ts";
import { mockProvider } from "./mock.ts";
import { OpenAiCompatibleProvider } from "./openaiCompatible.ts";

export const configuredProviders = (): AiProvider[] => {
  const providers: AiProvider[] = [];
  const apply = (suffix: "A" | "B") => {
    const key = Deno.env.get(`AI_PROVIDER_${suffix}_KEY`);
    const url = Deno.env.get(`AI_PROVIDER_${suffix}_URL`);
    const model = Deno.env.get(`AI_PROVIDER_${suffix}_MODEL`);

    if (key && url && model) {
      providers.push(
        new OpenAiCompatibleProvider(
          `provider${suffix}`,
          key,
          url,
          model,
        ),
      );
    }
  };

  apply("A");
  apply("B");

  const allowMock = Deno.env.get("AI_MOCK_FALLBACK") !== "false" ||
    providers.length === 0;

  if (allowMock) providers.push(mockProvider);

  return providers;
};

export { mockProvider, OpenAiCompatibleProvider };
