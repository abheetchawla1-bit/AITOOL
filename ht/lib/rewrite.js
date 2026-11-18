const RULES = `You rewrite sentences from Indian real-estate locality pages so they read as human-written.
Rules:
- Keep every fact, number, name and unit exactly. Never add new facts.
- Never use the rupee symbol; write "Rs." instead.
- Keep any token starting with @ (for example @locality) exactly as is.
- Fact-dense, plain, specific. Vary sentence length. Prefer concrete nouns and numbers over adjectives.
- Avoid filler like "nestled", "vibrant", "bustling", "offers a blend", "whether you", "in conclusion", "it is worth noting".
- No em dashes. No rhetorical questions. Keep roughly the same length.
Return ONLY a JSON array of objects {"id": number, "text": string}, one per input line, same ids.`;

export async function rewriteLines(lines) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: 8000,
      system: RULES,
      messages: [{ role: 'user', content: JSON.stringify(lines) }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Claude error: ' + (j.error?.message || r.status));
  const t = (j.content || []).map(c => c.text || '').join('');
  const m = t.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('Claude returned no JSON');
  return JSON.parse(m[0]);
}

const ats = s => (s.match(/@\w+/g) || []).sort().join(',');
// Accept a rewrite only if identifiers survive and numbers are intact.
export function safe(orig, next) {
  if (!next || typeof next !== 'string') return false;
  if (/₹/.test(next)) return false;
  if (ats(orig) !== ats(next)) return false;
  const nums = s => (s.match(/\d[\d,.]*/g) || []).sort().join('|');
  return nums(orig) === nums(next);
}
