import OpenAI from "openai";
import { TaskType, MODEL_CHAINS } from "./models";

let _openai: OpenAI | null = null;
function getClient() {
  if (!_openai) _openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY! });
  return _openai;
}

// Cooldown tracking — 5 minutes per model
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

function isCooledDown(model: string): boolean {
  const ts = cooldowns.get(model);
  return !!ts && Date.now() - ts < COOLDOWN_MS;
}

function setCooldown(model: string) {
  cooldowns.set(model, Date.now());
}

export interface CompletionParams {
  task: TaskType;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  validate?: (content: string) => boolean;
}

export async function generateCompletion(params: CompletionParams) {
  const { task, messages, temperature = 0.3, max_tokens = 2048, validate } = params;
  const chain = MODEL_CHAINS[task];
  const openai = getClient();
  let lastError: any;

  for (const model of chain) {
    if (isCooledDown(model)) {
      console.log("[ROUTER] skip_cooldown", { model });
      continue;
    }

    const start = Date.now();
    try {
      console.log("[ROUTER] attempt", { task, model, max_tokens });
      const res = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        stream: false,
      });

      // If validator is provided, check response quality
      const rawContent = res.choices[0]?.message?.content;
      const finishReason = res.choices[0]?.finish_reason;
      const usage = res.usage;
      const content = (rawContent || "").trim();

      console.log("[ROUTER] raw_response", {
        task,
        model,
        contentLength: content.length,
        finishReason,
        hasChoices: res.choices?.length > 0,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      });

      // Retry on length truncation with doubled budget
      if (finishReason === "length") {
        const doubledTokens = max_tokens * 2;
        console.warn("[ROUTER] truncated retrying_with_double", { model, prevMax: max_tokens, newMax: doubledTokens });
        try {
          const retryRes = await openai.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: doubledTokens,
            stream: false,
          });
          const retryContent = (retryRes.choices[0]?.message?.content || "").trim();
          const retryOk = !validate || validate(retryContent);
          console.log("[ROUTER] retry_result", {
            model,
            contentLength: retryContent.length,
            valid: retryOk,
            finishReason: retryRes.choices[0]?.finish_reason,
          });
          if (retryOk) {
            console.log("[ROUTER] success", { task, model, latency: `${Date.now() - start}ms`, retried: true });
            return retryRes;
          }
        } catch (retryErr: any) {
          console.warn("[ROUTER] retry_failed", { model, message: retryErr?.message });
        }
      }

      if (validate && !validate(content)) {
        console.warn("[ROUTER] validation_failed retrying", {
          task,
          model,
          finishReason,
          contentPreview: content.slice(0, 300),
          contentLength: content.length,
          completionTokens: usage?.completion_tokens,
          rawContentNull: rawContent === null,
          rawContentUndefined: rawContent === undefined,
        });
        continue;
      }

      console.log("[ROUTER] success", { task, model, latency: `${Date.now() - start}ms` });
      return res;
    } catch (e: any) {
      lastError = e;
      if (e?.status === 429 || e?.code === "rate_limit_exceeded" || e?.error?.code === 429) {
        console.warn("[ROUTER] cooldown", { model, reason: e?.status || e?.code || e?.error?.code });
        setCooldown(model);
        continue;
      }
      console.error("[ROUTER] error", {
        model,
        message: e?.message,
        status: e?.status,
        code: e?.code,
        type: e?.type,
        errorCode: e?.error?.code,
        errorMessage: e?.error?.message,
        errorMeta: e?.error?.metadata,
        param: e?.param,
        headers: e?.headers ? Object.fromEntries(e.headers) : undefined,
        stack: e?.stack?.split("\n").slice(0, 4).join(" | "),
      });
      continue;
    }
  }

  throw new Error(lastError?.message || "All models failed");
}
