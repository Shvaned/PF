/**
 * Extract JSON from model output. Tries multiple strategies:
 * 1. Direct JSON object in response
 * 2. Markdown-fenced JSON (```json ... ```)
 * 3. Stripping text before first { and after last }
 * Returns the parsed object or null if all strategies fail.
 */
export function extractJSON(raw: string): any | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Strategy 1: direct JSON object
  let match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  // Strategy 2: markdown code fences
  match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    const inner = match[1].trim();
    const innerMatch = inner.match(/\{[\s\S]*\}/);
    if (innerMatch) {
      try { return JSON.parse(innerMatch[0]); } catch {}
    }
  }

  // Strategy 3: find first { and last }, extract everything between
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

/**
 * Extract JSON array from model output. Same strategies but for arrays.
 */
export function extractJSONArray(raw: string): any[] | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  let match = trimmed.match(/\[[\s\S]*\]/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    const inner = match[1].trim();
    const innerMatch = inner.match(/\[[\s\S]*\]/);
    if (innerMatch) {
      try { return JSON.parse(innerMatch[0]); } catch {}
    }
  }

  const first = trimmed.indexOf("[");
  const last = trimmed.lastIndexOf("]");
  if (first >= 0 && last > first) {
    try { return JSON.parse(trimmed.slice(first, last + 1)); } catch {}
  }

  return null;
}
