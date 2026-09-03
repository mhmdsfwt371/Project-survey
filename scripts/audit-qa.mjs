/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الجودة — node scripts/audit-qa.mjs
   ───────────────────────────────────────────────────────────────────────────
   ما يفعله فاحصُ الجودة بعينه على كلِّ شاشةٍ بكلِّ دورٍ ولغتين — آليًّا:
   معرِّفٌ مكرَّرٌ في الشاشة (getElementById يأخذ الأولَ ويُهمل الباقي صامتًا)،
   وحقلٌ بلا تسمية، ونصٌّ إنجليزيٌّ مركَّبٌ بالجمع تتخلّله كلمةٌ عربية —
   كشارة الخريطة التي قالت «outside the view Offered» — وشاشةٌ تنفجر أو
   تُطلق خطأً في المتصفّح.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html','utf8');
const errs=[]; const vc=new VirtualConsole();
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) errs.push(String(e.message).slice(0,120)); });
vc.on('error', m => errs.push('console.error: '+String(m).slice(0,120)));
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')].map(a=>a.getAttribute('data-p')).flatMap(id=>(w.TABS&&w.TABS[id])?w.TABS[id].map(t=>t[0]):[id]))];
const dup={}, nolabel={}, composed={}, thrown={};
for (const lang of ['ar','en']){
  w.LANG=lang;
  for (const role of ['engineer','supervisor','tech','viewer']){
    w.ROLE=role; w.STATE.meta.role=role;
    for (const id of ids){
      try { w.goPage(id); w.render(1); } catch(e){ thrown[id+'@'+role+'/'+lang]=String(e.message).slice(0,80); continue; }
      const C=d.getElementById('content'); if(!C) continue;
      /* معرّفاتٌ مكرّرة — getElementById يأخذ الأول ويُهمل الباقي صامتًا */
      const seen={}; C.querySelectorAll('[id]').forEach(el=>{ seen[el.id]=(seen[el.id]||0)+1; });
      const dd=Object.keys(seen).filter(k=>seen[k]>1); if(dd.length) dup[id+'@'+role]=dd.slice(0,4);
      /* حقولٌ بلا تسمية (في الإنجليزية فقط لتقليل الضجيج) */
      if(lang==='en'&&role==='engineer'){
        const nl=[...C.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')]
          .filter(el=>{ if(el.id&&C.querySelector('label[for="'+el.id+'"]')) return false; if(el.closest('label')) return false;
            if(el.getAttribute('aria-label')||el.getAttribute('placeholder')) return false;
            const f=el.closest('.field'); return !(f&&f.querySelector('label')); });
        if(nl.length) nolabel[id]=nl.length;
      }
      /* نصوصٌ إنجليزيةٌ مركَّبةٌ بالجمع تظهر مكسورةً: كلمةٌ عربيةٌ داخل جملةٍ إنجليزية أو العكس */
      if(lang==='en'){
        const txt=(C.textContent||'').replace(/\s+/g,' ');
        const m=txt.match(/[A-Za-z]{3,} [\u0600-\u06FF]{2,} [A-Za-z]{3,}/g);
        if(m) composed[id]=m.slice(0,3);
      }
    }
  }
}
/* شارةُ الخريطة بالإنجليزية */
w.LANG='en'; w.ROLE='engineer'; w.goPage('map'); w.render(1);
const badge=(d.querySelector('.map-badge')||{}).textContent||'';
console.log('══ QA sweep ══');
console.log('صفحات وشرائح:',ids.length,'· لغتان · أربعة أدوار');
console.log('أخطاء المتصفح عند الإقلاع:',errs.length, errs.slice(0,3));
console.log('انفجارات عند الرسم:',Object.keys(thrown).length, thrown);
console.log('معرّفات مكرّرة:',Object.keys(dup).length); Object.entries(dup).slice(0,12).forEach(([k,v])=>console.log('   ',k,v));
console.log('حقول بلا تسمية:',Object.keys(nolabel).length, nolabel);
console.log('نصوص مركّبة مكسورة (en):',Object.keys(composed).length); Object.entries(composed).slice(0,8).forEach(([k,v])=>console.log('   ',k,v));
let bad=0; const T=(c,n)=>{console.log((c?'  ✓ ':'  ✗ ')+n); if(!c)bad++;};
T(errs.length===0,'لا أخطاءَ متصفّحٍ عند الإقلاع');
T(Object.keys(thrown).length===0,'لا شاشةَ تنفجر بأيِّ دورٍ أو لغة');
T(Object.keys(dup).length===0,'لا معرِّفَ مكرَّرًا في شاشة');
T(Object.keys(nolabel).length===0,'لا حقلَ بلا تسمية');
T(Object.keys(composed).length===0,'لا نصَّ إنجليزيًّا مركَّبًا مكسورًا');
console.log(bad?'\nجردُ الجودة فشل ✗ ('+bad+')':'\nجردُ الجودة نظيف — بكلِّ دورٍ ولغتين ✅');
process.exit(bad?1:0);
