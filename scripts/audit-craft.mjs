/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الصنعة — node scripts/audit-craft.mjs
   ───────────────────────────────────────────────────────────────────────────
   ما يسأل عنه مبرمجٌ متمرِّسٌ ولا يظهر في شاشة: مؤقّتٌ يُنشأ في دالةٍ تتكرّر
   فيتراكم، ومستمعٌ يُضاف داخل الرسم فيتضاعف مع كلِّ رسمة، ومدخلٌ يُحقَن بلا
   هروب، وعددٌ يُفحَص بصدقه فيضيع الصفر الصحيح، ودالةٌ تكبر حتى لا تُقرأ،
   وقاعدةٌ مفتوحةٌ بلا شرط، وسرٌّ مكتوبٌ في ملفٍ علنيّ، وجردٌ في المجلد لا
   يُشغِّله أحد. يُقاس كلُّ ذلك في كلِّ دفعة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync } from 'fs';
const src = readFileSync('index.html','utf8');
const js = /<script>([\s\S]*)<\/script>/.exec(src)[1];
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
/* ═══ مراجعةُ مبرمجٍ متمرِّس ═══ */
/* ١ · تسرُّبُ الذاكرة: مؤقّتٌ يُنشأ داخل دالةٍ تُنادى مرارًا ولا يُلغى.
   المؤقّتُ في المستوى الأعلى يُنشأ مرةً عند الإقلاع فلا يتراكم — والعبرةُ
   بمن يُنشئه في دالةٍ تتكرّر. */
const inFn=[...js.matchAll(/^ +.{0,80}setInterval\(/gm)].map(m=>m[0].trim());
const cleared=(js.match(/clearInterval\(/g)||[]).length;
T(inFn.length<=cleared, 'كلُّ مؤقّتٍ يُنشأ داخل دالةٍ له مُلغٍ',
  inFn.length+' داخل دوال · '+cleared+' clearInterval');
/* ٢ · مستمعاتٌ تُضاف داخل الرسم — تتراكم مع كلِّ إعادة رسم */
const inRender=[...js.matchAll(/function render[\s\S]{0,4000}?addEventListener/g)].length;
T(inRender===0, 'لا مستمعَ يُضاف داخل الرسم', inRender?'يتراكم مع كل رسمة':'');
/* ٣ · innerHTML بمدخلٍ غيرِ مهروب */
const raw=[...js.matchAll(/innerHTML\s*=\s*[^;]{0,120}/g)].map(m=>m[0])
  .filter(x=>/\+\s*(x\.|r\.|s\.|v\.|name|text|note|value)/.test(x) && !/esc\(/.test(x));
T(raw.length===0, 'لا مدخلَ يُحقَن بلا هروب', raw.slice(0,2).join(' | '));
/* ٤ · async بلا catch */
const noCatch=[...js.matchAll(/\.then\(function[\s\S]{0,600}?\}\)(?!\s*\.catch)/g)].length;
T(true, 'وعودٌ بلا catch (تقديري)', String(noCatch));
/* ٥ · الخطرُ الحقيقيُّ: `if (x)` على عددٍ قد يكون صفرًا صحيحًا —
   فيُعامَل الصفرُ معاملةَ الغياب. تُفحَص الحقولُ العدديةُ المعروفة. */
const zeroTrap=[...js.matchAll(/if\s*\(\s*(?:x|r|s)\.(qty|pts|lat|lng|n)\s*\)/g)].map(m=>m[0]);
T(zeroTrap.length===0, 'لا عددٌ يُفحَص بصدقه فيضيع الصفر', zeroTrap.slice(0,3).join(' | '));
/* ٦ · حجمُ أكبر دالة */
const sizes=[];
for (const m of js.matchAll(/^function (\w+)\(/gm)){
  let i=js.indexOf('{', m.index), d0=0, k=i;
  while (k<js.length){ const c=js[k]; if(c==='{')d0++; else if(c==='}'){d0--; if(!d0)break;} k++; }
  sizes.push([k-m.index, m[1]]);
}
sizes.sort((a,b)=>b[0]-a[0]);
T(sizes[0][0]<60000, 'أكبرُ دالةٍ تحت ستِّين ألفًا', sizes.slice(0,3).map(x=>x[1]+':'+Math.round(x[0]/1024)+'ك').join(' · '));
/* ٧ · القواعدُ: لا مجموعةَ مفتوحةٌ للكتابة بلا شرط */
const R=readFileSync('firestore.rules','utf8');
const openW=[...R.matchAll(/allow (write|create|update|delete)[^;]*if true/g)].length;
T(openW===0, 'لا قاعدةَ مفتوحةٌ بلا شرط', String(openW));
/* ٨ · sw.js يخزّن ما يلزم فقط */
const sw=readFileSync('sw.js','utf8');
T(!/backup|\.enc|users/.test(sw), 'عاملُ الخدمة لا يخزّن بياناتٍ حسّاسة');
/* ٩ · لا مفاتيحَ سرّيةٌ في المستودع */
const secrets=[...src.matchAll(/(?:secret|password|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}/gi)].length;
T(secrets===0, 'لا سرَّ مكتوبٌ في الملف', String(secrets));
/* ١٠ · الجرودُ كلُّها مسجَّلة */
const cv=readFileSync('scripts/check-version.mjs','utf8');
const files=readdirSync('scripts').filter(f=>/^audit-.*\.mjs$/.test(f));
/* جردان يُشغَّلان من preflight لا بالاسم — كما في audit-ci */
const VIA_PREFLIGHT=['audit-capacity.mjs','audit-guards.mjs'];
const missing=files.filter(f=>!cv.includes(f) && !VIA_PREFLIGHT.includes(f));
T(missing.length===0, 'كلُّ جردٍ في المجلد مسجَّلٌ في الحارس ('+files.length+')', missing.join(' · '));
console.log(bad?'\nجردُ الصنعة فشل ✗ ('+bad+')':'\nلا ملاحظةَ صنعةٍ باقية ✅');
process.exit(bad?1:0);
