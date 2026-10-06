import { getSetting } from "../db";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

export function ollamaModel(): string {
  return getSetting("ollama_model", process.env.OLLAMA_MODEL || "mistral:7b");
}

export async function ollamaGenerate(opts: {
  prompt: string;
  system?: string;
  json?: boolean;
  timeoutMs?: number;
}): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel(),
      prompt: opts.prompt,
      system: opts.system,
      stream: false,
      ...(opts.json ? { format: "json" } : {}),
      options: { temperature: 0.4, num_predict: 2048 },
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 600_000),
  });
  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  return String(data.response || "");
}

/** Parse a JSON object out of a model response, tolerating stray prose. */
export function extractJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    }
    throw new Error("Model did not return valid JSON");
  }
}
