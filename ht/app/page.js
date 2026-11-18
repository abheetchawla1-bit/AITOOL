'use client';
import { useState } from 'react';
import LOCS from '../lib/localities.json';

export default function Home() {
  const [pw, setPw] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState(15);
  const [rounds, setRounds] = useState(4);
  const [res, setRes] = useState(null);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [locs, setLocs] = useState(LOCS);
  const [sel, setSel] = useState(null);
  const [results, setResults] = useState({});
  const add = m => setLog(l => [...l, m]);

  async function call(path, body) {
    const r = await fetch('/api/' + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-tool-password': pw }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Request failed');
    return j;
  }
  const run = fn => async () => { setBusy(true); try { await fn(); } catch (e) { add('Error: ' + e.message); } setBusy(false); };

  function pick(id) {
    const l = locs.find(x => x.id === id); setSel(l || null);
    if (l) { setUrl(l.doc); setRes(null); setLog([]); }
  }
  function uploadCsv(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      const rows = t.trim().split(/\r?\n/).map(r => r.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')));
      const h = rows[0]; const ix = n => h.indexOf(n);
      setLocs(rows.slice(1).filter(r => r[ix('Doc link')]).map(r => ({ id: r[ix('ID')], locality: r[ix('Locality')], doc: r[ix('Doc link')], live: r[ix('Live URL')], notes: r[ix('Notes')] || '' })));
      add('Loaded sheet CSV');
    });
  }
  function downloadResults() {
    const rows = [['ID', 'Locality', 'ZeroGPT % before', 'ZeroGPT % after']].concat(Object.entries(results).map(([id, v]) => [id, v.name, v.before, v.after]));
    const blob = new Blob([rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'zerogpt_results.csv'; a.click();
  }
  const record = (k, v) => sel && setResults(r => ({ ...r, [sel.id]: { ...(r[sel.id] || { name: sel.locality }), [k]: v } }));

  const load = run(async () => { const j = await call('fetchdoc', { url }); setText(j.text); add('Loaded doc, ' + j.text.split(/\s+/).length + ' words'); });
  const check = run(async () => { const j = await call('check', { text }); setRes(j); record('before', j.percent); add(`Checked: ${j.percent}% AI, ${j.flagged.length} flagged sentences`); });
  const humanize = run(async () => {
    let cur = text, r = await call('check', { text: cur });
    add(`Start: ${r.percent}% AI`); record('before', r.percent);
    for (let i = 1; i <= rounds && r.percent > target; i++) {
      const h = await call('humanize', { text: cur, flagged: r.flagged });
      if (!h.changed) { add('No more safe rewrites available, stopping'); break; }
      cur = h.text; setText(cur);
      r = await call('check', { text: cur });
      setRes(r); add(`Round ${i}: rewrote ${h.changed}/${h.attempted} lines, now ${r.percent}% AI`);
    }
    record('after', r.percent);
    add(r.percent <= target ? `Done: ${r.percent}% is under ${target}%` : `Stopped at ${r.percent}%. Edit flagged lines by hand or run again`);
  });

  const cls = res ? (res.percent <= 15 ? 'good' : res.percent <= 40 ? 'mid' : 'bad') : '';
  function highlighted() {
    let parts = [text];
    (res?.flagged || []).forEach(f => {
      parts = parts.flatMap(p => typeof p !== 'string' ? [p] : p.split(f).flatMap((s, i, a) => i < a.length - 1 ? [s, <mark key={f + i + s.length}>{f}</mark>] : [s]));
    });
    return parts;
  }

  return (
    <main>
      <h1>Humanize Checker</h1>
      <p className="sub">Check a locality page with ZeroGPT, then rewrite only the flagged sentences until it passes.</p>
      <div className="card">
        <div className="row">
          <select value={sel?.id || ''} onChange={e => pick(e.target.value)} style={{ padding: 8, borderRadius: 8, minWidth: 260 }}>
            <option value="">Pick a locality from the sheet...</option>
            {locs.map(l => <option key={l.id} value={l.id}>{l.id} {l.locality}</option>)}
          </select>
          <label className="sec" style={{ fontSize: 13 }}>Replace sheet (CSV) <input type="file" accept=".csv" onChange={uploadCsv} /></label>
          <button className="sec" disabled={!Object.keys(results).length} onClick={downloadResults}>Download results CSV</button>
        </div>
        {sel?.notes && <div className="row" style={{ background: '#fef3c7', padding: 8, borderRadius: 8, fontSize: 13 }}>Note: {sel.notes}</div>}
        <div className="row">
          <input type="password" placeholder="Tool password" value={pw} onChange={e => setPw(e.target.value)} />
          <input type="text" style={{ flex: 1, minWidth: 240 }} placeholder="Google Doc link (anyone with link)" value={url} onChange={e => setUrl(e.target.value)} />
          <button className="sec" disabled={busy || !url} onClick={load}>Load doc</button>
        </div>
        <textarea placeholder="Or paste text here" value={text} onChange={e => setText(e.target.value)} />
        <div className="row">
          <button disabled={busy || !text} onClick={check}>Check with ZeroGPT</button>
          <button disabled={busy || !text} onClick={humanize}>Check and humanize</button>
          <label>Target % <input type="number" style={{ width: 70 }} value={target} onChange={e => setTarget(+e.target.value)} /></label>
          <label>Max rounds <input type="number" style={{ width: 60 }} value={rounds} onChange={e => setRounds(+e.target.value)} /></label>
          {busy && <span>Working...</span>}
        </div>
      </div>
      {res && <div className="card">
        <div className={'score ' + cls}>{res.percent}% AI</div>
        <div className="out">{highlighted()}</div>
        <div className="row"><button className="sec" onClick={() => navigator.clipboard.writeText(text)}>Copy text</button></div>
      </div>}
      {log.length > 0 && <div className="card log">{log.map((l, i) => <div key={i}>{l}</div>)}</div>}
    </main>
  );
}
