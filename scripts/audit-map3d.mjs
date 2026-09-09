/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الخريطة الثلاثية — node scripts/audit-map3d.mjs
   ───────────────────────────────────────────────────────────────────────────
   الثلاثيُّ وضعٌ للخريطة نفسِها لا صفحةٌ ثانية (V16.76). فيُثبَت هنا أن زرَّ
   «٣د» على شريط الخريطة، وأن ما يُرفَع مجسَّمًا هو ما تعرضه الخريطةُ المسطّحة
   بالحرف: القائمةُ نفسُها بعد الطبقة والمرشِّحات، واللونُ نفسُه لكلِّ نقطة،
   والنقرةُ تفتح بطاقةَ النقطة نفسَها، والقمرُ الصناعيُّ يتبع، والضغطةُ الثانية
   تعيد المسطّح. ويُثبَت أن التوأمَ الرقميَّ وصفحةَ العرض الثلاثي زالا بلا أثر
   في القوائم والأدوار والتصدير. المحرّكُ الحقيقيُّ لا يعمل في المحاكي فيُستبدَل
   بمحرّكٍ زائفٍ يسجّل ما طُلب منه.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = { readFileSync };
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
(async()=>{
 const vc=new VirtualConsole(); const errs=[]; vc.on('jsdomError',e=>{ const m=String(e.message||e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0,160)); });
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',virtualConsole:vc});
 const w=dom.window,d=w.document; w.HTMLCanvasElement.prototype.getContext=()=>null; if(!w.CSS)w.CSS={}; if(!w.CSS.escape)w.CSS.escape=s=>String(s); w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}); w.scrollTo=()=>{};
 await new Promise(r=>setTimeout(r,900));
 w.FB.signIn=()=>Promise.resolve({ok:true,role:'admin',name:'مدير'}); w.FB.legacyDone=()=>true; w.pullDelta=()=>Promise.resolve(0); w.liveWatch=()=>{}; w.liveSmall=()=>{};
 d.getElementById('lgU').value='x'; d.getElementById('lgP').value='TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 await new Promise(r=>setTimeout(r,1500));

 T(!w.PAGE.twin && !w.PAGE.map3d, 'لا صفحةَ توأمٍ ولا صفحةَ ثلاثي');
 T(!w.NAV.some(g=>(g.items||[]).some(it=>it[0]==='twin'||it[0]==='map3d')), 'القائمةُ بلا بنديهما');
 T(!Object.keys(w.ROLES).some(r=>Array.isArray(w.ROLES[r].nav)&&w.ROLES[r].nav.some(x=>x==='twin'||x==='map3d')), 'ولا دورَ يحملهما');
 T(typeof w.twinHealth==='undefined' && typeof w.twinStats==='undefined', 'دوالُّ التوأم أُزيلت');
 T(typeof w.SHEETS.twin==='undefined' && !w.EXP_SECS.some(x=>x[0]==='twin'), 'لا تصديرَ للتوأم');
 // بيانات تجريبية
 w.STATE.sites=[{id:'A1',name:'أ',zone:'منى',type:'مخيم',lat:21.41,lng:39.89},{id:'B2',name:'ب',zone:'منى',type:'ممر',lat:21.412,lng:39.892},{id:'C3',name:'ج',zone:'عرفات',type:'كاميرا',lat:21.35,lng:39.98}];
 w.goPage('map'); w.render(1); await new Promise(r=>setTimeout(r,300));
 const chip=d.querySelector('[data-m3]'); T(!!chip && chip.textContent.includes('٣د'), 'زرُّ «٣د» على شريط الخريطة: '+(chip&&chip.textContent.trim()));
 T(!!d.getElementById('m3Box') && d.getElementById('m3Box').hidden, 'حاويةُ الثلاثي موجودةٌ ومخفيةٌ في المسطّح');
 // محرّك زائف
 const calls={sources:{},layers:[],events:{},jump:null,style:0};
 w.maplibregl={ Map:function(o){ this.o=o; calls.style++; const self=this;
    this.on=(ev,a,b)=>{ const fn=b||a; calls.events[ev+(b?':'+a:'')]=fn; if(ev==='style.load') setTimeout(()=>fn(),0); };
    this.addControl=()=>{}; this.getSource=id=>calls.sources[id]; this.addSource=(id,src)=>{ calls.sources[id]={ data:src.data, setData:(x)=>{calls.sources[id].data=x;} }; };
    this.addLayer=l=>calls.layers.push(l.id); this.getStyle=()=>({layers:[]}); this.setPaintProperty=()=>{}; this.setTerrain=()=>{}; this.resize=()=>{};
    this.jumpTo=x=>calls.jump=x; this.flyTo=x=>calls.jump=x; this.getCenter=()=>({lng:39.9,lat:21.4}); this.getZoom=()=>15; this.getBounds=()=>({contains:()=>true}); this.getCanvas=()=>({style:{}}); this.setStyle=()=>{calls.style++; setTimeout(()=>calls.events['style.load'](),0);}; },
   NavigationControl:function(){} };
 w.M3_READY=true;
 chip.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 await new Promise(r=>setTimeout(r,400));
 T(w.MAP_3D===true, 'بعد الضغطة: الوضعُ ثلاثي');
 T(!d.getElementById('m3Box').hidden, 'الحاويةُ ظاهرة');
 const chip2=d.querySelector('[data-m3]'); T(chip2 && chip2.textContent.includes('٢د') && chip2.classList.contains('on'), 'الزرُّ صار «٢د» ومضاء: '+(chip2&&chip2.textContent.trim()));
 T(!!calls.sources.nsk && !!calls.sources.nskc && calls.layers.includes('nsk-cols') && calls.layers.includes('nsk-pts'), 'طبقتا النقاط والأعمدة أُضيفتا: '+calls.layers.join(','));
 const feats=calls.sources.nsk.data.features; const ids=feats.map(f=>f.properties.id).sort().join(',');
 const want=w.layerFiltered().filter(x=>+x.lat&&+x.lng).map(x=>x.id).sort().join(',');
 T(ids===want && ids.length>0, 'النقاطُ هي نقاطُ الخريطة المسطّحة نفسُها: '+feats.length+' نقطة');
 const BY={}; w.layerFiltered().forEach(x=>BY[x.id]=x);
 T(feats.every(f=>f.properties.color===w.mapColorOf(BY[f.properties.id])), 'والألوانُ هي ألوانُها نفسُها');
 const cols=calls.sources.nskc.data.features; T(cols.length===feats.length && cols[0].geometry.type==='Polygon' && cols[0].properties.h>0, 'لكلِّ نقطةٍ عمودٌ مضلّعٌ بارتفاع: h='+cols[0].properties.h);
 /* المخيمُ بحدوده الحقيقية حين تُحمَّل — لا مربّعًا حول نقطته */
 const camp=feats.find(f=>w.siteFind && (w.siteFind(f.properties.id)||{}).type==='مخيم') || feats[0];
 w.POLY={ [camp.properties.id]: [[39.98378,21.33815],[39.98384,21.33783],[39.98399,21.33761],[39.98381,21.33762],[39.98378,21.33815]] };
 w.mapPaint();
 const cf=calls.sources.nskc.data.features.find(f=>f.properties.id===camp.properties.id);
 const pf=calls.sources.nsk.data.features.find(f=>f.properties.id===camp.properties.id);
 T(cf && cf.properties.foot===1 && cf.geometry.coordinates[0].length>=5 && cf.geometry.coordinates[0][0][0]===39.98378, 'المخيمُ يُرفَع بحدوده من poly.json لا بمربّع: '+(cf?cf.geometry.coordinates[0].length:0)+' رأسًا');
 T(pf && pf.properties.foot===1, 'ونقطتُه تختفي خلف حدوده (foot=1)');
 const other=calls.sources.nskc.data.features.find(f=>f.properties.id!==camp.properties.id);
 T(other && other.properties.foot===0 && other.geometry.coordinates[0].length===5, 'وما لا حدودَ له يبقى عمودًا صغيرًا');
 w.POLY=null;
 T(!w.MAP || (calls.jump && Math.abs(calls.jump.center[1]-w.MAP.getCenter().lat)<1e-6 && calls.jump.pitch===60), 'الكاميرا انتقلت حيث كانت الخريطةُ المسطّحة'+(w.MAP?'':' (لا خريطةَ مسطّحةً في المحاكي — تُختبَر في المتصفّح)'));
 // تغييرُ الطبقة يُعيد الرسم في الثلاثيّ
 const before=calls.sources.nsk.data; w.FIELD_MODE='install'; w.mapPaint(); T(calls.sources.nsk.data!==before, 'تبديلُ الطبقة يُعيد رسمَ الثلاثيّ');
 const BY2={}; w.layerFiltered().forEach(x=>BY2[x.id]=x); T(calls.sources.nsk.data.features.every(f=>f.properties.color===w.mapColorOf(BY2[f.properties.id])), 'وألوانُ طبقة التركيب تُطابق ('+calls.sources.nsk.data.features.length+')');
 w.FIELD_MODE='survey'; w.mapPaint();
 // النقرة تفتح البطاقةَ نفسَها
 const anyId=calls.sources.nsk.data.features[0].properties.id; calls.events['click:nsk-pts']({features:[{properties:{id:anyId}}]}); await new Promise(r=>setTimeout(r,100));
 T(w.POP_OPEN===true && w.POP_SITE===anyId, 'النقرةُ في الثلاثيّ تفتح بطاقةَ النقطة: '+w.POP_SITE);
 w.POP_OPEN=false;
 // القمر الصناعي يتبع
 d.querySelector('[data-sat]').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await new Promise(r=>setTimeout(r,150));
 T(w.MAP_SAT===true && calls.style===2, 'القمرُ الصناعيُّ يبدّل نمطَ الثلاثيّ أيضًا');
 // العودة
 d.querySelector('[data-m3]').dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await new Promise(r=>setTimeout(r,300));
 T(w.MAP_3D===false && d.getElementById('m3Box').hidden, 'الضغطةُ الثانية تعيد المسطّح');
 T(d.querySelector('[data-m3]').textContent.includes('٣د'), 'والزرُّ عاد «٣د»');
 T(errs.length===0, 'بلا أخطاءِ متصفّح'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(bad ? '\nجردُ الخريطة الثلاثية فشل ✗ (' + bad + ')' : '\nالثلاثيُّ هو الخريطةُ نفسُها مرفوعةً ✅');
 process.exit(bad ? 1 : 0);
})().catch(e=>{ console.log('  ✗ الجردُ نفسُه سقط: '+String(e && e.stack || e).slice(0,400)); process.exit(1); });
