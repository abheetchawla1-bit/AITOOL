# Humanize Checker

Paste text or a Google Doc link, score it with ZeroGPT, and rewrite only the flagged sentences with Claude in a loop until it is under the target %.

## Deploy on Vercel
1. Push this folder to a GitHub repo (or run `npx vercel` inside it).
2. In Vercel, import the repo. Framework: Next.js (auto-detected).
3. Settings > Environment Variables, add: ZEROGPT_API_KEY, ANTHROPIC_API_KEY, TOOL_PASSWORD (optional ANTHROPIC_MODEL).
4. Deploy. Open the URL and enter TOOL_PASSWORD in the box.

## Notes
- Rewrites keep @identifiers, numbers and "Rs." intact; a rewrite that breaks any of them is discarded.
- Tables (tab-separated rows) are only touched if ZeroGPT flags them.
- Locality dropdown reads lib/localities.json (from the tracker); upload a newer tracker CSV in the page to replace it. Results CSV records ZeroGPT % before and after per locality.
- Doc links must be shared as "Anyone with the link" (already done for the locality docs).
- Function timeout is 60s per call; the loop runs one round per call so long pages are fine.
- If ZeroGPT changes its API shape, edit lib/zerogpt.js only.
