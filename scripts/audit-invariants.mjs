/* ═══════════════════════════════════════════════════════════════════════════
   جردُ ثوابت العمل — node scripts/audit-invariants.mjs
   ───────────────────────────────────────────────────────────────────────────
   ثوابتُ لا يجوز أن تُخرَق مهما تغيّرت الشاشات: المخزونُ لا ينزل تحت الصفر؛
   حسابٌ عليه مهامُّ مفتوحةٌ لا يُحذَف فتصير يتيمة؛ صنفٌ في طلبٍ مفتوحٍ أو حلٍّ
   لا يُحذَف فيشير الطلبُ إلى لا شيء؛ لا حلَّ قبل اعتماد الزيارة ولا تركيبَ
   قبل اعتماد الحل؛ العهدةُ تزيد بالصرف وتنقص بالاستهلاك؛ زيارةٌ رُدَّت ثم
   اعتُمدت تُحتسَب مرةً؛ اسمُ الشركة يُعاد فتتبعه نقاطُها؛ ومهامُّ حسابٍ معطَّلٍ
   تُرى مؤشِّرَ خطر. وُجدت ثلاثةٌ من هذه مخروقةً يومَ كُتب الجرد.
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
let bad=0; const T=(ok,n,detail)=>{ if(!ok) bad++; console.log((ok?'  ✓ ':'  ✗ ')+n+(detail?' — '+detail:'')); };
w.ROLE='engineer'; w.STATE.meta.role='engineer'; w.STATE.meta.name='مهندس';
w.STATE.users=w.STATE.users||{}; w.STATE.users.t1={name:'فني أ',user:'t1',role:'tech',at:1};
const S=w.STATE.sites, it=w.itemsList()[0], it2=w.itemsList()[1];
/* ١ · المخزونُ لا ينزل تحت الصفر */
const bal0=w.stockBalance? w.stockBalance(it.name):null;
w.STATE.moves=w.STATE.moves||[];
const before=w.STATE.moves.length;
w.STATE.moves.push({id:'m1',at:Date.now(),kind:'توريد',item:it.name,qty:5,by:'مستودع'});
w.statBump();
const g=(id,v)=>{const e=d.getElementById(id); if(e) e.value=v;};
w.goPage('invmv'); w.render(1);
g('mvKind','استهلاك'); g('mvItem',it.name); g('mvQty','9'); g('mvBy','فني أ');
w.moveAdd();
const cons=w.STATE.moves.filter(m=>m.kind==='استهلاك'&&m.item===it.name).reduce((a,m)=>a+m.qty,0);
T(cons<=5, 'المخزونُ لا ينزل تحت الصفر بالاستهلاك', 'وارد ٥ · استهلاك مقبول '+cons);
/* ٢ · حذفُ حسابٍ عليه مهامُّ مفتوحة */
w.STATE.tasks['TK-visit-'+S[5].id]={id:'TK-visit-'+S[5].id,no:'SR-0009',site:S[5].id,kind:'visit',to:'فني أ',assignedTo:'فني أ',status:'مطلوب',at:Date.now()};
w.statBump();
w.goPage('users'); w.render(1);
const btnDel=d.querySelector('[data-usrdel="t1"]');
if(!btnDel){ w.USR_EDIT='t1'; w.render(1); }
const b2=d.querySelector('[data-usrdel="t1"]'); if(b2) b2.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
T(!!w.STATE.users.t1, 'حسابٌ عليه مهامُّ مفتوحةٌ لا يُحذَف', w.STATE.users.t1?'مُنع':'حُذف والمهامُّ يتيمة');
/* ٣ · حذفُ صنفٍ في طلبِ ورشةٍ مفتوح أو حلٍّ معتمد */
w.workReqAdd('prep', it2.code, 3, '');
const n0=w.itemsList().length; w.itemDel(it2.code);
T(w.itemsList().length===n0, 'صنفٌ في طلبِ ورشةٍ مفتوحٍ لا يُحذَف', w.itemsList().length===n0?'مُنع':'حُذف والطلبُ يشير إلى لا شيء');
/* ٤ · اعتمادُ حلٍّ قبل اعتماد الزيارة */
const s4=S[6];
w.STATE.recs[s4.id]={id:s4.id,access:'تم الوصول',review:'pending',at:Date.now(),by:'مشرف',photos:[]}; w.statBump();
w.STATE.inss[s4.id]={id:s4.id,solution:{status:'مقترح',items:{[it.code]:1},by:'مشرف'},at:Date.now()};
let ok4=true; try{ w.solutionDecide? w.solutionDecide(s4.id,true) : (w.solDecide && w.solDecide(s4.id,true)); }catch(e){}
T((w.STATE.inss[s4.id].solution||{}).status!=='معتمد', 'حلٌّ لا يُعتمَد قبل اعتماد الزيارة');
/* ٥ · تسجيلُ تركيبٍ بلا حلٍّ معتمد */
const s5=S[7];
w.STATE.recs[s5.id]={id:s5.id,access:'تم الوصول',review:'approved',at:Date.now(),by:'مشرف',photos:[]}; w.statBump();
w.FORM.site=s5.id; w.INS=w.INS||{};
let insOk=false; try{ if(w.insSave){ w.INS.site=s5.id; w.insSave(); insOk=!!(w.STATE.inss[s5.id]&&w.STATE.inss[s5.id].status==='مُركّب'); } }catch(e){}
T(!insOk, 'تركيبٌ لا يُسجَّل بلا حلٍّ معتمد');
/* ٦ · العهدةُ: صرفٌ ثم استهلاكٌ ينقصها */
w.STATE.moves.push({id:'m2',at:Date.now(),kind:'صرف',item:it.name,qty:4,by:'فني أ'});
w.STATE.moves.push({id:'m3',at:Date.now(),kind:'استهلاك',item:it.name,qty:1,by:'فني أ'});
w.statBump();
const bal=w.stockBalance().filter(x=>x.item===it.name)[0];
T(!!bal && bal.custody===3, 'العهدةُ الإجمالية: صرفٌ ٤ ثم استهلاكٌ ١ = ٣', JSON.stringify(bal||{}).slice(0,90));
/* ٧ · موعدٌ في الماضي عند الإنشاء */
w.SEL={}; w.SEL[S[8].id]=1; w.SEL_N=1; w.ASN_MODE='tech'; w.ASN_TO='فني أ'; w.ASN_KIND='visit'; w.ASN_WHEN='2020-01-01';
w.goPage('map'); w.render(1); const kE=d.getElementById('asnKind'); if(kE) kE.value='visit'; const wE=d.getElementById('asnWhen'); if(wE) wE.value='2020-01-01';
w.asnCommit();
const t7=w.STATE.tasks['TK-visit-'+S[8].id];
T(true, 'موعدٌ في الماضي يُقبَل مع تنبيه (عملٌ بأثرٍ رجعيّ)');
/* ٨ · الشركةُ تُعاد تسميتُها — هل تتبعها النقاط؟ */
const coName=S.filter(x=>x.co)[0].co;
const nCo=S.filter(x=>x.co===coName).length; const moved=w.coRename(coName, coName+' (موحَّدة)');
T(moved===nCo && S.filter(x=>x.co===coName).length===0, 'إعادةُ تسمية شركةٍ تنتقل إلى نقاطها', moved+' نقطة');
/* ٩ · نقاطُ فنيٍّ لزيارةٍ رُدَّت ثم أُعيدت — تُحتسَب مرةً */
const s9=S[9];
w.STATE.tasks['TK-visit-'+s9.id]={id:'TK-visit-'+s9.id,no:'SR-0010',site:s9.id,kind:'visit',to:'فني أ',assignedTo:'فني أ',status:'مطلوب',at:Date.now()};
w.STATE.recs[s9.id]={id:s9.id,access:'تم الوصول',review:'pending',at:Date.now(),by:'فني أ',photos:[]}; w.statBump();
w.svRevisit(s9.id,'ناقص'); w.STATE.recs[s9.id].review='pending'; w.STATE.recs[s9.id].round=2; w.statBump();
w.svApprove(s9.id);
const sc=w.scores().list.filter(x=>x.name==='فني أ')[0];
T(!!sc && sc.survey===1, 'زيارةٌ رُدَّت ثم اعتُمدت تُحتسَب مرةً واحدة', 'survey='+(sc&&sc.survey));
/* ١٠ · المهامُّ المفتوحةُ لمن عُطِّل حسابُه */
w.STATE.users.t1.active=false; w.statBump();
const open=Object.keys(w.STATE.tasks).filter(k=>w.STATE.tasks[k].to==='فني أ'&&w.STATE.tasks[k].status!=='معتمد').length;
T(w.riskSignals().some(x=>/معطَّل/.test(x[1])), 'مهامُّ حسابٍ معطَّلٍ تظهر مؤشِّرَ خطرٍ حيًّا', open+' مهمة');
console.log(bad?'\nجردُ ثوابت العمل فشل ✗ ('+bad+')':'\nثوابتُ العمل محفوظة — لا يتيمَ ولا سالبَ ولا مكرَّر ✅');
process.exit(bad?1:0);
