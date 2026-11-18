import { rewriteLines, safe } from '../../../lib/rewrite';
import { authorized } from '../../../lib/auth';
export const maxDuration = 60;
// One round: rewrite the lines that contain flagged sentences, return the new text.
export async function POST(req) {
  if (!authorized(req)) return Response.json({ error: 'Wrong password' }, { status: 401 });
  try {
    const { text, flagged } = await req.json();
    const lines = text.split('\n');
    const norm = s => s.replace(/\s+/g, ' ').trim();
    const targets = [];
    lines.forEach((ln, i) => {
      const n = norm(ln);
      if (n.length > 40 && flagged.some(f => n.includes(norm(f).slice(0, 60)))) targets.push({ id: i, text: ln });
    });
    if (!targets.length) return Response.json({ text, changed: 0 });
    const out = await rewriteLines(targets);
    let changed = 0;
    for (const o of out) {
      const t = targets.find(x => x.id === o.id);
      if (t && safe(t.text, o.text)) { lines[o.id] = o.text; changed++; }
    }
    return Response.json({ text: lines.join('\n'), changed, attempted: targets.length });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
