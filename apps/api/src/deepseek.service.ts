import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { createHash } from "node:crypto";
import { INTENT_ROUTER_PROMPT } from "@bank-agent/prompts";

export interface RoutedIntent {
  intent: string;
  confidence: number;
  requiresWrite: boolean;
  missingFields: string[];
}

@Injectable()
export class DeepSeekService {
  private readonly client?: OpenAI;

  constructor() {
    if (process.env.DEEPSEEK_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
      });
    }
  }

  async routeIntent(rawText: string): Promise<RoutedIntent | null> {
    if (!this.client) return null;
    const sanitized = this.redact(rawText);
    try {
      const request = {
        model: process.env.DEEPSEEK_ROUTER_MODEL ?? "deepseek-flash",
        messages: [
          { role: "system", content: INTENT_ROUTER_PROMPT },
          { role: "user", content: sanitized },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 300,
        thinking: { type: "disabled" },
        user_id: createHash("sha256").update("demo-user-v1").digest("hex").slice(0, 32),
      } as ChatCompletionCreateParamsNonStreaming & Record<string, unknown>;
      const response = await this.client.chat.completions.create(request);
      const content = response.choices[0]?.message?.content;
      return content ? (JSON.parse(content) as RoutedIntent) : null;
    } catch {
      return null;
    }
  }

  private redact(value: string) {
    return value
      .replace(/\b\d{17}[\dXx]\b/g, "[身份证号已移除]")
      .replace(/\b\d{12,19}\b/g, "[卡号已移除]")
      .replace(/(?:验证码|密码)[:：]?\s*\d{4,8}/g, "[敏感信息已移除]");
  }
}
