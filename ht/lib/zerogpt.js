// ZeroGPT business API. Verify endpoint/fields against your ZeroGPT API docs if it changes.
const URL_ = process.env.ZEROGPT_URL || 'https://api.zerogpt.com/api/detect/detectText';

export async function detect(text) {
  const key = process.env.ZEROGPT_API_KEY;
  if (!key) throw new Error('ZEROGPT_API_KEY is not set');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ApiKey: key },
    body: JSON.stringify({ input_text: text }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error('ZeroGPT error: ' + (j.message || j.error || r.status));
  const d = j.data || j;
  const pct = Number(d.fakePercentage ?? d.fake_percentage ?? 0);
  const flagged = (d.h || d.highlight_sentences || []).map(s => String(s).trim()).filter(Boolean);
  return { percent: pct, flagged, words: d.textWords ?? null, aiWords: d.aiWords ?? null };
}
