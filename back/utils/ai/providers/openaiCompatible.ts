import type { AiProvider, AiProviderResult, AiReviewInput } from "../types.ts";

const parseJsonContent = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw new Error("AI provider did not return JSON");
  }
};

export class OpenAiCompatibleProvider implements AiProvider {
  constructor(
    public name: string,
    private apiKey: string,
    private baseUrl: string,
    public model: string,
  ) {}

  async generate(
    input: AiReviewInput,
    prompt: string,
  ): Promise<AiProviderResult> {
    const content: unknown[] = [{ type: "text", text: prompt }];

    if (input.imageReference) {
      content.push({
        type: "image_url",
        image_url: { url: input.imageReference },
      });
    }

    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );

    if (!response.ok) {
      throw new Error(
        `${this.name} returned HTTP ${response.status}`,
      );
    }

    const payload = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content;

    if (!text) throw new Error(`${this.name} returned an empty response`);

    return {
      provider: this.name,
      model: this.model,
      output: parseJsonContent(text),
    };
  }
}
