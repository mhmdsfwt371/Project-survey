/* ═══════════════════════════════════════════════════════════════════════════
   تقريرُ النظام — node scripts/report-system.mjs
   ───────────────────────────────────────────────────────────────────────────
   سؤالٌ يتكرّر: كم سطرًا صار النظام؟ وبأيِّ تقنية؟ وفي كم من الوقت؟ ومن
   يستعمله وكم؟ والإجابةُ كانت تُجمَع بالعدِّ اليدويِّ في كلِّ مرة — فتتأخّر
   وتختلف. فصار التقريرُ يُولَّد من المصدر نفسِه: الشيفرةُ تُعَدُّ من المستودع،
   والمدّةُ من تواريخ الدفعات، والاستعمالُ من سجلِّ الحضور والأحداث في القاعدة
   — كلَّ ثلاثة أيام، ويُنشَر بلاغًا في المستودع يُقرأ من الهاتف (V17.9).
   يعمل بلا مفتاح القاعدة: يكتب قسمَ الشيفرة ويقول إن الاستعمال غيرُ متاح.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const AR = n => new Intl.NumberFormat('ar-EG').format(Math.round(n || 0));
const sh = c => { try { return execSync(c, { encoding:'utf8' }).trim(); } catch { return ''; } };
const lines = p => { try { return readFileSync(p, 'utf8').split('\n').length; } catch { return 0; } };

/* ═══ ١ · الشيفرة ═══ */
const html = readFileSync('index.html', 'utf8');
const js = (/<script[^>]*>([\s\S]*?)<\/script>/.exec(html) || ['', ''])[1];
const css = (/<style>([\s\S]*?)<\/style>/.exec(html) || ['', ''])[1];
const scripts = readdirSync('scripts').filter(f => f.endsWith('.mjs'));
const audits = scripts.filter(f => f.startsWith('audit-'));
const flows = existsSync('.github/workflows') ? readdirSync('.github/workflows').filter(f => f.endsWith('.yml')) : [];
const docs = readdirSync('docs').filter(f => /\.(md|json)$/.test(f));
const manuals = existsSync('docs/manuals') ? readdirSync('docs/manuals').filter(f => f.endsWith('.docx')).length : 0;

const code = {
  appLines: html.split('\n').length,
  jsLines: js.split('\n').length,
  cssLines: css.split('\n').length,
  kb: Math.round(statSync('index.html').size / 1024),
  fns: (js.match(/\bfunction\s+\w+\s*\(/g) || []).length,
  pages: (html.match(/PAGE\.\w+\s*=/g) || []).length,
  i18n: ((js.slice(js.indexOf('\nen:{'), js.indexOf('\nur:{'))).match(/':'/g) || []).length,
  scriptLines: scripts.reduce((a, f) => a + lines('scripts/' + f), 0),
  scripts: scripts.length, audits: audits.length,
  flowLines: flows.reduce((a, f) => a + lines('.github/workflows/' + f), 0), flows: flows.length,
  rules: lines('firestore.rules'),
  docLines: docs.reduce((a, f) => a + lines('docs/' + f), 0), docs: docs.length, manuals,
  sw: lines('sw.js')
};
code.total = code.appLines + code.scriptLines + code.flowLines + code.rules + code.sw;

/* ═══ ٢ · المدّة ═══ */
/* التاريخُ الناقصُ يكذب: النسخةُ المسحوبةُ في السحابة ضحلةٌ افتراضيًّا (دفعةٌ
   واحدة)، فتُقرأ «بدأ اليوم» لمشروعِ شهور. فيُعلَن النقصُ ولا يُخمَّن. */
const shallow = sh('git rev-parse --is-shallow-repository') === 'true';
const first = sh("git log --reverse --format=%cI | head -1");
const last  = sh("git log -1 --format=%cI");
const days  = first ? Math.max(1, Math.round((Date.parse(last) - Date.parse(first)) / 86400000) + 1) : 0;
const commits = +sh('git rev-list --count HEAD') || 0;
const versions = (readFileSync('docs/system.md', 'utf8').match(/\| \*\*V\d+\.\d+\*\* \|/g) || []).length;
/* أيامُ العمل الفعليّة: كم يومًا مختلفًا فيه دفعة */
const workDays = new Set(sh('git log --format=%cd --date=short').split('\n').filter(Boolean)).size;

/* ═══ ٣ · الاستعمال — من القاعدة إن توفّر المفتاح ═══ */
let use = null;
const SA = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (SA){
  try {
    const admin = (await import('firebase-admin')).default;
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
    const db = admin.firestore();
    const [users, pres, evs] = await Promise.all([
      db.collection('users').limit(500).get(),
      db.collection('presence').limit(500).get(),
      db.collection('events').orderBy('ts', 'desc').limit(3000).get()
    ]);
    const now = Date.now(), DAY = 86400000;
    const U = users.docs.map(d => d.data()).filter(u => u && u.active !== false);
    const P = pres.docs.map(d => d.data());
    const E = evs.docs.map(d => d.data());
    const byDay = {}, byUser = {}, devs = new Set();
    let firstTs = now;
    E.forEach(e => {
      const ts = +e.ts || 0; if (!ts) return;
      if (ts < firstTs) firstTs = ts;
      byDay[new Date(ts).toISOString().slice(0, 10)] = (byDay[new Date(ts).toISOString().slice(0, 10)] || 0) + 1;
      if (e.by) byUser[e.by] = (byUser[e.by] || 0) + 1;
      if (e.dev) devs.add(e.dev);
    });
    const dayKeys = Object.keys(byDay).sort();
    use = {
      accounts: U.length,
      roles: U.reduce((m, u) => { const r = u.role || '—'; m[r] = (m[r] || 0) + 1; return m; }, {}),
      seen7: P.filter(p => now - (+p.at || 0) < 7 * DAY).length,
      seen1: P.filter(p => now - (+p.at || 0) < DAY).length,
      devices: devs.size || P.length,
      reads: P.reduce((a, p) => a + (+p.reads || 0), 0),
      vers: [...new Set(P.map(p => p.ver).filter(Boolean))].sort(),
      events: E.length,
      evDays: dayKeys.length,
      evPerDay: dayKeys.length ? Math.round(E.length / dayKeys.length) : 0,
      busiest: dayKeys.map(k => [k, byDay[k]]).sort((a, b) => b[1] - a[1])[0] || null,
      top: Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 6),
      firstUse: new Date(firstTs).toISOString().slice(0, 10),
      counts: {}
    };
    for (const c of ['recs', 'inss', 'photos', 'tasks', 'steps', 'bugs']){
      try { use.counts[c] = (await db.collection(c).count().get()).data().count; } catch { /* بلا count: يُترَك */ }
    }
  } catch (e){ use = { err: String(e.message || e).slice(0, 160) }; }
}

