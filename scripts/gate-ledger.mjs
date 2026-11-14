/* ═══════════════════════════════════════════════════════════════════════════
   The gate's ledger — node scripts/gate-ledger.mjs   (runs inside the cloud gate, last job)
   ───────────────────────────────────────────────────────────────────────────
   (V47.2) The gate's verdict lived only in GitHub's API (commit status, commit comments, run logs). A working
   session that can push with git but cannot reach that API pushed V47.2 and then could not tell whether the
   gate was green, what fell, or why the release had not reached main — the owner had to be asked for a
   screenshot. The verdict now also lands in the repository itself, on the orphan branch `gate-log`:
   one text file per commit and event, plus `latest.txt`. Anything that can `git fetch` can read it
   (scripts/gate-read.mjs). The branch carries no code and triggers no workflow.
   Never fails the run: a ledger that cannot be written is a warning, not a red gate.
   ═════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const GATES = ['fast', 'browser', 'rules', 'multi', 'shard-1', 'shard-2', 'shard-3', 'shard-4', 'shard-5', 'shard-6'];
/* the entry is plain text on purpose: it is read by people and by `git show`, not parsed by a client */
export function entry(o){
  const jobs = Object.keys(o.needs || {}).map(k => k + '=' + ((o.needs[k] || {}).result || '?')).join(' · ');
  const seen = GATES.filter(g => g in o.gates);
  const bad = seen.filter(g => o.gates[g].split('\n')[0].trim() !== 'PASS');
  const missing = GATES.filter(g => !(g in o.gates) && (o.event === 'push' || /^shard/.test(g)));
  const failedJobs = Object.keys(o.needs || {}).filter(k => /failure|cancelled/.test((o.needs[k] || {}).result || ''));
  const verdict = failedJobs.some(k => (o.needs[k] || {}).result === 'cancelled') && !bad.length ? 'CANCELLED'
    : (bad.length || missing.length || failedJobs.length) ? 'RED' : 'GREEN';
  const L = [
    'verdict:  ' + verdict,
    'commit:   ' + o.sha,
    'version:  ' + (o.version || '?'),
    'title:    ' + (o.title || ''),
    'event:    ' + o.event + (o.event === 'push' ? '  (the push gate: fast layer + real browser + rules + full list)' : '  (the full list, then promotion to main)'),
    'on main:  ' + (o.onMain ? 'yes — promoted' : 'no'),
    'when:     ' + o.when,
    'run:      ' + (o.run || ''),
    'jobs:     ' + jobs,
    'passed:   ' + seen.filter(g => !bad.includes(g)).join(' ') ,
    'fell:     ' + (bad.join(' ') || '—'),
    'missing:  ' + (missing.join(' ') || '—')
  ];
  bad.forEach(g => { L.push('', '── ' + g, o.gates[g].split('\n').slice(1, 40).join('\n').trim() || '(no detail was written)'); });
  return { verdict, text: L.join('\n') + '\n' };
}

