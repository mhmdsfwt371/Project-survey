/* ═══════════════════════════════════════════════════════════════════════════
   جردُ حالة النسخ الاحتياطي — node scripts/audit-backup.mjs
   ───────────────────────────────────────────────────────────────────────────
   السيرُ اليوميُّ كان ينجح كلَّ يوم ويقول «نجح» وهو لا يحفظ شيئًا حين تغيب
   الأسرار — يكتب أعدادًا ويتخطّى الرفعَ بإشعارٍ لطيف. فظُنَّ أن النسخَ يعمل
   وهو لا يعمل. صار يكتب حالتَه في ملفّين علنيَّين بلا بيانات، والتطبيقُ يقرؤهما
   ويعرضهما في «صحة النظام» ويُنذر بهما في سجل المخاطر — بالحرف: ما الذي
   ينقص. وحين تُضبَط الأسرارُ تخضرُّ البطاقةُ ويختفي المؤشر.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
/* يُحاكى المستودع: ملفّان يقولان الحقيقة */
const files={'_meta.json':{ok:false,at:new Date().toISOString(),why:'BACKUP_KEY غير مضبوط — لم تُؤخَذ نسخة',fix:'Settings ← Secrets'},
             '_drive.json':{ok:false,at:new Date().toISOString(),why:'GDRIVE_SA غير مضبوط — لم يُرفَع شيءٌ إلى درايف',fix:'GDRIVE_SA + GDRIVE_FOLDER'}};
w.fetch=(u)=>{ const f=Object.keys(files).find(k=>u.indexOf(k)>-1); return Promise.resolve({ok:!!f, json:()=>Promise.resolve(files[f])}); };
Object.defineProperty(w.navigator,'onLine',{get:()=>true});
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n)=>{console.log((c?'  ✓ ':'  ✗ ')+n); if(!c)bad++;};
w.ROLE='engineer'; w.STATE.meta.role='engineer';
w.goPage('hb'); w.render(1); await new Promise(r=>setTimeout(r,200)); w.render(1);
let h=d.getElementById('content').textContent;
T(h.indexOf('النسخ الاحتياطي والدرايف')>-1, 'بطاقةُ النسخ في «صحة النظام»');
T(h.indexOf('لم تُؤخَذ')>-1 && h.indexOf('BACKUP_KEY')>-1, 'تقول بالحرف: لم تُؤخَذ نسخة — وما ينقص');
T(h.indexOf('لم يُرفَع')>-1 && h.indexOf('GDRIVE_SA')>-1, 'وتقول: لم يُرفَع إلى درايف — وما ينقص');
const sig=w.riskSignals().map(x=>x[1]).join(' | ');
T(/BACKUP_KEY/.test(sig) && /GDRIVE_SA/.test(sig), 'ومؤشرا خطرٍ حيّان في سجل المخاطر');
/* حين تُضبَط الأسرار تخضرّ */
files['_meta.json']={ok:true,at:new Date().toISOString(),totalDocs:4321};
files['_drive.json']={ok:true,at:new Date().toISOString(),day:'2026-09-04',bytes:{'backup-full.json':2500000,'photos.json':80000000}};
w.bkFetch(true); await new Promise(r=>setTimeout(r,200)); w.render(1);
h=d.getElementById('content').textContent;
T(h.indexOf('أُخذت')>-1 && h.indexOf('وصل')>-1, 'وحين تُضبَط الأسرارُ تقول: أُخذت · وصل');
T(!/BACKUP_KEY|GDRIVE_SA/.test(w.riskSignals().map(x=>x[1]).join('|')), 'ويختفي المؤشران');
/* الفنيُّ لا يرى المؤشرَ (شأنُ المكتب) */
w.ROLE='tech'; w.STATE.meta.role='tech'; files['_meta.json'].ok=false; w.bkFetch(true); await new Promise(r=>setTimeout(r,200));
T(!/BACKUP_KEY/.test(w.riskSignals().map(x=>x[1]).join('|')), 'الفنيُّ لا يُشغَل بمؤشر النسخ');
console.log(bad?'\nجردُ حالة النسخ فشل ✗ ('+bad+')':'\nحالةُ النسخ تُرى حيث يُرى — لا نجاحَ كاذبًا ✅');
process.exit(bad?1:0);
