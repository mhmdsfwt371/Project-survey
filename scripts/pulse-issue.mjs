/* ═══════════════════════════════════════════════════════════════════════════
   لوحةُ النبض — node scripts/pulse-issue.mjs <ملف النص>
   ───────────────────────────────────────────────────────────────────────────
   البريدُ يحتاج أسرارًا تُضبَط، والنبضُ يجب أن يصل قبلها. فيُكتَب في المستودع
   بلاغًا واحدًا يحمل وسمَ «نبض» ويُحدَّث جسمُه كلَّ صباح — لا بلاغٌ جديدٌ كلَّ
   يومٍ يزاحم بلاغاتِ الميدان في القائمة، ولا تعليقٌ يُشعِر بلا داع. من فتح
   المستودعَ وجد آخرَ نبضةٍ في مكانها، ومن لم يفتح لا يُزعَج.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';

const TOKEN = process.env.GITHUB_TOKEN, REPO = process.env.GITHUB_REPOSITORY;
if (!TOKEN || !REPO){ console.log('::notice::لا مفتاحَ للمستودع — لا لوحةَ نبض'); process.exit(0); }

const file = process.argv[2];
let body = '';
try { body = readFileSync(file, 'utf8'); } catch { console.log('::notice::لا نصَّ للنبض'); process.exit(0); }
if (!body.trim()){ console.log('::notice::نبضٌ فارغ'); process.exit(0); }

const TITLE = 'نبضُ نُسُك — ما ينتظر قرارًا';
const LABEL = 'نبض';
const api = (path, init) => fetch('https://api.github.com/repos/' + REPO + path, {
  ...init,
  headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json',
             'Content-Type': 'application/json', ...(init && init.headers) }
});

const foot = '\n\n---\n_يُحدَّث آليًّا كلَّ صباح (`pulse.yml`) — لا يُغلَق ولا يُعلَّق عليه._';
const text = body.trim() + foot;

try {
  const r = await api('/issues?state=open&labels=' + encodeURIComponent(LABEL) + '&per_page=5');
  const list = r.ok ? await r.json() : [];
  const found = Array.isArray(list) ? list.find(i => !i.pull_request) : null;
  if (found){
    const u = await api('/issues/' + found.number, { method:'PATCH', body: JSON.stringify({ title: TITLE, body: text }) });
    console.log(u.ok ? '✓ حُدِّثت لوحةُ النبض #' + found.number : '::warning::تعذّر تحديثُ اللوحة: ' + u.status);
  } else {
    const c = await api('/issues', { method:'POST', body: JSON.stringify({ title: TITLE, body: text, labels:[LABEL] }) });
    const j = c.ok ? await c.json() : null;
    console.log(c.ok ? '✓ فُتحت لوحةُ النبض #' + j.number : '::warning::تعذّر فتحُ اللوحة: ' + c.status);
  }
} catch (e){
  /* لا يُفشَل السير: النبضُ مكتوبٌ في ملخّص السير وفي البريد إن ضُبط */
  console.log('::warning title=لوحةُ النبض::' + String(e.message).slice(0, 160));
}
process.exit(0);
