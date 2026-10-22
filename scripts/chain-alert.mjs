/* ═══════════════════════════════════════════════════════════════════════════
   الإصدارُ وقف — node scripts/chain-alert.mjs "<المرحلة>" "<السبب>" [ملفُّ التفصيل]
   ───────────────────────────────────────────────────────────────────────────
   (V38.82) سلسلةُ النشر صارت على خادم المستودع تكمل وحدَها — فلم يبقَ من يراها
   حين تقف. والمالكُ اختار أن يُبلَّغ عند الوقوف وحدَه، لا مع كلِّ إصدار.
   فهذا يقول له، مرةً، أين وقف الإصدارُ ولماذا وماذا بلغ الإنتاج:
     ١ بلاغٌ في المستودع يذكره باسمه (@المالك) — جيت هب يرسله إلى بريد حسابه
       بلا أيِّ إعداد.
     ٢ والرسالةُ نفسُها بالبريد متى ضُبطت أسرارُ البريد (mail-send.mjs).
   لا يُفشِل السيرَ لو تعذّر الإبلاغ: يكتب تحذيرًا ويمضي.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';

const stage = process.argv[2] || 'سلسلة النشر';
const why = process.argv[3] || '';
const file = process.argv[4] || '';
const repo = process.env.GITHUB_REPOSITORY || 'mhmdsfwt371/Project-survey';
const runUrl = (process.env.GITHUB_SERVER_URL || 'https://github.com') + '/' + repo + '/actions/runs/' + (process.env.GITHUB_RUN_ID || '');
const sha = process.env.CHAIN_SHA || process.env.GITHUB_SHA || '';
const live = process.env.CHAIN_LIVE === '1';
const owner = process.env.CHAIN_OWNER || repo.split('/')[0];

let subject = '';
try { subject = execFileSync('git', ['log', '-1', '--format=%s', sha || 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
const ver = (subject.match(/^V\d+\.\d+/) || [''])[0];
const details = file && existsSync(file) ? readFileSync(file, 'utf8').trim().slice(0, 6000) : '';

export function alertText(o){
  const title = 'الإصدار ' + (o.ver || String(o.sha || '').slice(0, 8) || '—') + ' وقف عند: ' + o.stage;
  const lines = [
    '@' + o.owner,
    '',
    '**' + title + '**',
    o.why ? 'السبب: ' + o.why : '',
    o.sha ? 'الالتزام: ' + String(o.sha).slice(0, 8) + (o.subject ? ' — ' + o.subject : '') : '',
    o.live ? '**النسخةُ نُشرت على الإنتاج، لكن فحصَ ما بعد النشر سقط — راجعها الآن.**'
           : '**الإنتاجُ على حاله: لم يصله شيءٌ من هذا الإصدار.**',
    o.details ? '```\n' + o.details + '\n```' : '',
    'التفصيل: ' + o.runUrl,
    'ما العمل: أرسل لكلود «الإصدار وقف» مع هذه الرسالة.'
  ];
  return { title, body: lines.filter(Boolean).join('\n') };
}

if (process.argv[1] && process.argv[1].endsWith('chain-alert.mjs')){
  const m = alertText({ ver, sha, stage, why, subject, details, owner, live, runUrl });
  /* ١ — the issue that names the owner: GitHub mails it to his account */
  const tok = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (tok){
    try {
      const r = await fetch('https://api.github.com/repos/' + repo + '/issues', { method: 'POST',
        headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: m.title, body: m.body }) });
      console.log(r.ok ? '✓ بلاغٌ للمالك: ' + m.title : '::warning::تعذّر فتحُ البلاغ (' + r.status + ')');
    } catch (e){ console.log('::warning::تعذّر فتحُ البلاغ: ' + e.message); }
  } else console.log('::warning::لا مفتاحَ لفتح البلاغ');
  /* ٢ — the same message by mail, when the mailbox secrets are set */
  writeFileSync('/tmp/chain-stop.txt', m.body.replace(/\*\*/g, '').replace(/```\n?/g, ''));
  try { execFileSync('node', ['scripts/mail-send.mjs', 'نُسُك — ' + m.title, '/tmp/chain-stop.txt'], { stdio: 'inherit' }); } catch {}
  console.log('::error title=الإصدار وقف::' + m.title + (why ? ' — ' + why : ''));
}