/* ═══ ٤ · النصّ ═══ */
const L = [];
L.push(`# تقريرُ النظام — ${new Date().toISOString().slice(0, 10)}`);
L.push('');
L.push('## الشيفرة');
L.push('| البند | العدد |', '|---|---|');
L.push(`| إجماليُّ الأسطر | **${AR(code.total)}** |`);
L.push(`| التطبيق (ملفٌّ واحد) | ${AR(code.appLines)} سطرًا · ${AR(code.kb)} ك.ب |`);
L.push(`| منها منطقٌ | ${AR(code.jsLines)} · أنماطٌ ${AR(code.cssLines)} |`);
L.push(`| دوالُّ التطبيق | ${AR(code.fns)} |`);
L.push(`| الشاشات | ${AR(code.pages)} |`);
L.push(`| مفاتيحُ الترجمة لكلِّ لغة | ${AR(code.i18n)} (عربي · إنجليزي · أردو) |`);
L.push(`| سكربتات الخادم والحرّاس | ${AR(code.scripts)} ملفًا · ${AR(code.scriptLines)} سطرًا |`);
L.push(`| منها جرودٌ تمنع الانحدار | **${AR(code.audits)}** |`);
L.push(`| سيرُ العمل الآليّ | ${AR(code.flows)} · ${AR(code.flowLines)} سطرًا |`);
L.push(`| قواعدُ الحماية | ${AR(code.rules)} سطرًا |`);
L.push(`| عاملُ الخدمة (العملُ بلا شبكة) | ${AR(code.sw)} سطرًا |`);
L.push(`| التوثيق | ${AR(code.docs)} ملفًا · ${AR(code.docLines)} سطرًا + ${AR(code.manuals)} دليلَ دور |`);
L.push('');
L.push('## التقنية');
L.push('- **الواجهة**: HTML وCSS وجافاسكربت خالصة في ملفٍّ واحد — بلا إطارٍ ولا بناء، فتُفتَح من أيِّ متصفّح وتعمل بلا تثبيت.');
L.push('- **تطبيقٌ يعمل بلا شبكة (PWA)**: عاملُ خدمةٍ يخبّئ الشاشاتِ، وطابورٌ يحفظ ما لم يُرفَع حتى تعود الشبكة — والمشاعرُ بلا تغطيةٍ أحيانًا.');
L.push('- **القاعدة**: Google Firestore — مزامنةٌ فارقيةٌ ومستمعون محدودون، وقواعدُ حمايةٍ لكلِّ مجموعةٍ تُختبَر في محاكٍ رسميّ.');
L.push('- **الخرائط**: Leaflet للمسطّح وMapLibre للعرض الثلاثيِّ بتضاريس المشاعر.');
L.push('- **الاستضافة والتشغيل الآليّ**: GitHub Pages للنشر، وGitHub Actions للنسخ الاحتياطيِّ ورفع الصور إلى Drive وإنشاء الحسابات وجسر البلاغات.');
L.push('- **الاختبار**: كروميوم حقيقيٌّ بمقاس هاتف + محاكي قواعد Firestore + جرودٌ سلوكيةٌ تفتح كلَّ شاشةٍ لكلِّ دور.');
L.push('');
L.push('## الوقت');
L.push(`- **${AR(versions)}** نسخةً مسجَّلةً في سجلِّ النظام — كلُّ واحدةٍ تغييرٌ موثَّقٌ بسببه.`);
if (shallow){
  L.push(`- التاريخُ المسحوبُ ناقصٌ في هذه الجرية، فلا يُحسَب عمرُ المشروع منه.`);
  L.push(`- في المتاح: ${AR(commits)} دفعةً، آخرُها **${(last || '').slice(0, 10)}**.`);
} else {
  L.push(`- بدأ **${(first || '').slice(0, 10)}** وآخرُ تحديثٍ **${(last || '').slice(0, 10)}** — **${AR(days)}** يومًا.`);
  L.push(`- ${AR(commits)} دفعةً في ${AR(workDays)} يومَ عملٍ فعليّ.`);
  L.push(`- بمعدّل ${AR(code.total / Math.max(days, 1))} سطرٍ في اليوم و${(commits / Math.max(workDays, 1)).toFixed(1)} دفعةٍ في يوم العمل.`);
}
L.push('');
L.push('## الاستعمال');
if (!use) L.push('_غيرُ متاحٍ: يُشغَّل هذا التقريرُ بمفتاح القاعدة ليقرأ الحضورَ والأحداث._');
else if (use.err) L.push('_تعذّرت قراءةُ القاعدة: ' + use.err + '_');
else {
  L.push(`- **${AR(use.accounts)}** حسابًا فعّالًا: ` + Object.entries(use.roles).map(([r, n]) => `${r} ${AR(n)}`).join(' · '));
  L.push(`- **${AR(use.seen7)}** استعملوه خلال سبعة أيام، و${AR(use.seen1)} خلال اليوم الأخير، على ${AR(use.devices)} جهازًا.`);
  L.push(`- أوّلُ استعمالٍ مسجَّلٍ **${use.firstUse}**، و${AR(use.events)} حدثًا في ${AR(use.evDays)} يومًا — بمعدّل **${AR(use.evPerDay)}** حدثًا يوميًّا.`);
  if (use.busiest) L.push(`- أكثرُ يومٍ عملًا: **${use.busiest[0]}** بـ${AR(use.busiest[1])} حدثًا.`);
  if (use.top.length) L.push('- الأكثرُ استعمالًا: ' + use.top.map(([n, c]) => `${n} (${AR(c)})`).join(' · '));
  if (use.vers.length) L.push(`- النسخُ العاملةُ على الأجهزة: ${use.vers.join(' · ')}`);
  L.push(`- قراءاتُ القاعدة المسجَّلةُ على الأجهزة: ${AR(use.reads)}`);
  const c = use.counts;
  if (Object.keys(c).length) L.push('- في القاعدة: ' + Object.entries(c).map(([k, n]) => `${k} ${AR(n)}`).join(' · '));
}
L.push('');
L.push('---');
L.push('_يُولَّد كلَّ ثلاثة أيامٍ من المستودع والقاعدة — لا يُكتَب بيد._');

