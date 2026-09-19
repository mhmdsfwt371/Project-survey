/* ═══════════════════════════════════════════════════════════════════════════
   جردُ النبض — node scripts/audit-pulse.mjs
   ───────────────────────────────────────────────────────────────────────────
   النبضُ يُقرأ صباحًا ويُبنى عليه قرار: «زيارتان تنتظران منذ خمسة أيام» يعني
   فتحَ شاشةٍ ومكالمة. فإن عدَّ خطأً أو سكت عمّا ينتظر فقد النبضُ معناه، وإن نطق
   كلَّ يومٍ بلا سببٍ عُلِّم صاحبُه ألا يفتحه. فيُشغَّل هنا على بياناتٍ معلومةِ
   الجواب: الأعدادُ تُطابَق، والسكوتُ يُختبَر كما يُختبَر الكلام.
   ═════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); }
  else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };

const D = 864e5, now = Date.now();
const run = (db) => {
  const src = '/tmp/pulse-audit-src.json', out = '/tmp/pulse-audit-out.md';
  writeFileSync(src, JSON.stringify(db));
  const log = execFileSync('node', ['scripts/pulse.mjs'],
    { encoding:'utf8', env: { ...process.env, PULSE_SRC:src, PULSE_OUT:out, GITHUB_OUTPUT:'', GITHUB_STEP_SUMMARY:'' } });
  const text = readFileSync(out, 'utf8');
  const hand = +((/يحتاج يدًا:\s*(\d+)/.exec(log) || [])[1] || -1);
  try { unlinkSync(src); unlinkSync(out); } catch {}
  return { text, hand };
};

console.log('\n══ ١ · ما ينتظر يُعَدُّ ويُسمّى ══');
{
  const db = {
    recs: { a:{ review:'pending', at: now - 5 * D }, b:{ review:'pending', at: now - D },
            c:{ review:'revisit', at: now - 2 * D }, d:{ review:'approved', at: now - 9 * D } },
    tasks:{ t1:{ kind:'visit', status:'مطلوب', at: now - 7 * D }, t2:{ kind:'ins', status:'مطلوب', at: now - D },
            t3:{ kind:'visit', status:'معتمد', at: now - 20 * D }, t4:{ kind:'dis', status:'مطلوب', at: now - 6 * D } },
    newsites:{ n1:{ isNew:true, approved:false, at: now - 4 * D }, n2:{ isNew:true, approved:true, at: now - 3 * D } },
    bugs: { b1:{ status:'جديد', at: now - D }, b2:{ status:'مقبول', at: now - 3 * D } },
    steps:{ s1:{ kind:'visit', at: now - 2 * 36e5, by:'أحمد' }, s2:{ kind:'visit', at: now - 5 * 36e5, by:'سالم' },
            s3:{ kind:'ins', at: now - 9 * 36e5, by:'أحمد' }, s4:{ kind:'visit', at: now - 40 * 36e5, by:'خالد' } },
    points:{ ph:250, budCap:1e6, tgtSurvey:40, dueSurvey: now + 30 * D, dueInstall: now + 80 * D, insCamp:5, insCor:8, warranty:12, w:{ 'مخيم':1 } }
  };
  const { text, hand } = run(db);
  T(/زياراتٌ تنتظر الاعتمادَ التقني: \*\*٢\*\*/.test(text), 'الزياراتُ المنتظِرةُ تُعَدُّ كما هي: ٢');
  T(/منها \*\*١\*\* مضى عليها/.test(text) && /أقدمُها ٥ يومًا/.test(text), 'وما طال انتظارُه يُفرَز بعمره: ١ منذ ٥ أيام');
  T(/رُدَّت وتحتاج زيارةً أخرى: \*\*١\*\*/.test(text), 'والمردودةُ تُذكَر وحدَها');
  T(/مواقعُ جديدةٌ بانتظار الاعتماد: \*\*١\*\*/.test(text), 'والمعتمَدُ لا يُحسَب مع المنتظِر');
  T(/بلاغاتٌ لم تُقرأ: \*\*١\*\*/.test(text), 'والبلاغُ المقروءُ لا يُزعج');
  T(/زيارة: \*\*١\*\*/.test(text) && /فكّ: \*\*١\*\*/.test(text) && !/تركيب: \*\*١\*\* · فكّ/.test(text.split('ولم يتحرّك')[1] || ''),
    'والمهامُّ الراكدةُ فوق خمسةِ أيامٍ وحدَها — والمعتمَدةُ ليست راكدة');
  T(/أمسِ في الميدان[\s\S]*زيارة: \*\*٢\*\*[\s\S]*تركيب: \*\*١\*\*/.test(text), 'وخطواتُ أربعٍ وعشرين ساعةً وحدَها في «أمسِ في الميدان»');
  T(hand === 6, 'ومجموعُ ما يحتاج يدًا يُحسَب للبريد: ' + hand);
}

