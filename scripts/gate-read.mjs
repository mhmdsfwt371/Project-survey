/* ═══════════════════════════════════════════════════════════════════════════
   Read the gate's verdict with git alone — node scripts/gate-read.mjs [sha]
   ───────────────────────────────────────────────────────────────────────────
   (V47.2) The reader of scripts/gate-ledger.mjs. No GitHub API: it fetches the branch `gate-log` and prints the
   latest verdicts, then the entries of one commit (default: HEAD). Authentication is whatever git already uses;
   GH_BASIC (the base64 «x-access-token:…» pair) adds the header for sessions that push that way.
   Exit code: 0 green and on main · 3 green, not on main yet · 2 red · 4 no entry yet (the gate is still running).
   ═════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'child_process';
const auth = process.env.GH_BASIC ? ['-c', 'http.extraHeader=Authorization: Basic ' + process.env.GH_BASIC] : [];
const git = (...a) => execFileSync('git', a, { encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'] }).trim();
const sha = git('rev-parse', process.argv[2] || 'HEAD');
try { git(...auth, 'fetch', '-q', 'origin', '+gate-log:refs/remotes/origin/gate-log'); }
catch (e){ console.log('لا دفترَ للبوابة بعد (الفرع gate-log غير موجود) — البوابةُ لم تُكمل أوّلَ تشغيلٍ لها'); process.exit(4); }
const show = f => { try { return git('show', 'origin/gate-log:' + f); } catch (e){ return ''; } };
console.log('── آخر الأحكام\n' + show('latest.txt').split('\n').slice(0, 8).join('\n') + '\n');
const push = show(sha.slice(0, 12) + '.push.txt'), full = show(sha.slice(0, 12) + '.workflow_dispatch.txt');
if (!push && !full){ console.log('لا حكمَ بعد على ' + sha.slice(0, 8) + ' — البوابةُ ما زالت تعمل'); process.exit(4); }
if (push) console.log('── بوابةُ الدفع\n' + push);
if (full) console.log('── القائمةُ الكاملة والترقية\n' + full);
const all = push + '\n' + full;
if (/^verdict:\s+RED/m.test(all)) process.exit(2);
process.exit(/^on main:\s+yes/m.test(all) ? 0 : 3);