const text = L.join('\n');
console.log(text);

/* ═══ ٥ · النشرُ بلاغًا يُقرأ من الهاتف ═══ */
const TOKEN = process.env.GITHUB_TOKEN || '', REPO = process.env.GITHUB_REPOSITORY || '';
/* نصُّ التقرير يُكتَب حيث يُقرأ (V17.65): البلاغُ مكانُه، والبريدُ نسخةٌ منه */
if (process.env.REPORT_OUT){
  try { writeFileSync(process.env.REPORT_OUT, title + '\n\n' + text); }
  catch (e){ console.log('::warning::تعذّر كتابةُ نصِّ التقرير: ' + String(e.message).slice(0, 120)); }
}
if (TOKEN && REPO && process.env.PUBLISH === '1'){
  const title = `تقريرُ النظام — ${new Date().toISOString().slice(0, 10)}`;
  const r = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method:'POST',
    headers:{ Authorization:'Bearer ' + TOKEN, Accept:'application/vnd.github+json', 'Content-Type':'application/json' },
    body: JSON.stringify({ title, body: text, labels:['تقرير'] })
  });
  console.log(r.ok ? `\n::notice title=تقرير::نُشر التقريرُ بلاغًا في المستودع` : '\nتعذّر النشر: ' + r.status);
}