if (process.argv[1] && process.argv[1].endsWith('gate-ledger.mjs')){
  try {
    const sh = (c, a, opt) => execFileSync(c, a, { encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'], ...opt }).trim();
    const sha = process.env.GITHUB_SHA || sh('git', ['rev-parse', 'HEAD']);
    const repo = process.env.GITHUB_REPOSITORY, tok = process.env.GH_TOKEN, event = process.env.GITHUB_EVENT_NAME || 'push';
    const gates = {};
    if (existsSync('gates')) readdirSync('gates').filter(f => f.endsWith('.txt')).forEach(f => { gates[f.replace(/\.txt$/, '')] = readFileSync(join('gates', f), 'utf8'); });
    let needs = {}; try { needs = JSON.parse(process.env.NEEDS || '{}'); } catch (e){ /* an unreadable job map leaves the gates to speak */ }
    let onMain = false; try { sh('git', ['fetch', '-q', '--depth', '50', 'origin', 'main']); sh('git', ['merge-base', '--is-ancestor', sha, 'FETCH_HEAD']); onMain = true; } catch (e){ onMain = false; }
    let version = ''; try { version = (readFileSync('sw.js', 'utf8').match(/nusuk-survey-v([0-9.]+)/) || [])[1] || ''; } catch (e){ version = ''; }
    let title = ''; try { title = sh('git', ['log', '-1', '--format=%s', sha]); } catch (e){ title = ''; }
    const when = new Date().toISOString();
    /* a job can fall outside every gate (checkout, a token, the promotion itself): name its failed steps and what the runner said */
    let steps = '';
    try {
      const jobs = JSON.parse(sh('gh', ['api', `repos/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}/jobs?per_page=100`])).jobs || [];
      jobs.filter(j => j.conclusion === 'failure').forEach(j => {
        steps += '\n── job «' + j.name + '» failed at: ' + ((j.steps || []).filter(x => x.conclusion === 'failure').map(x => x.name).join(' | ') || '(before its first step)') + '\n';
        try {
          const ann = JSON.parse(sh('gh', ['api', `repos/${repo}/check-runs/${j.id}/annotations?per_page=30`]));
          ann.filter(x => x.annotation_level === 'failure').slice(0, 8).forEach(x => { steps += '   ' + String(x.message || '').replace(/\s+/g, ' ').slice(0, 400) + '\n'; });
        } catch (x){ /* annotations are a bonus: the step name alone already says where */ }
      });
    } catch (x){ steps = ''; }
    const e = entry({ sha, event, gates, needs, onMain, version: version && 'V' + version, title, when,
      run: process.env.GITHUB_SERVER_URL && repo ? `${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : '' });
    if (steps){ e.text += steps; if (e.verdict === 'GREEN') e.verdict = 'RED'; }
    console.log(e.text);
    if (!repo || !tok){ console.log('::warning::gate ledger: no repository or token — printed only'); process.exit(0); }
    const dir = join(tmpdir(), 'gate-log-' + Date.now()); mkdirSync(dir, { recursive:true });
    const g = (...a) => sh('git', a, { cwd:dir });
    const url = `https://x-access-token:${tok}@github.com/${repo}.git`;
    g('init', '-q'); g('config', 'user.name', 'nusuk-gate'); g('config', 'user.email', 'bot@nusuk');
    for (let i = 1; i <= 4; i++){
      let had = true; try { g('fetch', '-q', '--depth', '1', url, 'gate-log'); g('checkout', '-q', '-B', 'gate-log', 'FETCH_HEAD'); } catch (x){ had = false; }
      if (!had){ try { g('checkout', '-q', '--orphan', 'gate-log'); } catch (x){ /* already on it from the last round */ } }
      writeFileSync(join(dir, `${sha.slice(0, 12)}.${event}.txt`), e.text);
      const line = `${when}  ${e.verdict.padEnd(9)}  ${sha.slice(0, 8)}  ${String(version && 'V' + version).padEnd(7)}  ${event.padEnd(17)}  ${onMain ? 'on-main' : 'not-on-main'}`;
      const old = existsSync(join(dir, 'latest.txt')) ? readFileSync(join(dir, 'latest.txt'), 'utf8').split('\n').filter(Boolean) : [];
      writeFileSync(join(dir, 'latest.txt'), [line].concat(old.filter(l => l !== line)).slice(0, 80).join('\n') + '\n');
      g('add', '-A'); g('commit', '-q', '-m', `gate: ${e.verdict} ${sha.slice(0, 8)} (${event})`);
      try { g('push', '-q', url, 'HEAD:gate-log'); console.log('✓ gate ledger written — branch gate-log'); break; }
      catch (x){ if (i === 4) console.log('::warning::gate ledger: push refused four times'); }
    }
  } catch (e){ console.log('::warning::gate ledger not written — ' + String(e && e.message || e).replace(/x-access-token:[^@]+@/g, '').slice(0, 200)); }
  process.exit(0);
}
