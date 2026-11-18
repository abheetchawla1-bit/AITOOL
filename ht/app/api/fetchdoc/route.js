import { authorized } from '../../../lib/auth';
export async function POST(req) {
  if (!authorized(req)) return Response.json({ error: 'Wrong password' }, { status: 401 });
  const { url } = await req.json();
  const m = String(url || '').match(/\/document\/d\/([\w-]+)/);
  if (!m) return Response.json({ error: 'Not a Google Doc link' }, { status: 400 });
  const r = await fetch(`https://docs.google.com/document/d/${m[1]}/export?format=txt`, { redirect: 'follow' });
  if (!r.ok || (r.headers.get('content-type') || '').includes('text/html'))
    return Response.json({ error: 'Cannot read the doc. Set sharing to "Anyone with the link".' }, { status: 400 });
  return Response.json({ text: (await r.text()).replace(/^﻿/, '') });
}
