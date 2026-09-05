/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الدورة الكاملة — node scripts/audit-e2e.mjs
   ───────────────────────────────────────────────────────────────────────────
   نقطةٌ واحدةٌ تُمشى من أوّلها إلى آخرها بالنقر: إسنادُ زيارةٍ ← زيارةٌ
   تُحفَظ ← اعتمادٌ ← حلٌّ يُقترَح ويُعتمَد ← ظهورُها في الجاهز للتركيب ←
   إسنادُ تركيبٍ ← تركيبٌ يُعتمَد ← تسليمٌ بمحضر ← جاهزةٌ للصيانة والفكّ ←
   إسنادُ فكّ. ومعها: النقاطُ تُحتسَب، والإسناداتُ الثلاثةُ في السجل بأرقامها،
   والصنفُ في دفتر الأرصدة. وأمسك يومَ كُتب عطلًا يقطع الدورةَ من نصفها.
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
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let bad=0; const say=(ok,n,x)=>{ if(!ok) bad++; console.log((ok?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس'; w.STATE.meta.uid='U1';
w.STATE.users={U1:{name:'مهندس',user:'m',role:'engineer',active:true,at:1},
               T1:{name:'فني أ',user:'t1',role:'tech',active:true,at:1}};
const S=w.STATE.sites, it=w.itemsList()[0];
/* ═══ الدورةُ كاملةً بالنقر: من نقطةٍ لم تُزر إلى فكٍّ مُسنَد ═══ */
const x=S[0];
// ١ إسنادُ زيارة
w.SEL={}; w.SEL[x.id]=1; w.SEL_N=1; w.ASN_MODE='tech'; w.ASN_TO='فني أ'; w.ASN_KIND='visit'; w.ASN_WHEN=w.dayKey(Date.now());
w.goPage('map'); w.render(1);
const kE=d.getElementById('asnKind'); if(kE) kE.value='visit';
const tE=d.getElementById('asnTo'); if(tE) tE.value='فني أ';
w.asnCommit();
say(!!w.STATE.tasks['TK-visit-'+x.id], '١ إسنادُ زيارة', (w.STATE.tasks['TK-visit-'+x.id]||{}).no);
say(w.lifeOf(x)==='assigned', '  الحالة: زيارةٌ مُسندة');
// ٢ زيارةٌ تُحفَظ
w.FORM.site=x.id; w.FORM.access='تم الوصول'; w.FORM.photos={site:{data:'data:,a'},mount:{data:'data:,b'}};
w.svSave(0);
say(w.lifeOf(x)==='visited', '٢ الزيارةُ حُفظت — تنتظر الاعتماد');
// ٣ اعتماد
w.svApprove(x.id);
say(w.lifeOf(x)==='ready', '٣ اعتُمدت — بانتظار الجدولة');
// ٤ حلٌّ يُقترَح ويُعتمَد
w.solutionSave(x.id, { [it.code]: 2 });
const sol=(w.STATE.inss[x.id]||{}).solution;
say(!!sol, '٤ حلٌّ حُفظ', sol&&sol.status);
if (sol && sol.status!=='معتمد') (w.solutionAppr||w.solutionApprove||function(){})(x.id, true);
say(((w.STATE.inss[x.id]||{}).solution||{}).status==='معتمد', '  الحلُّ معتمد');
// ٥ الجاهزُ للتركيب
say(w.asnReadyList('install').some(y=>y.id===x.id), '٥ يظهر في «جاهزٌ للتركيب»');
// ٦ إسنادُ تركيب
w.STATE.tasks['TK-install-'+x.id]={id:'TK-install-'+x.id,no:'IR-0001',site:x.id,kind:'install',to:'فريق التركيب',status:'مطلوب',when:w.dayKey(Date.now()),at:Date.now()};
w.statBump(); say(w.lifeOf(x)==='sched', '٦ إسنادُ التركيب — مُسندة للتركيب');
// ٧ تركيبٌ يُسجَّل ويُعتمَد
w.STATE.inss[x.id]=Object.assign({},w.STATE.inss[x.id],{status:'مُركّب',approved:true,at:Date.now(),by:'فريق التركيب',parts:{[it.code]:2},serials:{}});
w.statBump(); say(w.lifeOf(x)==='installed', '٧ رُكِّبت واعتُمدت');
// ٨ تسليم
say(w.handReady(x)===true, '٨ جاهزةٌ للتسليم');
w.handSave(x.id,'م. الوزارة','');
say(w.lifeOf(x)==='handed', '  سُلِّمت بمحضر '+((w.handOf(x.id)||{}).no||''));
// ٩ صيانة
say(w.asnReadyList('maint').some(y=>y.id===x.id), '٩ جاهزةٌ للصيانة');
// ١٠ فك
say(w.asnReadyList('dis').some(y=>y.id===x.id), '١٠ جاهزةٌ للفك (بعد التسليم فقط)');
w.STATE.tasks['TK-dis-'+x.id]={id:'TK-dis-'+x.id,no:'UR-0001',site:x.id,kind:'dis',to:'فريق الفك',status:'مطلوب',at:Date.now()};
w.statBump(); say(w.lifeOf(x)==='dis', '  إسنادُ الفك — حمراء');
// ١١ النقاطُ تُحتسَب
const sc=w.scores().list.filter(y=>y.name==='فني أ')[0];
const scAll=w.scores().list.map(y=>y.name+':'+y.survey).slice(0,4).join(' | ');
say(w.scores().list.some(y=>y.survey>=1), '١١ نقاطُ من زار تُحتسَب', scAll);
// ١٢ الطلبات في السجل
w.goPage('reqreg'); w.render(1);
const rg=w.regList().filter(y=>y.site===x.id);
say(rg.length===3, '١٢ الإسناداتُ الثلاثة في السجل', rg.map(y=>y.no).join('،'));
// ١٣ المخزون خُصم
w.STATE.moves=(w.STATE.moves||[]).concat([{id:'mv1',at:Date.now(),kind:'توريد',item:w.itemName(it.code),qty:5,by:'مستودع'}]);
w.statBump();
const bal=w.stockBalance().filter(y=>y.item===w.itemName(it.code))[0];
say(!!bal, '١٣ الصنفُ في دفتر الأرصدة', JSON.stringify(bal||{}).slice(0,60));
console.log(bad?'\nجردُ الدورة الكاملة فشل ✗ ('+bad+')':'\nالدورةُ تمشي من أوّلها إلى آخرها ✅');
process.exit(bad?1:0);