console.log('\n══ ١ب · جاهزيةُ الموسم تُذكَر وتُوقِظ مرةً في الأسبوع ══');
{
  const base = { recs:{}, tasks:{}, newsites:{}, bugs:{}, steps:{} };
  const points = { ph:0, budCap:0, tgtSurvey:40, dueSurvey: now + 30 * D, dueInstall: now + 80 * D,
                   insCamp:5, warranty:0, w:{ 'مخيم':1 } };
  const { text, hand } = run({ ...base, points });
  T(/جاهزيةُ الموسم — ٣ بندًا ينقص/.test(text), 'ما ينقص من الثوابت يُعَدُّ ويُسمّى: ٣');
  T(/سعرُ النقطة/.test(text) && /سقفُ الميزانية/.test(text) && /شهورُ الضمان/.test(text) && !/تارجتُ المسح/.test(text),
    'والمضبوطُ لا يُذكَر مع الناقص');
  const sat = new Date(now).getUTCDay() === 6;
  T(hand === (sat ? 1 : 0), 'ويوقظ البريدَ يومَ السبت وحدَه — اليومُ ' + (sat ? 'سبتٌ فأيقظ' : 'ليس سبتًا فسكت') + ': ' + hand);
  const full = run({ ...base, points: { ph:250, budCap:1e6, tgtSurvey:40, dueSurvey: now + 30 * D,
                     dueInstall: now + 80 * D, insCamp:5, insCor:8, warranty:12, w:{ 'مخيم':1 } } });
  T(!/جاهزيةُ الموسم/.test(full.text) && full.hand === 0, 'وإن ضُبط كلُّ شيءٍ لم يُذكَر البندُ أصلًا');
}

console.log('\n══ ٢ · السكوتُ حين لا شيءَ ينتظر ══');
{
  const db = {
    recs: { d:{ review:'approved', at: now - 9 * D }, e:{ review:'pending', at: now - 3600e3 } },
    tasks:{ t:{ kind:'ins', status:'مطلوب', at: now - 2 * D } },
    newsites:{ n:{ isNew:true, approved:true, at: now - 3 * D } },
    bugs: { b:{ status:'مقبول', at: now - D } },
    steps:{ s:{ kind:'visit', at: now - 3600e3, by:'أحمد' } },
    points:{ ph:250, budCap:1e6, tgtSurvey:40, dueSurvey: now + 30 * D, dueInstall: now + 80 * D, insCamp:5, insCor:8, warranty:12, w:{ 'مخيم':1 } }
  };
  const { text, hand } = run(db);
  T(hand === 0, 'زيارةٌ وصلت اليومَ ومهمّةٌ عمرُها يومان لا تُوقظان أحدًا: ' + hand);
  T(/زياراتٌ تنتظر الاعتمادَ التقني: \*\*١\*\*/.test(text), 'وتبقى مذكورةً في النصِّ لمن يفتحه');
  T(/لا مهمّةَ راكدةً/.test(text), 'ويُقال صراحةً إنه لا ركود');
}

console.log('\n══ ٣ · القاعدةُ الفارغةُ لا تُسقِط النبض ══');
{
  const { text, hand } = run({});
  const sat0 = new Date(now).getUTCDay() === 6;
  T(/لا خطوةَ مرفوعةً/.test(text) && /لا شيءَ ينتظر/.test(text), 'بلا وثائقَ: نصٌّ مفهومٌ بلا انهيار');
  T(/جاهزيةُ الموسم — ٧ بندًا ينقص/.test(text), 'وقاعدةٌ بلا ثوابتَ تُقرأ كلُّ بنودها ناقصة');
  T(hand === (sat0 ? 1 : 0), 'ولا يوقظ أحدًا إلا تذكيرَ الأسبوع: ' + hand);
}

console.log('\n══ ٤ · السيرُ يربط النبضَ بالبريد بشرطه ══');
{
  const y = readFileSync('.github/workflows/pulse.yml', 'utf8');
  T(/id:\s*pulse/.test(y) && /node scripts\/pulse\.mjs/.test(y), 'السيرُ يشغّل النبضَ ويسمّي خطوتَه');
  T(/steps\.pulse\.outputs\.hand != '0'/.test(y), 'ولا يُرسِل بريدًا إلا إن كان ثمّة ما ينتظر');
  T(/node scripts\/mail-send\.mjs/.test(y) && /MAIL_TO/.test(y), 'ويرسله بالمُرسِل نفسِه لا بخدمةٍ ثانية');
  T(/cron: '30 3 \* \* \*'/.test(y), 'وموعدُه صباحُ مكة');
  T(/issues: write/.test(y) && /node scripts\/pulse-issue\.mjs/.test(y),
    'ويكتب لوحتَه في المستودع فيصل قبل أن تُضبَط أسرارُ البريد');
  const pi = readFileSync('scripts/pulse-issue.mjs', 'utf8');
  T(/state=open&labels=/.test(pi) && /method:'PATCH'/.test(pi),
    'واللوحةُ بلاغٌ واحدٌ يُحدَّث — لا بلاغٌ جديدٌ كلَّ صباحٍ يزاحم بلاغاتِ الميدان');
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ النبض نظيف \u2705');
process.exit(0);
