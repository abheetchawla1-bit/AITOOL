import { detect } from '../../../lib/zerogpt';
import { authorized } from '../../../lib/auth';
export const maxDuration = 60;
export async function POST(req) {
  if (!authorized(req)) return Response.json({ error: 'Wrong password' }, { status: 401 });
  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 50) return Response.json({ error: 'Text too short' }, { status: 400 });
    return Response.json(await detect(text));
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
