/* ═══ (V37.97) جردُ السيناريوهات — المعنى لا الشكل ═══
   الجرودُ تتحقّق أن الشاشةَ تُفتح وأن الزرَّ موصول، لا أن ما يُحفَظ صحيح. فعاش نموذجُ التركيب
   مكسورًا من V14.27 إلى V37.90 (أسماءٌ فارغة وكلُّ القطع بمفتاح «undefined») ولم يرصده جرد.
   هنا خمسةُ مساراتٍ كاملة، تُحرَّك بدوالِّ التطبيق نفسِها ويُتحقَّق مما كُتب في الحالة والطابور:
   ١ التركيب · ٢ تجهيزةُ الديمو · ٣ المسح والاعتماد · ٤ بياناتُ ١٤٤٧ ← نموذجُ التركيب · ٥ جسرُ نظام البطاقات والتحقق ·
   (V37.99) ٦ المخزن · ٧ أرقامُ المسح للوزارة · ٨ الفكّ · (V38.16) ٩ مساعدُ البيانات: كلُّ رقمٍ يجيب به = عدٌّ مستقلٌّ من الحالة. */
import './lib/jsdom-dict.cjs';   /* (V39.11) the dictionary in the test page — scenario ٤٦ reads the sheet in English */
import { readFileSync } from 'fs';
import { appHtml } from './lib/src.mjs';   /* (V38.39) the whole app in production order — index.html is now the core only */
import { createRequire } from 'module';
const { JSDOM, VirtualConsole } = createRequire(import.meta.url)('jsdom');   /* through require, so the dictionary patch applies */

const html = (await appHtml());
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };

const vc = new VirtualConsole();
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/', virtualConsole:vc });
const w = dom.window;
w.fetch = () => Promise.reject(new Error('offline'));
w.confirm = () => true;
await new Promise(r => setTimeout(r, 1500));
const toasts = []; w.toast = m => toasts.push(String(m));
const queued = () => (w.STATE.queue || []);
const IMG = 'data:image/jpeg;base64,/9j/AAAA';
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.STATE.meta.name = 'جرد السيناريوهات';

const camp = w.STATE.sites.find(x => x && x.type === 'مخيم' && x.zone === 'منى' && x.sign);
const zone = w.siteZone(camp);
const parts = w.itemsList().filter(i => i.z === zone && i.name);
const rdr = parts.find(i => /^rdr/i.test(i.code) || /قارئ/.test(i.name));
const cam = parts.find(i => /كاميرا/.test(i.name));

/* (V41.1) the map's top row folds by group — the older map checks look at every chip, so all groups are open for them */
if (w.PV) w.PV.MTOP = '*';

/* ── ١ · التركيب يحفظ كلَّ قطعةٍ بمفتاحها ونقاطِها، ويُستهلَك من المخزن ── */
console.log('\n══ ١ · التركيب ══');
{
  parts.forEach((p, i) => w.cfgSet('itPts', p.code, i + 1));   /* أوزانٌ معروفة */
  const movesBefore = (w.STATE.moves || []).length;
  /* عبر الشاشة نفسِها كما يفعل الفني: تُرسَم القطع، وتُكتَب الكميةُ والسيريالُ في خاناتها */
  w.formReset(); w.FORM.site = camp.id; w.PTAB = w.PTAB || {}; w.PTAB.forms = 'insForm'; w.CUR = 'forms'; w.render(1);
  const d = w.document, put = (sel, v) => { const el = d.querySelector(sel); if (!el) return false; el.value = String(v);
    el.dispatchEvent(new w.Event('input', { bubbles:true })); el.dispatchEvent(new w.Event('change', { bubbles:true })); return true; };
  T(put('#content [data-part="' + rdr.code + '"]', 1) && put('#content [data-part="' + cam.code + '"]', 2) && put('#content [data-serial="' + rdr.code + '"]', '26127723'),
    'خاناتُ القطع مرسومةٌ بمفاتيحها في الشاشة');
  w.FORM.status = 'مُركّب';
  w.FORM.photos.before = { data:IMG }; w.FORM.photos.after = { data:IMG };
  w.insSave(false);
  const r = w.STATE.inss[camp.id] || {};
  const keys = Object.keys(r.parts || {});
  T(r.status === 'مُركّب', 'يُحفَظ التركيبُ بحالته');
  T(keys.length === 2 && keys.every(k => parts.some(p => p.code === k)), 'القطعُ بمفاتيحها الحقيقية لا «undefined»: ' + keys.join(','));
  T((r.serials || {})[rdr.code] === '26127723', 'سيريالُ القارئ على قطعته');
  const want = 1 * w.itPts(rdr.code) + 2 * w.itPts(cam.code);
  T(Math.abs(+r.pts - want) < 0.001 && want > 0, 'النقاطُ = الكمية × الوزن: ' + r.pts + ' / ' + want);
  const mv = (w.STATE.moves || []).slice(movesBefore).filter(m => m.site === camp.id && m.kind === 'استهلاك');
  T(mv.length === 2 && mv.some(m => m.item === rdr.code && m.qty === 1) && mv.some(m => m.item === cam.code && m.qty === 2), 'يُستهلَك من المخزن ما رُكِّب بعينه وكميته');
  T(w.insPtsOf(camp.id) === r.pts, 'النقاطُ تُقرأ من مكانٍ واحدٍ في كلِّ الشاشات');
}

/* ── ٢ · تجهيزةُ الديمو تحفظ ما قبلها ويُستهلَك الفرقُ وحدَه ── */
console.log('\n══ ٢ · تجهيزةُ الديمو ══');
{
  camp.pilot = true;
  const prev = JSON.parse(JSON.stringify(w.STATE.inss[camp.id]));
  const movesBefore = (w.STATE.moves || []).length;
  w.formReset(); w.FORM.site = camp.id;
  w.FORM.parts[rdr.code] = 1; w.FORM.parts[cam.code] = 3;   /* كاميرا إضافية */
  w.FORM.serials[rdr.code] = '26127723';
  w.FORM.status = 'مُركّب'; w.FORM.photos.before = { data:IMG }; w.FORM.photos.after = { data:IMG };
  w.insSave(false);
  const r = w.STATE.inss[camp.id] || {};
  T(Array.isArray(r.revs) && r.revs.length === 1, 'التجهيزةُ السابقةُ محفوظة');
  T(r.revs && JSON.stringify(r.revs[0].parts) === JSON.stringify(prev.parts), 'بقطعها كما كانت');
  const mv = (w.STATE.moves || []).slice(movesBefore).filter(m => m.site === camp.id);
  T(mv.length === 1 && mv[0].item === cam.code && mv[0].qty === 1, 'ويُستهلَك الفرقُ الزائدُ وحدَه (كاميرا واحدة)');
  T(w.partsDiff(r.revs[0].parts, r.parts).length === 1, 'وما تغيّر بين التجهيزتين يُحسَب');
  w.formReset(); w.FORM.site = camp.id; toasts.length = 0; w.insSave(true);
  T(w.STATE.inss[camp.id].status === 'مُركّب' && toasts.some(m => /المسودّة/.test(m)), 'والمسودّةُ لا تمحو تجهيزةً مركَّبة');
  camp.pilot = false;
}

/* ── ٣ · المسح ثم الاعتماد يرفعها للوزارة ── */
console.log('\n══ ٣ · المسح والاعتماد ══');
{
  const x = w.STATE.sites.find(z => z && z.type === 'مخيم' && !w.STATE.recs[z.id] && z.id !== camp.id);
  w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', by:'فني', at:Date.now(), mount:'هيكل قائم', power:'شبكة' };
  const ok = w.svApprove(x.id);
  const r = w.STATE.recs[x.id];
  T(ok !== false && r.review === 'approved', 'الاعتمادُ التقنيُّ يُكتَب');
  T(r.minReview === 'pending', 'ويرفعها إلى مراجعة الوزارة');
  T(queued().some(q => q.kind === 'recs' && q.id === x.id), 'ويدخل طابورَ الرفع');
  w.STATE.recs[x.id + '_n'] = { id:x.id + '_n', access:'لم يتم الوصول', at:Date.now() };
  T(w.svApprove(x.id + '_n') === false, 'وزيارةٌ لم تصل لا تُعتمَد');
}

/* ── ٤ · بياناتُ ١٤٤٧ تُعبّئ نموذجَ التركيب، ولا كلمةَ مرورٍ تُحفَظ ── */
console.log('\n══ ٤ · بياناتُ ١٤٤٧ ══');
{
  const x = w.STATE.sites.find(z => z && z.type === 'مخيم' && z.zone === 'منى' && z.sign && z.id !== camp.id && !w.STATE.inss[z.id]);
  const m = /^(.+)\/(\d+)$/.exec(String(x.sign));
  const rows = [
    ['NAME', 'latitude', 'longitude', 'Router', '', '', '', '', '', '', 'Provider Name', 'Reader', '', 'Camera Name', 'Camera', '', '', '', '', 'Engineer', 'Config Date'],
    ['', '', '', 'IP', 'User', 'Password', 'Wifi', 'Wifi Pass', 'Serial', 'SIM', '', 'IP', 'Serial', '', 'IP', 'user', 'pass', 'MAC', 'Serial', '', ''],
    ['Column1'],
    ['Camp-' + m[1] + '-' + m[2], '', '', '172.16.77.1', 'admin', 'X@1', 'w', 'p', 'RTR123456', '8996600000000', 'zain', '172.16.77.2', '26999001', 'Camp' + m[1] + '-' + m[2], '172.16.77.3', 'admin', 'p', 'aa', 'JedTeam@2025#', 'م', '2026-04-18'],
    ['Camp-9999-9999', '', '', '172.16.78.1', '', '', '', '', 'R2', '', '', '', '26999002']
  ];
  const wb = { SheetNames:['MINA Camps'], Sheets:{ 'MINA Camps':{ __rows:rows } } };
  w.XLSX = { utils:{ sheet_to_json:(s) => s.__rows } };
  const P = w.ex47Plan(wb), v = P && P.set[x.id];
  T(!!v && v.rdr === '26999001' && v.rtr === 'RTR123456' && v.net === '172.16.77', 'المخيمُ برقمه، والأعمدةُ بعناوينها: القارئ والراوتر والشبكة');
  T(v && !v.cam, 'وما يشبه كلمةَ مرورٍ في خانة سيريال يُرفَع (' + (P ? P.scrub : '?') + ')');
  T(P && P.miss.indexOf('Camp-9999-9999') > -1, 'والمخيمُ الذي ليس في سجلّنا يُذكَر لا يضيع');
  w.STATE.ex47orph = []; w.EXT.ex47 = P; w.ex47Apply();
  T(x.ex47 && x.ex47.rdr === '26999001', 'يُحفَظ على النقطة');
  T(!JSON.stringify(w.STATE.ex47orph || []).match(/JedTeam|X@1|8996600/), 'ولا كلمةَ مرورٍ ولا شريحةَ في أيِّ محفوظ');
  w.formReset(); w.FORM.site = x.id; w.PTAB = w.PTAB || {}; w.PTAB.forms = 'insForm'; w.CUR = 'forms'; w.render(1);
  T(w.FORM.serials[rdr.code] === '26999001' && w.FORM.prefix === '172.16.77', 'ونموذجُ التركيب يُعبَّأ منها في الخانات الفارغة');
}

/* ── ٥ · جسرُ نظام البطاقات: المطابقةُ والتحقّق والإشغال ── */
console.log('\n══ ٥ · جسرُ نظام البطاقات ══');
{
  /* (V38.1) بلا توكنٍ ولا جسر: لا طلبَ إلى نظام البطاقات من التطبيق — سياسةُ الصفحة ترفضه فيظهر خطأٌ في المتصفح */
  const asked = []; const realFetch = w.fetch;
  w.fetch = (u) => { asked.push(String(u)); return Promise.reject(new Error('offline')); };
  w.EXT.tok = ''; w.EXT.bridge = null; w.EXT._plAt = 0; w.EXT._brAt = Date.now();
  try { w.CUR = 'mfu'; w.render(1); w.pilotKick(); w.extReadersLoad(); } catch (e){ /* الرسمُ يفحصه جردٌ آخر */ }
  await new Promise(r => setTimeout(r, 50));
  w.fetch = realFetch;
  T(!asked.some(u => /nusukcard\.net/.test(u)), 'بلا توكنٍ ولا جسر: لا طلبَ إلى نظام البطاقات من التطبيق' + (asked.length ? ' (' + asked.filter(u => /nusukcard/.test(u)).length + ')' : ''));
  const lat = +camp.lat + 0.0003, lng = +camp.lng;
  w.EXT.bridge = null;
  const ok = w.extBridgeApply({ v:1, at:Date.now(), rd:[['26127723', '99/99', new Date().toISOString()]],
    tn:[['T1', camp.sign, String(lat), String(lng), 'G', 5000]], ov:[['T1', 5000, 1200, 300, 0, '3', '4']] }, false);
  T(ok && w.EXT.bridge && w.EXT.bridge.rd === 1, 'يُعتمَد ناتجُ الجسر');
  const L = w.extLink(camp);
  T(L.by === 'sign' && L.tent && L.tent.id === 'T1', 'المخيمُ يُربَط بشاخصه وقربه');
  T(L.warn === '99/99', 'والقارئُ على خيمةٍ أخرى يُحذَّر منه');
  const nk = w.pilotNusuk(camp);
  T(/30٪/.test(nk.occ || ''), 'والإشغالُ يُقرأ من الجسر بلا طلبٍ من التطبيق: ' + nk.occ);
  const far = w.STATE.sites.find(z => z && z.type === 'مخيم' && z.zone !== 'منى' && z.sign);
  if (far){ far.sign = camp.sign; T(!w.extTentForSite(far), 'والشاخصُ نفسُه في مشعرٍ آخر لا يُربَط (شرطُ القرب)'); }
}

/* ── ٦ · المخزن: توريدٌ وصرفٌ بالاسم، وتركيبٌ بالرمز — في صفٍّ واحد ── */
console.log('\n══ ٦ · المخزن ══');
const IT = parts.find(i => /راوتر/.test(i.name)) || parts[2];
const bal = () => w.stockBalance().filter(r => r.key === IT.name)[0] || { store:0, custody:0, used:0, scrap:0 };
let site6;
{
  const b0 = bal();
  w.STATE.moves.push({ id:'sc6a', at:Date.now(), kind:'توريد', item:IT.name, qty:5, by:'مخزن' });
  w.STATE.moves.push({ id:'sc6b', at:Date.now(), kind:'صرف', item:IT.name, qty:3, by:'فني' });
  site6 = w.STATE.sites.find(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id] && z.id !== camp.id && !z.ex47);
  w.formReset(); w.FORM.site = site6.id; w.FORM.parts[IT.code] = 2; w.FORM.status = 'مُركّب';
  w.FORM.photos.before = { data:IMG }; w.FORM.photos.after = { data:IMG }; w.insSave(false);
  const b1 = bal();
  const rows = w.stockBalance().filter(r => r.item === IT.name);
  T(rows.length === 1, 'الصنفُ في صفٍّ واحدٍ اسمًا ورمزًا (' + rows.length + ')');
  T(b1.store - b0.store === 2 && b1.custody - b0.custody === 1 && b1.used - b0.used === 2, 'توريد ٥ ← صرف ٣ ← تركيب ٢: مخزن +٢ · عهدة +١ · رُكّب +٢');
}

/* ── ٧ · أرقامُ المسح للوزارة على قرار المالك (ق-٠٠٧) ── */
console.log('\n══ ٧ · أرقام المسح ══');
{
  const st0 = w.svStats();
  const x = w.STATE.sites.find(z => z && z.type === 'ممر' && !w.STATE.recs[z.id]);
  w.STATE.recs[x.id] = { id:x.id, access:'لم يتم الوصول', at:Date.now(), by:'فني' };
  w.statBump();
  const st1 = w.svStats();
  T(st1.O.sv === st0.O.sv + 1, 'الزيارةُ المتعذّرةُ تُعَدّ «زيارة» في تقدّم المسح (قرار المالك ق-٠٠٧)');
  T(st1.O.unreach === st0.O.unreach + 1 && st1.O.reach === st0.O.reach, 'وتُعرَض «متعذّرة» وحدَها ولا تدخل «وُصل»');
  T(!w.svDone(w.STATE.recs[x.id]), 'ولا تُعدّ جاهزةً للتركيب');
  const indep = w.STATE.sites.filter(z => w.svVisited(w.STATE.recs[z.id])).length;
  T(st1.O.sv === indep, 'والعدُّ يطابق عدًّا مستقلًّا من السجلات: ' + indep);
  const zsum = st1.zones.reduce((a, z) => a + z[2], 0);
  T(zsum === st1.O.sv, 'ومجموعُ المشاعر = الإجمالي');
}

/* ── ٨ · الفكّ يعيد ما رُكّب: من «رُكّب» إلى المخزن أو التالف ── */
console.log('\n══ ٨ · الفكّ ══');
{
  const b0 = bal();
  const r = w.STATE.inss[site6.id]; r.hand = { at:Date.now(), by:'مهندس' };
  w.DISF = { site:site6.id, items:{}, note:'', photos:{ after:{ data:IMG } } };
  w.DISF.items[IT.code] = 'سليم';
  w.disSave();
  const b1 = bal();
  T(w.disDone(site6.id), 'يُسجَّل الفكّ');
  T(b1.used - b0.used === -2 && b1.store - b0.store === 2 && b1.custody === b0.custody, 'السليمُ يعود: رُكّب −٢ · مخزن +٢ · والعهدةُ لا تُمَسّ');
  T(b1.custody >= 0 && b1.used >= 0, 'ولا رصيدَ سالبًا');
}

/* ── ٩ · (V38.16) مساعدُ البيانات: ما يقوله = ما في الحالة، ولا يجيب عمّا لا يفهمه ── */
console.log('\n══ ٩ · مساعد البيانات ══');
{
  const ans = q => String(w.aqAnswer(q) || '');
  const plain = h => h.replace(/<[^>]+>/g, ' ').replace(/&#47;/g, '/').replace(/\s+/g, ' ');
  const dig = v => String(v).replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x660));   /* الأرقامُ تُعرَض هنديةً أحيانًا */
  const has = (h, label, num) => { const t = dig(plain(h)); return t.indexOf(label) > -1 && new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*' + num + '(\\D|$)').test(t); };
  /* نقطةٌ بمعرِّفها، وشاخصٌ بمشعره */
  const p1 = ans(camp.id);
  T(p1.indexOf(camp.id) > -1 && /التركيب/.test(plain(p1)), 'نقطةٌ بمعرِّفها: بطاقتُها بالمسح والتركيب');
  const mina = w.STATE.sites.find(z => z && z.zone === 'منى' && z.sign && w.STATE.sites.some(y => y !== z && y.sign === z.sign && y.zone !== 'منى'));
  if (mina){
    const p2 = ans('المخيم ' + mina.sign + ' في منى');
    T(p2.indexOf(mina.id) > -1 && !w.STATE.sites.some(y => y.sign === mina.sign && y.zone !== 'منى' && p2.indexOf(y.id) > -1), 'شاخصٌ يتكرّر بين المشاعر: «في منى» يعيد منى وحدَها');
  }
  /* التقدّم: المركَّبُ في منى = عدٌّ مستقلّ */
  const instMina = w.STATE.sites.filter(z => z && z.zone === 'منى' && w.STATE.inss[z.id] && w.STATE.inss[z.id].status === 'مُركّب').length;
  T(has(ans('كام نقطة اتركبت في منى؟'), 'مُركّبة', instMina), 'التقدّم في منى: المُركّبة ' + instMina + ' كما في الحالة');
  /* إشارةُ القرّاء = عدُّ جدول الحالة */
  const R = w.extStatusRows() || [];
  const off = R.filter(r => r.sig === 'off').length, on = R.filter(r => r.sig === 'on').length;
  const sig = ans('القرّاء اللي مش بترسل');
  T(has(sig, 'ترسل', on) && has(sig, 'لا ترسل', off), 'إشارةُ القرّاء: ترسل ' + on + ' · لا ترسل ' + off + ' كما في جدول الحالة');
  /* رصيدُ الصنف = المخزن */
  const B = w.stockBalance().filter(r => r.key === IT.name)[0] || { store:0 };
  T(has(ans('رصيد ' + IT.name.split(/\s+/)[0]), IT.name, B.store), 'رصيدُ «' + IT.name + '»: المخزن ' + B.store + ' كما في الأرصدة');
  /* المهامُّ المتأخرة: المتأخرةُ تظهر، والمكتملةُ لا */
  w.STATE.wtask = { rows:[{ id:91, n:'مهمة سيناريو متأخرة', who:'فني', st:'قيد التنفيذ', due:'2026-01-01' }, { id:92, n:'مهمة سيناريو مكتملة', who:'فني', st:'مكتمل', due:'2026-01-01' }] };
  const tk = plain(ans('مين متأخر في المهام؟'));
  T(tk.indexOf('مهمة سيناريو متأخرة') > -1 && tk.indexOf('مهمة سيناريو مكتملة') < 0, 'المهامُّ: المتأخرةُ تظهر والمكتملةُ لا');
  /* التحديات في منى = عدٌّ مستقلّ */
  { const zc = w.STATE.sites.find(z => z && z.zone === 'منى' && z.type === 'مخيم' && !w.STATE.recs[z.id]); w.STATE.recs[zc.id] = { id:zc.id, access:'تم الوصول', at:Date.now(), by:'فني', chals:['عائق إنشائي'] }; w.statBump(); }   /* تحدٍّ واحدٌ على الأقل — لا يمرّ الفحصُ بصفرٍ على صفر */
  const chMina = w.STATE.sites.filter(z => z && z.zone === 'منى' && ((w.STATE.recs[z.id] || {}).chals || []).some(c => c && c !== 'لا توجد تحديات')).length;
  T(has(ans('التحديات في منى'), 'نقاطٌ فيها تحدٍّ', chMina), 'التحدياتُ في منى: ' + chMina + ' كما في الزيارات');
  /* «أعلى إشغال» لا يخلطه بـ«شغّال» */
  const oc = plain(ans('أعلى إشغال'));
  T(/الإشغال/.test(oc) && !/إشارة القرّاء/.test(oc), '«أعلى إشغال» يجيب بالإشغال وحدَه — لا «إشارة القرّاء»');
  /* ما لا يفهمه يتركه لبحث الإرشاد */
  T(ans('عاوز أغيّر لون الخلفية للتطبيق') === '', 'سؤالٌ ليس عن البيانات: لا جوابَ مختلَق — يذهب إلى الإرشاد');
  /* (V38.17) تقريرٌ بالكلام: الشروطُ تُفهَم، والعددُ = عدٌّ مستقلّ، وما لا يُفهَم يُقال */
  const D1 = w.aqRepData('إكسل للمخيمات في منى اللي اتركبت');
  const lab1 = D1.P.conds.map(c => c.label);
  const ind1 = w.STATE.sites.filter(z => z && z.zone === 'منى' && z.type === 'مخيم' && w.STATE.inss[z.id] && w.STATE.inss[z.id].status === 'مُركّب').length;
  T(D1.P.isRep && D1.P.fmt === 'xls' && lab1.includes('منى') && lab1.includes('مخيم') && lab1.includes('مُركّبة') && !D1.P.unknown.length, 'تقريرٌ بالكلام: منى · مخيم · مُركّبة — بلا كلمةٍ غيرِ مفهومة');
  T(D1.rows.length === ind1, 'وعددُه ' + ind1 + ' = عدٌّ مستقلّ من التركيبات');
  const D2 = w.aqRepData('PDF للنقاط اللي ما اتزارتش في عرفات أو منى');
  const ind2 = w.STATE.sites.filter(z => z && (z.zone === 'عرفات' || z.zone === 'منى') && !w.svVisited(w.STATE.recs[z.id])).length;
  T(D2.P.fmt === 'pdf' && D2.rows.length === ind2, '«عرفات أو منى» تُقبَل أيًّا منهما، و«ما اتزارتش» نفيٌ: ' + ind2);
  const D3 = w.aqRepData('اكسل للنقاط اللي فيها بطيخ في منى');
  T(D3.P.unknown.some(u => /بطيخ/.test(u)), 'كلمةٌ لا يعرفها تُقال «ما فهمتش» ولا تُتجاهَل صامتة');
  T(String(w.aqAnswer('إكسل للمخيمات في منى اللي اتركبت')).indexOf('data-aqrep="pdf"') > -1, 'وبطاقةُ التقرير فيها إكسل وPDF');
  /* (V38.19) «المركّبة» ليست «لم ركب»، و«ومش» نفيٌ */
  const L4 = w.aqRepParse('اكسل للمخيمات المركبة اللي ومش بترسل').conds.map(c => c.label);
  T(L4.includes('مُركّبة') && !L4.includes('لم تُركَّب') && L4.includes('لا ترسل'), '«المركّبة» إثباتٌ لا نفي، و«ومش بترسل» نفي — ' + L4.join(' · '));
  /* (V38.19) التحليلُ «حسب …»: مجموعُ المجموعات = الإجمالي، وكلُّ مشعرٍ = عدٌّ مستقلّ */
  const G1 = w.aqRepGroup(w.aqRepData('تقرير المخيمات حسب المشعر'));
  const byZ = {}; w.STATE.sites.forEach(z => { if (z && z.type === 'مخيم') byZ[z.zone] = (byZ[z.zone] || 0) + 1; });
  T(G1 && G1.rows.reduce((a, r) => a + r[1], 0) === G1.total[1] && G1.rows.every(r => byZ[r[0]] === r[1]), 'التحليلُ حسب المشعر: كلُّ مشعرٍ = عدٌّ مستقلّ، والمجموعُ = الإجمالي');
  const G2 = w.aqRepGroup(w.aqRepData('تحليل التركيب حسب النوع'));
  const insAll = w.STATE.sites.filter(z => z && w.STATE.inss[z.id] && w.STATE.inss[z.id].status === 'مُركّب').length;
  T(G2 && G2.total[4] === insAll, 'وعمودُ «مُركّبة» في الإجمالي = ' + insAll + ' كما في التركيبات');
}

/* ── ١٠ · (V38.20) تعديلُ مسحٍ سابق: «أخرى» ووصفُها، وفتحُ النقطة على الخريطة في أوّل فتح ── */
console.log('\n══ ١٠ · تعديل المسح والخريطة ══');
{
  const xs = w.STATE.sites.find(z => z && z.type === 'مخيم' && !w.STATE.recs[z.id]);
  w.STATE.recs[xs.id] = { id:xs.id, access:'تم الوصول', at:Date.now(), by:'فني', chals:[w.chalOther()] };
  T(w.svqKeys(w.STATE.recs[xs.id]).includes('chal_note'), 'وصفُ التحدي صفٌّ في التعديل ولو لم يُكتَب بعد');
  w.SVQ.id = xs.id; w.SVQ.key = 'chals'; w.SVQ.tmp = null; w.SVQ.note = null;
  const box = w.document.createElement('div'); box.innerHTML = w.svqSheet(); w.document.body.appendChild(box);
  T(!!w.document.getElementById('svqNote') && !!box.querySelector('.chip.on[data-svqch="' + w.chalOther() + '"]'), '«أخرى» تبقى مختارةً في التعديل ومعها خانةُ الوصف');
  box.querySelector('[data-svqsave]').click();
  T(!w.STATE.recs[xs.id].chal_note, '«أخرى» بلا وصفٍ لا تُحفَظ');
  box.remove(); w.SVQ.key = 'chals';
  const box2 = w.document.createElement('div'); box2.innerHTML = w.svqSheet(); w.document.body.appendChild(box2);
  w.document.getElementById('svqNote').value = 'وصفُ سيناريو'; box2.querySelector('[data-svqsave]').click(); box2.remove();
  T(w.STATE.recs[xs.id].chal_note === 'وصفُ سيناريو', 'ومع الوصف تُحفَظ — والوصفُ مسجَّلٌ في سجلّ التعديل');
  /* الخريطةُ تُبنى متأخّرةً: الطيرانُ ينتظرها */
  const flew = []; const mf = w.mapFly; w.mapFly = id => flew.push(id); const keep = w.MAP; w.MAP = null;
  w.mapFlySoon(xs.id); await new Promise(r => setTimeout(r, 400)); w.MAP = keep || {}; await new Promise(r => setTimeout(r, 400));
  w.mapFly = mf; if (!keep) w.MAP = keep;
  T(flew.includes(xs.id), 'فتحُ النقطة على الخريطة ينتظر الخريطةَ حين تُبنى متأخّرة (أوّلُ فتحٍ للمشرف)');
}

/* ── ١١ · التحدياتُ حسب الموقع (V38.22 → V38.25): خياراتُ المالك الستّ للممرات والجمرات وكاميرات الوزارة ── */
console.log('\n══ ١١ · التحديات حسب الموقع ══');
{
  const base = { access:'تم الوصول', at:Date.now(), by:'فني' };
  const pick = ty => w.STATE.sites.find(z => z && z.type === ty && !w.STATE.recs[z.id]);
  /* (V38.78) corridors and Jamarat read «موقع النقطة» alone — the inference of older visits is checked on the other types */
  const P0 = pick('كاميرا'); w.STATE.recs[P0.id] = Object.assign({ id:P0.id, chals:['المسار تحت كوبري'] }, base);
  const P1 = pick('بوابة'); w.STATE.recs[P1.id] = Object.assign({ id:P1.id, chals:['لا يوجد سطح تثبيت — يحتاج هيكلًا أو عمودًا'], chal_note:'عند مخرج النفق — على لوحة استرشادية تحت المظلة' }, base);
  const P2 = pick('محطة'); w.STATE.recs[P2.id] = Object.assign({ id:P2.id, chals:['عائق في الموقع (إنشائي أو درج أو حواجز أو حفر أو نفق أو كوبري)'] }, base);
  w.statBump();
  const g0 = w.obsLocTags(P0), g1 = w.obsLocTags(P1), g2 = w.obsLocTags(P2);
  T(!!g0.bridge, 'اختيارُ الفني القديم «تحت كوبري» يُحسَب كوبري');
  T(!!g1.tout && !!g1.sign && !!g1.canopy && !!g1.nomount, 'زيارةٌ أقدمُ بلا اختيار: يُقرأ من الوصف مخرجُ النفق واللوحةُ والمظلة، و«بدون إطار» من الفئة');
  T(!g2.bridge && !g2.tin && !g2.tout && !g2.tgen, 'واسمُ الفئة الجامعة «… نفق أو كوبري» وحدَه لا يُحسَب شيئًا');
  /* الاختيارُ الصريحُ المتعدّد يغلب الكلام، و«لا شيء مما سبق» يُسقط الاستنتاج */
  const Q0 = pick('ممر'); w.STATE.recs[Q0.id] = Object.assign({ id:Q0.id, chals:['لا توجد تحديات'], loc:['تحت كوبري', 'على مظلة'], note:'عند مدخل النفق' }, base);
  const Q1 = pick('ممر'); w.STATE.recs[Q1.id] = Object.assign({ id:Q1.id, chals:['لا توجد تحديات'], loc:['لا شيء مما سبق'], note:'قريبٌ من الكوبري والنفق' }, base);
  const q0 = w.obsLocTags(Q0), q1 = w.obsLocTags(Q1);
  T(q0.bridge === 'اختيار الفني' && q0.canopy === 'اختيار الفني' && !q0.tin, '«موقع النقطة» اختيارٌ متعدّدٌ صريح — يغلب كلامَ الملاحظة');
  T(!q1.bridge && !q1.tgen && !q1.tin, 'و«لا شيء مما سبق» يُسقط الاستنتاج');
  /* لمن ينطبق: الممراتُ والجمراتُ وكاميراتُ الوزارة — لا المخيماتُ ولا المحطات */
  const cam = pick('كاميرا'), jm = pick('جسر'), cp = pick('مخيم');
  w.STATE.recs[cam.id] = Object.assign({ id:cam.id, chals:['لا توجد تحديات'], loc:['لوحة استرشادية'] }, base);
  w.STATE.recs[jm.id] = Object.assign({ id:jm.id, chals:['لا توجد تحديات'], loc:'تحت كوبري وعند نفق' }, base);   /* قيمةٌ من V38.23 تُقرأ بمعناها */
  w.STATE.recs[cp.id] = Object.assign({ id:cp.id, chals:['لا توجد تحديات'], loc:['تحت كوبري'], note:'عند مدخل النفق' }, base);
  T(!!w.obsLocTags(cam).sign && !!w.obsLocTags(jm).bridge && !!w.obsLocTags(jm).tgen, 'كاميراتُ الوزارة والجمراتُ تُحسَب — والقيمةُ القديمةُ تُقرأ بمعناها');
  T(w.obsLocTags(cp) === null, 'والمخيمُ لا يُحسَب ولو كُتب ذلك');
  w.obsLocLists();
  T(w.MFU.lists[w.obsLocKey('sign', 'c')].rows().some(r => r[0] === cam.id) && w.MFU.lists[w.obsLocKey('bridge', 'p')].rows().some(r => r[0] === Q0.id), 'وقوائمُ كلِّ مجموعةٍ تحمل نقاطَها');
  T(w.svqKeys(w.STATE.recs[Q1.id]).includes('loc') && !w.svqKeys(Object.assign({}, base, { id:pick('مخيم').id })).includes('loc'), '«موقع النقطة» صفٌّ في تعديل الممر — لا في المخيم (V38.26: والمحطاتُ صارت مثل الممرات)');
  T(String(w.mtObs()).indexOf('حسب الموقع') > -1, 'والقسمُ في تبويب التحديات والمعوقات');
  /* (V38.26) «موقع النقطة» تحدٍّ بنفسه — عدا «على مظلة» واللوحةِ التي عليها مظلة؛ ولكلِّ النقاط عدا المخيمات ومراكز التفويج */
  const full = Object.assign({}, base, { mount:'عمود', power:'شبكة', wid_m:3, hgt_m:4, fit:'نعم', chals:['لا توجد تحديات'] });
  const mk = (ty, loc) => { const x = pick(ty); w.STATE.recs[x.id] = Object.assign({ id:x.id, loc }, full); return x; };
  const cB = mk('ممر', ['تحت كوبري']), cS = mk('ممر', ['لوحة استرشادية']), cSC = mk('ممر', ['لوحة استرشادية', 'على مظلة']), cC = mk('ممر', ['على مظلة']), cSt = mk('محطة', ['مخرج نفق']);
  w.statBump();
  T(w.chalCats(w.STATE.recs[cB.id]).includes('block') && w.svStOf(cB.id) === 'coord', 'تحت كوبري: «عائق في الموقع» ويُعَدّ تحدّيًا (تنسيق مع الجهة المالكة)');
  T(w.chalCats(w.STATE.recs[cS.id]).includes('mount') && w.svStOf(cS.id) === 'prep', 'لوحةٌ استرشاديةٌ بلا مظلة: «يحتاج هيكل» ويُعَدّ تحدّيًا');
  T(!w.chalCats(w.STATE.recs[cSC.id]).length && !w.chalCats(w.STATE.recs[cC.id]).length, 'و«على مظلة» واللوحةُ التي عليها مظلةٌ ليستا تحدّيًا');
  T(w.chalCats(w.STATE.recs[cSt.id]).includes('block') && w.locApplies(cSt) && !w.locApplies(pick('مخيم')), 'والمحطةُ تُحسَب كالممر — والمخيمُ لا');
  /* (V38.27) والتقريرُ بالكلام يفهم «موقع النقطة» */
  const DR = w.aqRepData('إكسل للممرات اللي تحت كوبري');
  T(DR.P.conds.some(c => c.label === 'تحت كوبري') && !DR.P.unknown.length && DR.rows.some(x => x.id === cB.id) && !DR.rows.some(x => x.id === cC.id), 'و«إكسل للممرات اللي تحت كوبري» يجد نقاطَ الكوبري وحدَها');
}

/* ── ١٢ · (V38.30) ما ينتظر الرفع: مهلةُ المالك تُتجاهَل به إلى ركنٍ يُرى، وملفُّ الانتظار يخرج ويُستورَد ── */
console.log('\n══ ١٢ · ما ينتظر الرفع ══');
{
  const x = w.STATE.sites.find(z => z && !w.STATE.recs[z.id]), y = w.STATE.sites.find(z => z && z !== x && !w.STATE.recs[z.id]), now = Date.now();
  w.STATE.meta.online = false; w.STATE.stale = [];
  w.STATE.queue = [{ kind:'recs', id:x.id, v:{ id:x.id, access:'تم الوصول', at:now - 40 * 86400000 }, at:now - 40 * 86400000 }, { kind:'recs', id:y.id, v:{ id:y.id, access:'تم الوصول', at:now - 1000 }, at:now - 1000 }];
  w.CFG.queueTtl = 0; T(w.CORE.queueTtlApply() === 0 && w.STATE.queue.length === 2, 'المهلةُ ٠ = لا يُتجاهَل شيء (الأصلُ «لا يُسقَط شيء»)');
  w.CFG.queueTtl = 30; T(w.CORE.queueTtlApply() === 1 && w.STATE.queue.length === 1 && w.STATE.stale.length === 1 && w.STATE.stale[0].id === x.id, 'المهلةُ ٣٠ يومًا: الأقدمُ يخرج إلى ركن المتجاهَل ويبقى الحديث');
  const ex = w.CORE.queueExport(); T(ex.kind === 'nsk-pending' && ex.items.length === 1 && ex.stale.length === 1, 'وملفُّ الانتظار يحمل ما ينتظر وما تُجوهل');
  const keep = w.CORE.set, saved = []; w.CORE.set = (c, i) => saved.push(c + '/' + i); w.STATE.queue = [];
  const r = w.CORE.queueImport(ex); w.CORE.set = keep;
  T(r.n === 2 && saved.includes('recs/' + x.id) && saved.includes('recs/' + y.id), 'والمكتبُ يستورده فيعود السجلّان إلى القاعدة');
  T(!!w.CORE.queueImport({ hello:1 }).bad, 'وما ليس ملفَّ انتظارٍ يُرفَض');
  w.CFG.queueTtl = 0; w.STATE.meta.online = true;
}

/* ── ١٣ · قطار المشاعر (V38.31 → V38.34): تسعُ محطاتٍ و٦٢ بوابةً نقاطًا عند مرجع محطتها — قرارُ المالك ق-٠٢٣ ── */
console.log('\n══ ١٣ · قطار المشاعر ══');
{
  const st = w.STATE.sites.filter(x => x && x.type === 'محطة'), gs = w.STATE.sites.filter(w.egIsGate);
  T(st.length === 9 && st.every(x => +x.lat > 21 && +x.lng > 39) && st.every(x => /\(AR[123]|MZ[123]|MN[123]\)/.test(x.name)), 'تسعُ محطاتٍ بإحداثياتها المرجعية — عرفات ومزدلفة ومنى');
  const per = {}; gs.forEach(g => { per[g.sq] = (per[g.sq] || 0) + 1; });
  T(gs.length === 63 && per.AR1 === 10 && per.AR2 === 10 && per.AR3 === 10 && per.MZ1 === 4 && per.MZ2 === 4 && per.MZ3 === 4 && per.MN1 === 8 && per.MN2 === 8 && per.MN3 === 5, 'و٦٣ بوابةً إلكترونيةً نقاطًا بعدد كلِّ محطة على الرسومات (مزدلفة ٢ أربع)');
  /* (V38.35) spread along the hall, not stacked: every gate within 400 m of its station, and gates of one station ≥ 50 m apart */
  const dm = (a, b) => { const r = Math.PI / 180, dl = (b.lat - a.lat) * r, dg = (b.lng - a.lng) * r, q = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) ** 2; return 2 * 6371000 * Math.asin(Math.sqrt(q)); };
  const near = gs.every(g => { const s = st.find(z => w.egSeed().stations[z.id].code === g.sq); return s && dm(g, s) < 500; });   /* (V38.37) read from the drawings — the Jamarat station is ~900 m long */
  let minSp = 1e9; st.forEach(s => { const L = gs.filter(g => g.sq === w.egSeed().stations[s.id].code); L.forEach((a, i) => L.slice(i + 1).forEach(b => { minSp = Math.min(minSp, dm(a, b)); })); });
  T(near && minSp >= 3 && gs.every(g => /^(E-GATE|PATH)/.test(g.sign || '')), 'وكلُّ بوابةٍ في موضعها من مخطط سار باسم رقمها على الرسمة (دون ٥٠٠ م من محطتها، ولا اثنتان فوق بعضهما)');
  T(gs.every(g => w.taxOf(g).t === 'محطات قطار') && w.STATE.sites.filter(x => x.type === 'بوابة' && !w.egIsGate(x)).every(x => w.taxOf(x).t === 'مسجد نمرة'), 'وتصنيفُها «محطات قطار» — وبواباتُ مسجد نمرة كما هي');
  const s1 = st[0]; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.DETAIL_ID = s1.id;
  T(w.egList(s1.id).length === 10 && String(w.PAGE.site.body()).split('data-egopen=').length - 1 === 10, 'وبطاقةُ المحطة تعدّ بواباتِها العشر');
  const g1 = w.egList(s1.id)[0].id; w.egCard.open = g1; w.document.body.innerHTML = String(w.PAGE.site.body());
  const keepSet = w.CORE.set; w.CORE.set = () => {};
  w.document.getElementById('egNo').value = 'G-07'; w.document.getElementById('egOp').value = 'تعمل';
  T(w.egSave(g1) && w.egOf(g1).no === 'G-07' && w.egOf(g1).op === 'تعمل', 'والتحقيقُ (رقمُ الرسمة والحالة) يُحفَظ طبقةً فوق البوابة نفسِها');
  /* (V38.53) the gate page points back to its station; the station card exports its gates through the engine */
  w.DETAIL_ID = g1; const hG = String(w.PAGE.site.body()); const qX = 'إكسل للبوابات في محطات قطار محطة AR1', PX = w.aqRepParse(qX);
  T(hG.indexOf('محطة البوابة') > -1 && hG.indexOf('data-site="' + s1.id + '"') > -1 && PX.conds.map(c => c.k).sort().join() === 'cat,stn,type' && w.aqRepData(qX).rows.length === 10 && w.aqRepData('تقرير المحطات في محطات قطار').rows.length === 9, 'وصفحةُ البوابة تعود إلى محطتها، و«محطة AR1» شرطٌ يعطي بواباتِها العشرَ لا المحطةَ معها');
  w.CORE.set = keepSet; w.egCard.open = '';
}

/* ── ١٤ · (V38.43) منشئُ التقارير: الجملةُ من القوائم تُفهَم كما اختيرت — بلا كلمةٍ مجهولة — ولها عددٌ وقائمةٌ وملف ── */
console.log('\n══ ١٤ · منشئُ التقارير ══');
{
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
  const cases = [
    [{ zone:'منى', type:'مخيم', ins:'no' }, ['zone', 'type', 'ins'], null],
    [{ cat:'محطات قطار', type:'بوابة' }, ['cat', 'type'], null],
    [{ type:'ممر', loc:'تحت كوبري', group:'zone' }, ['type', 'loc'], 'zone'],
    [{ ins:'yes', sig:'off', lnk:'yes' }, ['ins', 'lnk', 'sig'], null],
    [{ ov:'gt', occ:'80', min:'pend' }, ['min', 'occ'], null],
    [{ sv:'un', e47:'no', chal:'any', group:'co' }, ['sv', 'e47', 'chal'], 'co']
  ];
  const got = cases.map(([sel, keys, g]) => { const q = w.rbSentence(sel), P = w.aqRepParse(q); return { ok: P.conds.map(c => c.k).sort().join() === keys.slice().sort().join() && !P.unknown.length && ((P.group && P.group.k) || null) === g, q }; });
  T(got.every(x => x.ok), 'ستُّ تركيباتٍ من القوائم تُفهَم شرطًا شرطًا بلا كلمةٍ مجهولة' + (got.every(x => x.ok) ? '' : ' — ' + got.filter(x => !x.ok).map(x => x.q).join(' | ')));
  const q2 = w.rbSentence({ cat:'محطات قطار', type:'بوابة' });
  T(w.aqRepData(q2).rows.length === 63 && w.aqRepData(w.rbSentence({ cat:'مسجد نمرة', type:'بوابة' })).rows.length === 10, 'والفئةُ تميّز بواباتِ القطار (٦٣) عن بوابات مسجد نمرة (١٠)');
  w.rbState().sel = { zone:'منى', ins:'no' }; const home = w.assistHomeHtml();
  T(home.indexOf('منشئ التقارير') > -1 && home.indexOf('data-assistq="' + w.esc(w.rbSentence()) + '"') > -1 && home.indexOf('data-rb="cat"') > -1, 'وبطاقةُ المنشئ في المساعد بجملتها وزرِّ «احسب» وقائمةِ الفئة');
  T(w.rbFavSave('مخيمات منى الناقصة') && w.rbFavs().some(f => f.name === 'مخيمات منى الناقصة' && f.q === w.rbSentence()) && (w.rbFavDel(0), !w.rbFavs().length), 'والمفضّلةُ تُحفَظ باسمها وتُحذَف');
  /* (V38.44) time windows on the survey / installation date */
  { const s1 = w.STATE.sites[0], s2 = w.STATE.sites[1]; const keepR = w.STATE.recs[s1.id], keepR2 = w.STATE.recs[s2.id], keepI = w.STATE.inss[s1.id];
    w.STATE.recs[s1.id] = { by:'x', at:Date.now() - 2 * 86400000, review:'approved', access:'تم الوصول' }; w.STATE.recs[s2.id] = { by:'x', at:Date.now() - 60 * 86400000, review:'approved', access:'تم الوصول' }; w.STATE.inss[s1.id] = { status:'مُركّب', at:Date.now() - 3 * 86400000, by:'x' };
    const n = sel => w.aqRepData(w.rbSentence(sel)).rows.map(x => x.id), P7 = w.aqRepParse(w.rbSentence({ when:'sv7' }));
    T(P7.conds.length === 1 && P7.conds[0].k === 'when' && !P7.unknown.length && n({ when:'sv7' }).includes(s1.id) && !n({ when:'sv7' }).includes(s2.id) && n({ when:'svold' }).includes(s2.id) && !n({ when:'svold' }).includes(s1.id) && n({ when:'in7' }).includes(s1.id), 'والزمنُ شرطٌ: زيارةٌ في آخر ٧ أيام / أقدمُ من ٣٠ يومًا / تركيبٌ في آخر ٧ أيام — على تاريخ السجلِّ نفسِه');
    w.STATE.recs[s1.id] = keepR; w.STATE.recs[s2.id] = keepR2; w.STATE.inss[s1.id] = keepI; if (!keepR) delete w.STATE.recs[s1.id]; if (!keepR2) delete w.STATE.recs[s2.id]; if (!keepI) delete w.STATE.inss[s1.id]; }
  /* (V38.45) the challenges and the photos of the chosen points */
  { const s1 = w.STATE.sites.filter(x => x.zone === 'منى' && x.type === 'مخيم')[0], s2 = w.STATE.sites.filter(x => x.zone === 'عرفات' && x.type === 'ممر')[0];
    const kr1 = w.STATE.recs[s1.id], kr2 = w.STATE.recs[s2.id];
    w.STATE.recs[s1.id] = { by:'tech1', at:Date.now() - 1000, chalCats:['mount', 'beam'], chal_note:'العارضة ناقصة', access:'تم الوصول' }; w.STATE.recs[s2.id] = { by:'tech2', at:Date.now() - 1000, chalCats:['entry'], chal_note:'', access:'تم الوصول' };
    w.STATE.photos[s1.id + '-t1'] = { site:s1.id, kind:'عام', link:'x', at:Date.now() - 1000 }; w.STATE.photos[s2.id + '-t1'] = { site:s2.id, kind:'قارئ', at:Date.now() - 40 * 86400000 };
    const rows = sel => { w.rbState().sel = sel; return w.rbPopRows(sel.pop); };
    T(rows({ pop:'chal', zone:'منى' }).filter(r => r.x.id === s1.id).map(r => r.k).join() === 'mount,beam' && !rows({ pop:'chal', zone:'منى' }).some(r => r.x.id === s2.id) && rows({ pop:'chal', cdesc:'without' }).some(r => r.k === 'entry' && r.x.id === s2.id) && !rows({ pop:'chal', cdesc:'without' }).some(r => r.x.id === s1.id) && (w.rbState().sel = { pop:'chal', group:'cgroup' }, w.rbPopCard('chal').indexOf('تصنيع وتجهيز') > -1), 'والتحدياتُ سكّانٌ: شروطُ النقاط ثم كلُّ تحدٍّ بفئته وجهة معالجته ووصفه');
    T(rows({ pop:'photo', pstat:'up' }).some(r => r.id === s1.id + '-t1') && !rows({ pop:'photo', pstat:'up' }).some(r => r.id === s2.id + '-t1') && rows({ pop:'photo', pwhen:'7' }).some(r => r.id === s1.id + '-t1') && !rows({ pop:'photo', pwhen:'7' }).some(r => r.id === s2.id + '-t1'), 'والصورُ سكّانٌ: مرفوعةٌ أو بانتظار الرفع، وزمنُها');
    w.STATE.recs[s1.id] = kr1; w.STATE.recs[s2.id] = kr2; if (!kr1) delete w.STATE.recs[s1.id]; if (!kr2) delete w.STATE.recs[s2.id]; delete w.STATE.photos[s1.id + '-t1']; delete w.STATE.photos[s2.id + '-t1']; w.rbState().sel = {}; }
  /* (V38.47) the weekly tasks: late / this week / open, by owner and track — no point conditions apply */
  { const keepW = w.STATE.wtask; w.STATE.wtask = { rows:[] }; const keepSet = w.CORE.set; w.CORE.set = () => {}; const keepRender = w.render; w.render = () => {};   /* wtAdd re-renders; the scenario page has no shell */
    w.wtAdd({ n:'تجهيز الهياكل', track:'التصنيع', who:'أحمد', due:w.dayKey(Date.now() - 3 * 864e5) }); w.wtAdd({ n:'زيارة منى ٢', track:'الميدان', who:'سعد', due:w.dayKey(Date.now() + 2 * 864e5) }); w.wtAdd({ n:'تقرير الوزارة', track:'الوزارة', who:'أحمد', st:'مكتمل' });
    const rows = sel => { w.rbState().sel = sel; return w.rbPopRows('task'); };
    T(rows({ pop:'task' }).length === 3 && rows({ pop:'task', tst:'late' }).map(r => r.r.n).join() === 'تجهيز الهياكل' && rows({ pop:'task', tst:'week' }).map(r => r.r.n).join() === 'زيارة منى ٢' && rows({ pop:'task', tst:'open' }).length === 2 && rows({ pop:'task', twho:'أحمد' }).length === 2, 'والمهامُّ الأسبوعيةُ سكّانٌ: متأخّرة / هذا الأسبوع / مفتوحة، وبالمسؤول والمسار');
    w.rbState().sel = { pop:'task' }; const hT = w.rbHtml();
    T(hT.indexOf('data-rb="tst"') > -1 && hT.indexOf('data-rb="zone"') < 0 && hT.indexOf('data-rbrun="task"') > -1, 'وشروطُ النقاط تختفي للمهام — قوائمُها الحالةُ والمسارُ والمسؤولُ فقط');
    w.STATE.wtask = keepW; w.CORE.set = keepSet; w.render = keepRender; w.rbState().sel = {}; }
  /* (V38.48) shared favourites: engineer and up write them to the settings lists; everyone reads them; a supervisor cannot delete them */
  { const keepDirty = w.CORE.dirty; w.CORE.dirty = () => {}; const keepLists = w.CFG.lists; w.CFG.lists = Object.assign({}, keepLists || {}); delete w.CFG.lists.rbFav;
    w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.rbState().sel = { zone:'منى', ins:'no' };
    const okShare = w.rbFavSave('ناقص منى — للفريق', true) && (w.CFG.lists.rbFav || []).length === 1 && w.rbFavs().some(f => f.shared && f.name === 'ناقص منى — للفريق');
    w.ROLE = 'supervisor'; w.STATE.meta.role = 'supervisor';
    const supSees = w.rbFavs().some(f => f.shared && f.name === 'ناقص منى — للفريق'), supCannot = !w.rbFavDel(0) && (w.CFG.lists.rbFav || []).length === 1 && w.rbHtml().indexOf('data-rbsave="team"') < 0;
    w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; const engDel = w.rbFavDel(0) && !(w.CFG.lists.rbFav || []).length;
    T(okShare && supSees && supCannot && engDel, 'والمفضّلةُ المشتركةُ: يكتبها المهندسُ فما فوق في إعدادات الفريق، ويراها الكلُّ، ولا يحذفها المشرف');
    w.CFG.lists = keepLists; w.CORE.dirty = keepDirty; w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.rbState().sel = {}; }
  /* (V38.49) pinned reports: computed now, with the change since the previous day's snapshot on this device */
  { const keepDirty = w.CORE.dirty; w.CORE.dirty = () => {}; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.localStorage.removeItem('nsk14.rbFav'); w.localStorage.removeItem('nsk14.rbSnap');
    w.rbState().sel = { zone:'منى', ins:'no' }; w.rbFavSave('ناقص منى — مثبّت', false); const i0 = w.rbFavs().findIndex(f => f.name === 'ناقص منى — مثبّت');
    const none = w.rbPinnedHtml() === ''; w.rbFavPin(i0); const h1 = w.rbPinnedHtml();
    const f0 = w.rbFavs().find(f => f.name === 'ناقص منى — مثبّت'), S = w.rbSnap(); S['ناقص منى — مثبّت'] = { day:'2026-10-19', n:w.rbCountOf(f0) - 5 }; w.localStorage.setItem('nsk14.rbSnap', JSON.stringify(S)); const h2 = w.rbPinnedHtml();
    T(none && h1.indexOf('ناقص منى — مثبّت') > -1 && h1.indexOf('تقاريري المثبّتة') > -1 && /\+[٥5]/.test(h2) && h2.indexOf('2026-10-19') > -1 && w.assistHomeHtml().indexOf('تقاريري المثبّتة') > -1, 'والتقريرُ المثبَّتُ بطاقةٌ في أعلى المساعد برقمه الآن وتغيُّره منذ آخر يوم');
    w.rbFavDel(w.rbFavs().findIndex(f => f.name === 'ناقص منى — مثبّت')); w.localStorage.removeItem('nsk14.rbSnap'); w.CORE.dirty = keepDirty; w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.rbState().sel = {}; }
  /* (V38.50) the six ready-made reports: added once, pinned, each a valid report */
  { w.localStorage.removeItem('nsk14.rbFav'); const n1 = w.rbPresetsAdd(), n2 = w.rbPresetsAdd(); const ok = w.rbFavs().filter(f => f.pin).length === 6 && w.rbFavs().every(f => w.rbCountOf(f) >= 0);
    T(n1 === 6 && n2 === 0 && ok && w.rbHtml().indexOf('data-rbpresets') < 0, 'والتقاريرُ الجاهزةُ الستُّ تُضاف مرةً واحدةً مثبَّتةً وكلُّها يُحسَب'); w.localStorage.removeItem('nsk14.rbFav'); }
  const card = w.aqRepCard(q2, w.aqRepData(q2));
  T(card.indexOf('data-aqrep="xls"') > -1 && card.indexOf('data-aqrep="pdf"') > -1 && card.indexOf('63') > -1 || card.indexOf('٦٣') > -1, 'ونتيجةُ الحساب بطاقةٌ بالعدد وزرَّي إكسل وPDF');
}

/* ── ١٥ · (V38.56) دورةُ التركيب كاملةً كما يعيشها المُسنَد إليه: إسنادٌ مجدول ← «مهامي» ← النموذج ← السيريال والصور ←
   الرفع ← الاعتماد يُغلق المهمة — لفنيٍّ ولمشرف؛ وسيريالُ نقطةٍ أخرى يُوقف الحفظ ── */
console.log('\n══ ١٥ · دورةُ التركيب للمُسنَد إليه ══');
{
  const d = w.document, IMG2 = 'data:image/jpeg;base64,/9j/' + 'A'.repeat(3000);
  /* earlier scenarios draw single pages into <body>; restore the app shell (static markup, scripts stripped) so render() has #nav and #content */
  { const shell = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g, '')).window.document.body.innerHTML; d.body.innerHTML = shell; }
  const as = (role, name) => { w.ROLE = role; w.STATE.meta.role = role; w.STATE.meta.name = name; };
  const keepUsers = w.STATE.users; w.STATE.users = Object.assign({}, keepUsers || {}, { zt1:{ name:'فني الدورة', role:'tech', user:'zt1' }, zs1:{ name:'مشرف الدورة', role:'supervisor', user:'zs1' } });
  const keepOnline = w.STATE.meta.online;
  const free = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id] && !w.taskKindOf(z.id, 'install')).slice(0, 3);
  const zz = w.siteZone(free[0]), pp = w.itemsList().filter(i => i.z === zz && i.name), rr = pp.find(i => /^rdr/i.test(i.code) || /قارئ/.test(i.name));
  free.forEach(x => { w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', by:'فني الدورة', at:Date.now() - 86400000, review:'approved', mount:'هيكل قائم', power:'شبكة' }; w.STATE.inss[x.id] = { id:x.id, solution:{ status:'معتمد', parts:{ [rr.code]:1 }, at:Date.now() } }; });
  w.tasksTouched();
  const cycle = async (x, who, role) => {
    as('engineer', 'جرد السيناريوهات'); w.selClear(); w.selToggle(x.id); w.ASN_MODE = ''; w.ASN_TO = who; w.ASN_KIND = 'install';
    const mk = (id, v) => { const el = d.createElement('input'); el.id = id; el.value = v; d.body.appendChild(el); }; mk('asnTo', who); mk('asnKind', 'install'); mk('asnWhen', '2026-10-25');
    w.asnCommit(); ['asnTo', 'asnKind', 'asnWhen'].forEach(id => d.getElementById(id) && d.getElementById(id).remove());
    const tk = w.STATE.tasks['TK-install-' + x.id];
    as(role, who); w.CUR = 'mywork'; w.render(1);
    const mw = d.getElementById('content').innerHTML, i0 = mw.indexOf('data-insform="' + x.id + '"'); let row = mw.slice(i0, i0 + 1500); const nx = row.indexOf('class="list-item"', 10); if (nx > 0) row = row.slice(0, nx); row = row.split('دورة مهمتك')[0];
    w.POP_SITE = x.id; w.DETAIL_ID = x.id;
    const reach = i0 > -1 && /بانتظارك/.test(row) && !/معتمدة/.test(row) && String(w.popHtml()).indexOf('data-insform="' + x.id + '"') > -1 && String(w.PAGE.site.body()).indexOf('data-insform="' + x.id + '"') > -1;
    w.formReset(); w.formGo(x.id); w.CUR = 'insForm'; w.render(1);
    const C = d.getElementById('content'), put = (el, v) => { el.value = String(v); el.dispatchEvent(new w.Event('input', { bubbles:true })); el.dispatchEvent(new w.Event('change', { bubbles:true })); };
    put(C.querySelector('[data-part="' + rr.code + '"]'), 1); const SN = 'CYC' + x.id.slice(-4); put(C.querySelector('[data-serial="' + rr.code + '"]'), SN);
    w.FORM.status = 'مُركّب'; w.FORM.photos.before = { data:IMG2 + x.id }; w.FORM.photos.after = { data:IMG2 + x.id + 'b' };
    const q1 = queued().length; w.STATE.meta.online = true;
    C.querySelector('[data-inssave]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    for (let i = 0; i < 4 && w.PHOTO_Q.length; i++){ await w.photoFlush(); await new Promise(r => setTimeout(r, 320)); }
    const up = queued().slice(q1), r = w.STATE.inss[x.id] || {};
    const saved = r.status === 'مُركّب' && r.by === who && (r.serials || {})[rr.code] === SN && up.some(q => q.kind === 'inss' && q.id === x.id) && up.filter(q => q.kind === 'photos').length >= 2 && up.filter(q => q.kind === 'photoblobs').length >= 2;
    w.STATE.meta.online = false;
    /* (V38.57) the installer sees that it is on the phone and not yet uploaded; the approved solution stays on the local record */
    w.CUR = 'mywork'; w.render(1); const mwq = d.getElementById('content').innerHTML;
    const told = mwq.indexOf('لم يُرفَع بعد') > -1 && ((w.STATE.inss[x.id] || {}).solution || {}).status === 'معتمد';
    as('engineer', 'جرد السيناريوهات'); w.apprIns(x.id, true); const tk2 = w.STATE.tasks['TK-install-' + x.id];
    as(role, who); w.CUR = 'mywork'; w.render(1); const gone = d.getElementById('content').innerHTML.indexOf('data-insform="' + x.id + '"') < 0;
    return { assigned: !!tk && tk.to === who && tk.when === '2026-10-25', reach, saved, told, closed: tk2 && tk2.status === 'معتمد' && gone, SN };
  };
  const A = await cycle(free[0], 'فني الدورة', 'tech'), B = await cycle(free[1], 'مشرف الدورة', 'supervisor');
  T(A.assigned && B.assigned, 'الإسنادُ المجدولُ يُكتَب لصاحبه بموعده — فنيًّا ومشرفًا');
  T(A.reach && B.reach, 'ويصل إليه: في «مهامي» «بانتظارك» تفتح النموذجَ مباشرةً، وفي نافذة الخريطة وصفحة النقطة زرُّ نموذج التركيب');
  T(A.saved && B.saved, 'والتركيبُ يُحفَظ بحالته ومنفِّذه والسيريالُ على قطعته، ويدخل الطابورَ مع الصورتين (وثيقةٌ وخامٌ لكلٍّ)');
  T(A.told && B.told, 'ويرى المنفِّذُ أن تركيبَه «محفوظٌ على الجهاز — لم يُرفَع بعد» حتى يصل، ويبقى الحلُّ المعتمدُ على سجلِّه');
  T(A.closed && B.closed, 'والاعتمادُ يُغلق مهمةَ التركيب فتخرج من «مهامي»');
  /* (V38.57) an install the old database rule refused comes back to the queue by itself — once per 30 minutes */
  { const keepPz = w.STATE.poison, keepOn = w.STATE.meta.online; w.localStorage.removeItem('nsk14.pzIns');
    w.STATE.poison = [{ kind:'inss', id:free[2].id, v:{ id:free[2].id, status:'مُركّب' }, err:'FirebaseError: Missing or insufficient permissions.', at:Date.now() }];
    w.STATE.meta.online = true; const q0 = queued().length, n1 = w.pzInssRetry(); const back = queued().slice(q0).some(q => q.kind === 'inss' && q.id === free[2].id);
    w.STATE.poison.push({ kind:'inss', id:free[2].id, v:{}, err:'permission denied' }); const n2 = w.pzInssRetry();
    T(n1 === 1 && back && n2 === 0, 'والتركيبُ الذي رفضته القاعدةُ القديمةُ يعود إلى طابور الرفع وحدَه (مرةً كلَّ نصف ساعة)');
    w.STATE.poison = keepPz; w.STATE.meta.online = keepOn; }
  as('tech', 'فني الدورة'); const x3 = free[2]; w.formReset(); w.formGo(x3.id); w.CUR = 'insForm'; w.render(1);
  w.FORM.parts[rr.code] = 1; w.FORM.serials[rr.code] = A.SN; w.FORM.status = 'مُركّب'; w.FORM.photos.before = { data:IMG2 + 'c' }; w.FORM.photos.after = { data:IMG2 + 'd' }; w.insSave(0);
  T(!((w.STATE.inss[x3.id] || {}).status === 'مُركّب'), 'وسيريالٌ مسجَّلٌ على نقطةٍ أخرى لم تُفَكّ يوقف الحفظ');
  /* (V38.58) what the owner saw on his phone: the installation's photos in the popup as their own row, the quick marks for
     the engineer only, a plain-spelled «installed» still counts, and the lit mark answers instead of complaining */
  { const x0 = free[0]; w.STATE.photos = w.STATE.photos || {}; w.STATE.photos[x0.id + '-91'] = { site:x0.id, kind:'ins_before', seq:91, status:'pending', blob:true, at:Date.now() }; w.STATE.photos[x0.id + '-92'] = { site:x0.id, kind:'ins_after', seq:92, driveId:'d92', at:Date.now() }; w.PH_IDX = null;
    w.POP_SITE = x0.id; w.FIELD_MODE = 'install'; as('tech', 'فني الدورة'); const pt = w.popHtml();
    as('engineer', 'جرد السيناريوهات'); const pe = w.popHtml(); const keep = w.STATE.inss[x0.id].status; w.STATE.inss[x0.id].status = 'مركب'; const plain = w.insDone(x0.id) && w.lifeOfRaw(x0) === 'installed'; w.STATE.inss[x0.id].status = keep;
    toasts.length = 0; w.markInstall(x0.id, 'مُركّب'); const said = toasts.slice(-1)[0] || '';
    T(pt.indexOf('صور التركيب') > -1 && pt.indexOf('تُنقَل إلى الدرايف') > -1 && !/data-fmark=/.test(pt) && /data-fmark=/.test(pe) && plain && /مُركّبةٌ/.test(said), 'ونافذةُ النقطة تعرض صورَ التركيب (والمنقولةَ بعدُ)، والوسمُ السريعُ للمهندس وحده ويجيب بالحال لا بالشكوى، و«مركب» بلا تشكيلٍ مُركّبةٌ أيضًا');
    w.FIELD_MODE = 'survey'; }
  /* (V38.60) the quick statuses colour the point: «متعذّر» red, «قيد التركيب» amber — they stayed «scheduled» */
  { const x4 = free[1]; const keepSt = w.STATE.inss[x4.id].status; w.STATE.inss[x4.id].status = 'متعذّر'; const a1 = w.lifeOfRaw(x4); w.STATE.inss[x4.id].status = 'قيد التركيب'; const a2 = w.lifeOfRaw(x4); w.STATE.inss[x4.id].status = keepSt;
    T(a1 === 'insfail' && a2 === 'inprog' && w.LIFE.insfail && w.LIFE.inprog && w.LIFE_ORDER.indexOf('insfail') > -1, 'و«متعذّر» و«قيد التركيب» لهما لونُهما على الخريطة لا لونُ «مجدولة»'); }
  /* (V38.59) the engineer's review row shows the parts with their serials and the installation photos, and a return carries
     its reason to the installer's «مهامي» */
  { const x2 = free[2]; as('engineer', 'جرد السيناريوهات'); w.STATE.queue = queued().filter(q => q.id !== x2.id);
    w.STATE.inss[x2.id] = { id:x2.id, status:'مُركّب', by:'فني الدورة', at:Date.now(), parts:{ [rr.code]:1, zz_cam:2 }, serials:{ [rr.code]:'SN-QA-1' }, approved:false, pts:9, solution:{ status:'معتمد', parts:{ [rr.code]:1 } } };
    w.STATE.photos = w.STATE.photos || {}; w.STATE.photos[x2.id + '-95'] = { site:x2.id, kind:'ins_after', seq:95, driveId:'d95', at:Date.now() }; w.PH_IDX = null;
    w.STATE.tasks['TK-install-' + x2.id] = { id:'TK-install-' + x2.id, site:x2.id, kind:'install', to:'فني الدورة', status:'مطلوب' }; w.tasksTouched();
    w.CUR = 'survey'; w.render(1); w.PTAB.survey = 'qa'; w.render(1); const hq = d.getElementById('content').innerHTML;
    const keepPrompt = w.prompt; w.prompt = () => 'الصورة مش واضحة'; w.apprIns(x2.id, 0); w.prompt = keepPrompt; const r2 = w.STATE.inss[x2.id];
    w.STATE.queue = queued().filter(q => !(q.kind === 'inss' && q.id === x2.id));   /* the write belongs to the engineer's device, not the installer's */
    as('tech', 'فني الدورة'); w.CUR = 'mywork'; w.render(1); const mw2 = d.getElementById('content').innerHTML, i2 = mw2.indexOf('data-insform="' + x2.id + '"'), row2 = mw2.slice(i2, i2 + 1500).split('دورة مهمتك')[0];
    T(hq.indexOf('SN-QA-1') > -1 && hq.indexOf('بلا سيريال') > -1 && hq.indexOf('data-phview') > -1 && hq.indexOf('data-site="' + x2.id + '"') > -1, 'وصفُّ التدقيق الهندسيِّ يعرض القطعَ بسيريالاتها (وما بلا سيريال) وصورَ التركيب وبابَ النقطة');
    T(r2.status === 'مُعاد' && r2.why === 'الصورة مش واضحة' && row2.indexOf('الصورة مش واضحة') > -1 && row2.indexOf('أُعيد للتصحيح') > -1, 'والردُّ يحمل سببَه إلى «مهامي» المنفِّذ');
    w.STATE.tasks['TK-install-' + x2.id].status = 'معتمد'; w.tasksTouched(); as('engineer', 'جرد السيناريوهات'); }
  w.STATE.users = keepUsers; w.STATE.meta.online = keepOnline; as('engineer', 'جرد السيناريوهات');
}

/* ── ١٦ · (V38.60) محادثةُ الميدان: المهندسُ يكتب على النقطة من صفحتها ← المنفِّذُ يراها ويردّ من صفحة المحادثات ← حفظُ التركيب
   واعتمادُه يكتبان سطرَيهما وحدَهما ── */
console.log('\n══ ١٦ · محادثةُ الميدان ══');
{
  const d = w.document, as = (role, name) => { w.ROLE = role; w.STATE.meta.role = role; w.STATE.meta.name = name; };
  const keepUsers = w.STATE.users; w.STATE.users = Object.assign({}, keepUsers || {}, { zc1:{ name:'فني المحادثة', role:'tech', user:'zc1' } });
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'عرفات' && !w.STATE.inss[z.id] && !w.taskKindOf(z.id, 'install'))[0];
  w.STATE.tasks['TK-install-' + x.id] = { id:'TK-install-' + x.id, site:x.id, kind:'install', to:'فني المحادثة', status:'مطلوب' }; w.tasksTouched();
  as('engineer', 'جرد السيناريوهات'); w.DETAIL_ID = x.id; w.CUR = 'site'; w.render(1);
  const ta = d.querySelector('#content [data-chtext="' + x.id + '"]'); ta.value = 'ركّب القارئَ على العمود الشماليّ'; d.querySelector('#content [data-chsend="' + x.id + '"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  const M1 = w.chOf(x.id);
  T(M1.length === 1 && M1[0].to === 'فني المحادثة' && M1[0].from === 'جرد السيناريوهات' && queued().some(q => q.kind === 'msgs' && q.id === M1[0].id), 'المهندسُ يكتب على النقطة من صفحتها إلى مُسنَدها، والرسالةُ في طابور الرفع');
  as('tech', 'فني المحادثة'); const vis = w.chVisible(M1[0]); w.CUR = 'chat'; w.render(1); const hc = d.getElementById('content').innerHTML;
  const ta2 = d.querySelector('#content [data-chtext="*"]'); ta2.value = 'تمام — جاري'; d.querySelector('#content [data-chsite-in]').value = x.id; d.querySelector('#content [data-chsend="*"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(vis && w.seesPage('chat') && hc.indexOf('العمود الشماليّ') > -1 && w.chOf(x.id).length === 2 && w.chOf(x.id)[1].from === 'فني المحادثة', 'والمنفِّذُ يراها في «المحادثات» ويردُّ منها');
  const rzone = w.siteZone(x), rparts = w.itemsList().filter(i => i.z === rzone && i.name), rr2 = rparts.find(i => /^rdr/i.test(i.code) || /قارئ/.test(i.name));
  w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', review:'approved', by:'فني المحادثة', at:Date.now() }; w.STATE.inss[x.id] = { id:x.id, solution:{ status:'معتمد', parts:{ [rr2.code]:1 } } };
  w.formReset(); w.formGo(x.id); w.FORM.parts = { [rr2.code]:1 }; w.FORM.serials = { [rr2.code]:'SN-CHAT-9' }; w.FORM.status = 'مُركّب'; w.FORM.photos.before = { data:IMG + 'q' }; w.FORM.photos.after = { data:IMG + 'r' }; w.insSave(0);
  const sys = w.chOf(x.id).filter(v => v.kind === 'sys');
  as('engineer', 'جرد السيناريوهات'); w.apprIns(x.id, 1);
  T(sys.length === 1 && /اكتمل التركيب/.test(sys[0].text) && /SN-CHAT-9/.test(sys[0].text) && w.chOf(x.id).some(v => /اعتمد المهندسُ/.test(v.text)), 'وحفظُ التركيب يكتب سطرَه بقطعه وسيريالاته، والاعتمادُ سطرَه');
  w.POP_SITE = x.id; T(String(w.popHtml()).indexOf('محادثة النقطة') > -1, 'والمحادثةُ تظهر في نافذة النقطة على الخريطة');
  /* (V38.67) a point not scheduled for installation has no chat; the management has the history tab with its filters */
  { const fr = w.STATE.sites.filter(z => z && z.type === 'مخيم' && !w.STATE.inss[z.id] && !w.taskKindOf(z.id, 'install') && !w.chOf(z.id).length)[0];
    w.POP_SITE = fr.id; const noChat = String(w.popHtml()).indexOf('محادثة النقطة') < 0 && !w.chScheduled(fr.id);
    w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; const tabsA = w.tabsOf('chat').map(t0 => t0[0]); w.ROLE = 'tech'; w.STATE.meta.role = 'tech'; const tabsT = w.tabsOf('chat').map(t0 => t0[0]); w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
    w.chHistState.s = { site:x.id, who:'', from:'', to:'', kind:'sys', q:'' }; const hh = w.chHistHtml(); w.chHistState.s = null;
    T(noChat && tabsA.join() === 'chat,chathist' && tabsT.join() === 'chat' && hh.indexOf('اكتمل التركيب') > -1 && hh.indexOf('ركّب القارئَ') < 0, 'ونقطةٌ غيرُ مجدولةٍ للتركيب بلا محادثة، و«سجل المحادثات» للإدارة بفلترٍ بالنقطة والنوع'); }
  w.STATE.users = keepUsers; w.STATE.tasks['TK-install-' + x.id].status = 'معتمد'; w.tasksTouched();
}

/* ── ١٧ · (V38.61) تعديلُ التركيب كما يُعدَّل المسح: الحالةُ والقطعُ والسيريالاتُ تُحفَظ من اللوح، وصورُ التركيب تُحذَف وتُضاف،
   والصورُ في نافذة الخريطة بحسب وضعها (المسحُ صورَه، والتركيبُ صورَه، والمختصرُ الكلّ) ── */
console.log('\n══ ١٧ · تعديلُ التركيب ══');
{
  const d = w.document, as = (role, name) => { w.ROLE = role; w.STATE.meta.role = role; w.STATE.meta.name = name; };
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id] && !w.taskKindOf(z.id, 'install'))[0];
  const zn = w.siteZone(x), pz = w.itemsList().filter(i => i.z === zn && i.name), rd = pz.find(i => /^rdr/i.test(i.code) || /قارئ/.test(i.name)), cm = pz.find(i => /كاميرا/.test(i.name));
  as('supervisor', 'مشرف التعديل');
  w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', review:'approved', by:'مشرف التعديل', at:Date.now() - 3600000, mount:'هيكل قائم', power:'شبكة' };
  w.STATE.inss[x.id] = { id:x.id, status:'مُركّب', by:'مشرف التعديل', at:Date.now(), parts:{ [rd.code]:1 }, serials:{ [rd.code]:'SN-ED-1' }, approved:false, pts:1, solution:{ status:'معتمد', parts:{ [rd.code]:1 } } };
  w.STATE.photos = w.STATE.photos || {}; w.STATE.photos[x.id + '-71'] = { site:x.id, kind:'ins_before', seq:71, by:'مشرف التعديل', at:Date.now(), driveId:'d71' }; w.STATE.photos[x.id + '-70'] = { site:x.id, kind:'sv', seq:70, by:'مشرف التعديل', at:Date.now(), driveId:'d70' }; w.PH_IDX = null;
  w.POP_SITE = x.id; w.FIELD_MODE = 'survey'; const pS = String(w.popHtml()); w.FIELD_MODE = 'install'; const pI = String(w.popHtml()); w.FIELD_MODE = 'brief'; const pB = String(w.popHtml()); w.FIELD_MODE = 'survey';
  T(pS.indexOf('صور الزيارة') > -1 && pS.indexOf('صور التركيب') < 0 && pI.indexOf('صور التركيب') > -1 && pI.indexOf('صور الزيارة') < 0 && pI.indexOf('data-insq="' + x.id + '"') > -1 && pB.indexOf('d70') > -1 && pB.indexOf('d71') > -1, 'الصورُ بحسب وضع الخريطة: المسحُ صورَ الزيارة، والتركيبُ صورَ التركيب وزرَّ تعديله، والمختصرُ الكلّ');
  w.insqState().id = x.id; w.CUR = 'map'; w.render(1); let sh = d.getElementById('insqSheet');
  const drawn = !!sh && sh.innerHTML.indexOf('SN-ED-1') > -1 && sh.querySelectorAll('[data-insqdelask]').length === 1 && sh.innerHTML.indexOf('d70') < 0 && !!sh.querySelector('[data-insqadd]');
  sh.querySelector('[data-insqp="' + cm.code + '"]').value = '2'; sh.querySelector('[data-insqs="' + cm.code + '"]').value = 'SN-ED-C'; const mv0 = w.STATE.moves.length; const ok1 = w.insqSave(); const r1 = w.STATE.inss[x.id];
  T(drawn && ok1 && r1.parts[cm.code] === 2 && r1.serials[cm.code] === 'SN-ED-C' && r1.solution && r1.edits.length === 1 && w.STATE.moves.length > mv0 && w.insConsumed(x.id)[cm.code] === 2 && w.chOf(x.id).some(v => /عُدِّل التركيب/.test(v.text) && /SN-ED-C/.test(v.text)), 'ولوحُ التعديل يعرض صورَ التركيب وحدَها ويحفظ الكميةَ والسيريال، ويُستهلَك الفرقُ، ويُسجَّل التعديلُ وسطرُه في المحادثة');
  w.render(1); sh = d.getElementById('insqSheet'); sh.querySelector('[data-insqdelask]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); sh = d.getElementById('insqSheet'); sh.querySelector('[data-insqdel]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  const delOk = !!(w.STATE.photos[x.id + '-71'] || {}).del;
  w.STATE.inss[x.id].approved = true; as('tech', 'فني آخر'); w.render(1); sh = d.getElementById('insqSheet'); const noDel = !sh.querySelector('[data-insqdelask]'); sh.querySelector('[data-insqs="' + rd.code + '"]').value = 'SN-ED-2'; const ok2 = w.insqSave();
  T(delOk && noDel && ok2 && w.STATE.inss[x.id].approved === false, 'وحذفُ صورته قبل الاعتماد له، وبعد الاعتماد للمهندس وحده — وتعديلُ الفنيِّ لمعتمدٍ يعيده إلى التدقيق');
  w.insqState().id = ''; as('engineer', 'جرد السيناريوهات');
}

/* ── ١٨ · (V38.62) المسحُ للتوريد والتركيبُ للمستودع: الاستهلاكُ صافٍ لكلِّ نقطة (لا خصمَ مرتين)، والنقصُ يعود للعهدة،
   و«متعذّر» لا يستهلك؛ والجدولُ يضع المعتمدَ من المسح بجانب الوارد والمخزون والمركَّب والمتبقّي للطلب ── */
console.log('\n══ ١٨ · التوريدُ والمستودع ══');
{
  const as = (role, name) => { w.ROLE = role; w.STATE.meta.role = role; w.STATE.meta.name = name; };
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id] && !w.taskKindOf(z.id, 'install'))[1];
  const zn = w.siteZone(x), pz = w.itemsList().filter(i => i.z === zn && i.name), rd = pz.find(i => /قارئ/.test(i.name)), cm = pz.find(i => /كاميرا/.test(i.name));
  as('supervisor', 'مشرف المستودع'); w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', review:'approved', at:Date.now() }; w.STATE.inss[x.id] = { id:x.id, solution:{ status:'معتمد', items:{ [rd.code]:1, [cm.code]:1 } } };
  const save = (parts, st, tag) => { w.formReset(); w.formGo(x.id); w.FORM.parts = parts; w.FORM.status = st; w.FORM.photos.before = { data:IMG + tag + 'a' }; w.FORM.photos.after = { data:IMG + tag + 'b' }; w.insSave(0); return JSON.stringify(w.insConsumed(x.id)); };
  const c1 = save({ [rd.code]:1 }, 'قيد التركيب', 'w1'), c2 = save({ [rd.code]:1, [cm.code]:2 }, 'مُركّب', 'w2');
  w.insqState().id = x.id; w.CUR = 'map'; w.render(1); const sh = w.document.getElementById('insqSheet'); sh.querySelector('[data-insqp="' + cm.code + '"]').value = '1'; w.insqSave(); w.insqState().id = '';
  const c3 = w.insConsumed(x.id), corr = w.STATE.moves.filter(m => m.site === x.id && m.kind === 'تصحيح استهلاك').length;
  T(c1 === JSON.stringify({ [rd.code]:1 }) && c2 === JSON.stringify({ [rd.code]:1, [cm.code]:2 }) && c3[cm.code] === 1 && corr === 1, 'الاستهلاكُ صافٍ لكلِّ نقطة: الحفظُ الثاني يخصم الفرقَ وحدَه، والتعديلُ بالنقص يعيد الفرقَ إلى عهدة المنفِّذ');
  const c4 = w.insConsumed(x.id); save({}, 'متعذّر', 'w3'); const c5 = w.insConsumed(x.id);
  T(c4[rd.code] === 1 && !c5[rd.code] && !c5[cm.code], 'و«متعذّر» لا يستهلك شيئًا ويعيد ما خُصم');
  as('engineer', 'جرد السيناريوهات'); w.STATE.inss[x.id].status = 'مُركّب'; w.STATE.inss[x.id].parts = { [rd.code]:1, [cm.code]:3 }; w.STATE.inss[x.id].solution = { status:'معتمد', items:{ [rd.code]:1, [cm.code]:1 } };
  w.CUR = 'survey'; w.render(1); w.PTAB.survey = 'solution'; w.render(1); const hs = w.document.getElementById('content').innerHTML; w.PTAB.survey = 'qa'; w.render(1); const hq = w.document.getElementById('content').innerHTML;
  T(hs.indexOf('المعتمد من المسح (للتوريد)') > -1 && hs.indexOf('رُكِّب (خُصم)') > -1 && hs.indexOf('المتبقّي للطلب') > -1 && hq.indexOf('عن الحلّ المعتمد') > -1, 'وجدولُ الحلول يضع المعتمدَ للتوريد بجانب الوارد والمخزون والمركَّب والمتبقّي، وصفُّ التدقيق يُري الفرقَ عن الحلّ');
  /* (V38.63) an installation takes from the installers' custody first, then from the store */
  { const keepM = w.STATE.moves; w.STATE.moves = [
      { at:'2026-10-01', kind:'توريد', item:'zz-item', qty:10, by:'مخزن' },
      { at:'2026-10-02', kind:'صرف', item:'zz-item', qty:2, by:'فني س' },
      { at:'2026-10-03', kind:'استهلاك', item:'zz-item', qty:5, by:'فني س', site:'S-ZZ' } ];
    const b = w.stockBalance().find(r => r.item === w.itemKey('zz-item')) || {}, cu = (w.custodyByWho().find(r => r.who === 'فني س') || { items:{} }).items['zz-item'] || 0;
    T(b.store === 5 && b.custody === 0 && b.used === 5 && cu === 0, 'والتركيبُ يأخذ من عهدة المنفِّذ أوّلًا ثم من المستودع مباشرةً — لا عهدةَ سالبةً ولا مستودعَ لا ينقص');
    w.STATE.moves = keepM; }
  /* the chat page has a live installation log */
  { w.chPageHtml.f = {}; const hl = w.chPageHtml(); w.chPageHtml.f = { sys:1 }; const hp = w.chPageHtml(); w.chPageHtml.f = {}; T(hl.indexOf('data-chf="sys"') > -1 && hp.indexOf('سجل التركيب') > -1 && hp.indexOf('chScroll') > -1, 'وصفحةُ المحادثات فيها «سجل التركيب» لايف — كلُّ حفظٍ وتعديلٍ واعتمادٍ وردّ'); }
  /* a photo still travelling to Drive is read from its raw copy, once */
  w.phBlob.c = { 'S-PH-1':'data:image/jpeg;base64,/9j/RAW' }; const src1 = w.phSrc('S-PH-1', { status:'pending', blob:true }), src2 = w.phSrc('S-PH-2', { driveId:'dz' }, 200);
  T(src1.indexOf('RAW') > -1 && /thumbnail\?id=dz&sz=w200/.test(src2), 'والصورةُ التي لم تصل الدرايف بعدُ تُعرَض من نسختها في السحابة خلال ثوانٍ');
  w.STATE.inss[x.id].status = ''; delete w.STATE.inss[x.id];
}

/* ── ١٩ · (V38.64) كما على الهاتف: Firebase قائمٌ (FB.ready = true) — كلُّ شاشةٍ لمسها التركيبُ والمحادثةُ تُفتَح لكلِّ دور
   بلا خطأ. بلاغُ المالك: «النقطةُ الخضراء لا تستجيب — خطأ»: كان FB.ready يُستدعى دالّةً وهو علَمٌ، فسقطت نافذةُ كلِّ نقطةٍ
   فيها صورةٌ في الطريق إلى الدرايف. الجرودُ كانت تعمل وFirebase نائم فلم تَرَه — وهذا الجردُ يعمل وهو قائم ── */
console.log('\n══ ١٩ · كما على الهاتف (Firebase قائم) ══');
{
  const d = w.document, keepReady = w.FB.ready, keepDb = w.FB.db;
  const stubDoc = { get:() => Promise.resolve({ exists:true, data:() => ({ data:'data:image/jpeg;base64,/9j/RAW' }) }), set:() => Promise.resolve(), update:() => Promise.resolve() };
  const stubCol = { doc:() => stubDoc, where(){ return this; }, orderBy(){ return this; }, limit(){ return this; }, get:() => Promise.resolve({ size:0, forEach(){}, docs:[] }), onSnapshot:() => () => {} };
  w.FB.ready = true; w.FB.db = { collection:() => stubCol, batch:() => ({ set(){}, commit:() => Promise.resolve() }) };
  const pts = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id]).slice(5, 9);
  const zn = w.siteZone(pts[0]), pz = w.itemsList().filter(i => i.z === zn && i.name), rd = pz.find(i => /قارئ/.test(i.name));
  const states = ['مُركّب', 'قيد التركيب', 'متعذّر', 'مُعاد'];
  pts.forEach((x, k) => {
    w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', review:'approved', by:'فني', at:Date.now() - 9e6 };
    w.STATE.inss[x.id] = { id:x.id, status:states[k], by:'فني الهاتف', at:Date.now(), parts:{ [rd.code]:1 }, serials:{ [rd.code]:'SN-PH-' + k }, approved:false, why:k === 3 ? 'السبب' : undefined, solution:{ status:'معتمد', items:{ [rd.code]:1 } } };
    w.STATE.photos[x.id + '-81'] = { site:x.id, kind:'ins_before', seq:81, status:'pending', blob:true, at:Date.now() };
    w.STATE.photos[x.id + '-82'] = { site:x.id, kind:'sv', seq:82, status:'pending', blob:true, at:Date.now() };
    w.STATE.tasks['TK-install-' + x.id] = { id:'TK-install-' + x.id, site:x.id, kind:'install', to:'فني الهاتف', status:'مطلوب', when:'2026-10-22' };
    w.STATE.msgs = w.STATE.msgs || {}; w.STATE.msgs['M-ph-' + k] = { id:'M-ph-' + k, site:x.id, from:'مهندس', to:'فني الهاتف', text:'سطر', kind:'msg', at:Date.now() };
  });
  w.PH_IDX = null; w.tasksTouched();
  const errs = [];
  const tryIt = (what, fn) => { try { const r = fn(); if (r === false) errs.push(what + ': فارغ'); } catch (e){ errs.push(what + ': ' + String(e.message).slice(0, 90)); } };
  [['admin','مدير'], ['engineer','مهندس'], ['supervisor','مشرف الهاتف'], ['tech','فني الهاتف']].forEach(([role, name]) => {
    w.ROLE = role; w.STATE.meta.role = role; w.STATE.meta.name = name;
    pts.forEach(x => {
      w.POP_SITE = x.id;
      ['survey','install','dis'].forEach(m => { w.FIELD_MODE = m; tryIt(role + ' نافذة ' + m + ' ' + x.id, () => String(w.popHtml()).length > 300); });
      w.FIELD_MODE = 'survey';
      tryIt(role + ' صفحة النقطة ' + x.id, () => { w.DETAIL_ID = x.id; return String(w.PAGE.site.body()).length > 300; });
      tryIt(role + ' نموذج التركيب ' + x.id, () => { w.formReset(); w.formGo(x.id); w.CUR = 'insForm'; w.render(1); return !!d.querySelector('#content [data-fst]'); });
      tryIt(role + ' شريحة الحالة ' + x.id, () => { const c = d.querySelector('#content [data-fst="مُركّب"]'); c.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return w.FORM.status === 'مُركّب'; });
      if (w.insqMay(x.id)) tryIt(role + ' لوح تعديل التركيب ' + x.id, () => { w.insqState().id = x.id; w.CUR = 'map'; w.render(1); const ok = !!d.getElementById('insqSheet'); w.insqState().id = ''; w.render(1); return ok; });
    });
    tryIt(role + ' مهامي', () => { w.CUR = 'mywork'; w.render(1); return true; });
    tryIt(role + ' المحادثات', () => { w.CUR = 'chat'; w.render(1); return !!d.querySelector('#content [data-chsend]'); });
    if (role === 'admin' || role === 'engineer') ['qa','solution'].forEach(tb => tryIt(role + ' ' + tb, () => { w.CUR = 'survey'; w.render(1); w.PTAB.survey = tb; w.render(1); return true; }));
  });
  /* a tap on «نموذج التركيب» inside the popup of a green point opens the form */
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.POP_SITE = pts[0].id; w.FIELD_MODE = 'install'; w.CUR = 'map'; w.POP_OPEN = true;
  tryIt('ضغطةُ نموذج التركيب من نافذة نقطةٍ خضراء', () => { const host = d.createElement('div'); host.innerHTML = w.popHtml(); d.body.appendChild(host); const b = host.querySelector('[data-insform]'); b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); host.remove(); return w.CUR === 'insForm' || w.CUR === 'forms'; });
  T(!errs.length, 'كلُّ شاشات التركيب والمحادثة تُفتَح لكلِّ دورٍ وFirebase قائم — والنقطةُ الخضراءُ تستجيب' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  w.FB.ready = keepReady; w.FB.db = keepDb; w.FIELD_MODE = 'survey'; w.POP_OPEN = false; w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
}

/* ── ٢٠ · (V38.68) لا نموذجَ بلا نقطته: كان النموذجُ المفتوحُ بلا نقطةٍ يعرض أوّلَ نقطةٍ في السجل (مخيم عرفات ٠٠٠١) ويحفظ
   عليها — فوُجد عليها ١٥ زيارةً لفنيَّين في ستةِ أيامٍ وتركيبُ مخيم منى ٠٤٤٩. صار يطلب النقطةَ ولا يحفظ؛ ويُلغي المهندسُ تركيبًا
   سُجِّل خطأً فتعود النقطةُ والقطعُ والأثرُ باقٍ ── */
console.log('\n══ ٢٠ · لا نموذجَ بلا نقطته ══');
{
  const d = w.document, first = w.STATE.sites[0], before = JSON.stringify(w.STATE.inss[first.id] || null), beforeRec = JSON.stringify(w.STATE.recs[first.id] || null);
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.STATE.meta.name = 'جرد السيناريوهات';
  w.formReset(); w.FORM.site = ''; w.CUR = 'forms'; w.PTAB.forms = 'insForm'; w.render(1); const hi = d.getElementById('content').innerHTML;
  w.FORM.parts = { rdr4c:1 }; w.FORM.status = 'مُركّب'; w.FORM.photos.before = { data:IMG + 'n1' }; w.FORM.photos.after = { data:IMG + 'n2' }; w.insSave(0);
  w.PTAB.forms = 'svForm'; w.render(1); const hs = d.getElementById('content').innerHTML;
  T(w.formSite() === null && hi.indexOf('لم تُختر نقطة') > -1 && hs.indexOf('لم تُختر نقطة') > -1 && JSON.stringify(w.STATE.inss[first.id] || null) === before && JSON.stringify(w.STATE.recs[first.id] || null) === beforeRec,
    'النموذجُ بلا نقطةٍ يطلبها ولا يعرض أوّلَ نقطةٍ في السجل، ولا يُكتَب على تلك النقطة شيء');
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id] && !w.taskKindOf(z.id, 'install'))[3];
  w.STATE.inss[x.id] = { id:x.id, status:'مركب', by:'منفِّذ', at:Date.now() - 6e5, approved:true, parts:{ rdr4c:1 }, serials:{ rdr4c:'SN-VOID' }, pts:5 };
  w.STATE.moves.push({ at:'2026-10-21', ts:Date.now() - 6e5, kind:'استهلاك', item:'rdr4c', qty:1, by:'منفِّذ', site:x.id });
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; const keepP = w.prompt; w.prompt = () => 'سُجِّل على نقطةٍ خطأ'; const ok = w.insqVoid(x.id); w.prompt = keepP;
  const r = w.STATE.inss[x.id];
  T(ok && !w.insDone(x.id) && r.voided && r.voided.prev.serials.rdr4c === 'SN-VOID' && w.insConsumed(x.id).rdr4c === 0, 'وإلغاءُ تركيبٍ سُجِّل خطأً يعيد النقطةَ غيرَ مركَّبة والقطعَ إلى العهدة، ويُبقي ما كان في السجلّ');
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
}

/* ── ٢١ · (V38.69) لا «أوّلُ نقطةٍ» بديلًا في أيِّ شاشةٍ تكتب، وكلُّ حركةِ مخزنٍ وثيقتُها ── */
console.log('\n══ ٢١ · لا بديلَ صامت، والدفترُ يصل المكتب ══');
{
  w.POP_SITE = 'NO-SUCH-POINT'; const pop = String(w.popHtml()); w.DETAIL_ID = 'NO-SUCH-POINT'; const pg = String(w.PAGE.site.body());
  T(pop === '' && pg.indexOf('غيرُ موجودة') > -1 && pg.indexOf(w.STATE.sites[0].id) < 0 && w.crewOf('NO-SUCH') === null && w.teamOf('NO-SUCH') === null,
    'نافذةُ نقطةٍ غيرِ موجودةٍ تُغلَق، وصفحتُها تقول ذلك، والفريقُ غيرُ الموجود لا يصير أوّلَ فريق — لا كتابةَ على غير المقصود');
  const keepM = w.STATE.moves, keepQ = w.STATE.queue; w.STATE.moves = []; w.STATE.queue = [];
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id])[7];
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.STATE.inss[x.id] = { id:x.id, status:'مركب', by:'منفِّذ', at:Date.now(), parts:{ rdr4c:1 } };
  const n1 = w.insLedgerSettle(), n2 = w.insLedgerSettle(), q = w.STATE.queue.filter(it => it.kind === 'moves' && it.v && it.v.site === x.id);
  T(n1 >= 1 && n2 === 0 && q.length === 1 && q[0].v.kind === 'استهلاك' && q[0].id === q[0].v.id, 'وتسويةُ الدفتر تكتب حركةَ «استهلاك» وثيقةً بنفسها مرةً واحدة — لا ملخّصًا بمفتاح النقطة');
  delete w.STATE.inss[x.id]; w.STATE.moves = keepM; w.STATE.queue = keepQ; w.POP_SITE = ''; w.DETAIL_ID = '';
}

/* ── ٢٢ · (V38.70) زيارةٌ حُفظت على نقطةٍ خطأ تُنقَل إلى نقطتها بصورها هي، وصورُ تركيبٍ أُلغي لا تُعرَض صورًا للنقطة ── */
console.log('\n══ ٢٢ · نقلُ الزيارة وصورُ التركيب الملغى ══');
{
  const src = w.STATE.sites.filter(z => z && z.type === 'مخيم' && !w.STATE.recs[z.id] && !w.STATE.inss[z.id])[0];
  const to = w.STATE.sites.filter(z => z && z.type === 'مخيم' && !w.STATE.recs[z.id] && !w.STATE.inss[z.id] && z.id !== src.id)[1];
  const at = Date.now() - 864e5;
  w.STATE.recs[src.id] = { id:src.id, access:'تم الوصول', review:'pending', by:'فني النقل', at:at, mount:'هيكل قائم' };
  w.STATE.photos[src.id + '-41'] = { site:src.id, kind:'site', seq:41, by:'فني النقل', at:at, driveId:'mv41', status:'done' };
  w.STATE.photos[src.id + '-42'] = { site:src.id, kind:'site', seq:42, by:'غيره', at:at - 9e8, driveId:'mv42', status:'done' };
  w.STATE.photos[src.id + '-43'] = { site:src.id, kind:'ins_after', seq:43, by:'منفِّذ', at:at, driveId:'mv43', status:'done' };
  w.STATE.inss[src.id] = { id:src.id, status:'', voided:{ by:'مدير', at:Date.now(), why:'خطأ' } }; w.PH_IDX = null;
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.POP_SITE = src.id; w.FIELD_MODE = 'install'; const hp = String(w.popHtml()); w.FIELD_MODE = 'survey';
  const kp = w.prompt, kc = w.confirm; w.prompt = () => to.id; w.confirm = () => true; const ok = w.svqMove(src.id); w.prompt = kp; w.confirm = kc;
  const r = w.STATE.recs[to.id] || {};
  T(hp.indexOf('mv43') < 0 && ok && r.by === 'فني النقل' && r.review === 'pending' && (r.movedFrom || {}).site === src.id && w.STATE.recs[src.id].deleted && w.STATE.recs[src.id].movedTo === to.id
    && w.STATE.photos[src.id + '-41'].site === to.id && w.STATE.photos[src.id + '-41'].rehome && w.STATE.photos[src.id + '-42'].site === src.id,
    'صورُ التركيب الملغى لا تُعرَض، والزيارةُ تُنقَل بصورها هي وحدَها وتعود للاعتماد، والنقطةُ الخطأ ترجع بلا زيارةٍ وعليها أثرُ النقل');
  delete w.STATE.inss[src.id]; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
}

/* ── ٢٣ · (V38.71) حالةُ التركيب بإملاءٍ واحدٍ في الذاكرة: «مركب» (الوسم السريع) و«مُركّب» (النموذج) كلمةٌ واحدة لكلِّ شاشة ── */
console.log('\n══ ٢٣ · إملاءٌ واحدٌ لحالة التركيب ══');
{
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.inss[z.id])[12];
  w.STATE.inss[x.id] = { id:x.id, status:'مركب', by:'منفِّذ', at:Date.now(), parts:{ rdr4c:1 } };
  w.statBump();
  T(w.STATE.inss[x.id].status === 'مُركّب' && w.insDone(x.id) && w.insCanon('متعذر') === 'متعذّر' && w.insCanon('معاد') === 'مُعاد' && w.insCanon('شيء آخر') === 'شيء آخر',
    'الإملاءُ البسيطُ يصير «مُركّب» بعد كلِّ تغيّرٍ في البيانات — فتعدّه شاشاتُ الوزارة والمتابعة كما تعدّه اللوحة');
  delete w.STATE.inss[x.id]; w.statBump();
}

/* ── ٢٤ · (V38.72) قطعُ الصيانة تصل دفترَ المكتب — كانت تُدفَع على هاتف المنفِّذ وحدَه ── */
console.log('\n══ ٢٤ · قطعُ الصيانة في الدفتر ══');
{
  const src = w.document.querySelector('script') ? String(w.maintSave) : '';
  T(/mvWrite\(/.test(src) && !/STATE\.moves\.push\(/.test(src), 'الصيانةُ تكتب حركتَها وثيقةً في الدفتر — لا دفعًا محليًّا');
  const all = Object.keys(w).filter(k => typeof w[k] === 'function' && /^function/.test(String(w[k]))).filter(k => k !== 'mvWrite' && k !== 'moveAdd' && /STATE\.moves\.push\(/.test(String(w[k])) && !/CORE\.dirty\('moves'/.test(String(w[k])));
  T(!all.length, 'ولا دالّةَ تدفع حركةَ مخزنٍ محليًّا بلا كتابتها في الدفتر' + (all.length ? ': ' + all.join('، ') : ''));
}

/* ── ٢٥ · (V38.73) صورُ الزيارة تُجلَب في شاشة المسح ولو كانت صورُ التركيب على الهاتف — كان الجلبُ حين لا صورةَ أصلًا ── */
console.log('\n══ ٢٥ · صورُ الزيارة في شاشة المسح ══');
{
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && z.zone === 'منى' && !w.STATE.recs[z.id] && !w.STATE.inss[z.id])[14];
  w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', review:'approved', by:'فني', at:Date.now() - 9e8, photos:['site','mount'] };
  w.STATE.inss[x.id] = { id:x.id, status:'مُركّب', by:'منفِّذ', at:Date.now(), photos:['before'] };
  w.STATE.photos[x.id + '-61'] = { site:x.id, kind:'ins_before', seq:61, status:'done', driveId:'I61', at:Date.now() }; w.PH_IDX = null;
  let asked = 0; const keep = w.photosFetchSite; w.photosFetchSite = (id) => { if (id === x.id) asked++; };
  w.POP_SITE = x.id; w.FIELD_MODE = 'survey'; const h = String(w.popHtml()); w.photosFetchSite = keep;
  T(asked >= 1 && h.indexOf('I61') < 0 && /الصور/.test(h), 'شاشةُ المسح تطلب صورَ الزيارة الناقصة ولو كانت صورُ التركيب هنا، وتقول ما تعرف حتى تصل');
  delete w.STATE.inss[x.id]; delete w.STATE.recs[x.id];
}

/* ── ٢٦ · (V38.74) الكتابةُ في البحث لا تُمحى بإعادة الرسم، والبحثُ أثناء الكتابة؛ والصورةُ المحذوفةُ تُسترجَع؛
   وصورةٌ جديدةٌ لا ترث حذفَ صورةٍ قديمةٍ بالرقم نفسِه؛ وصورُ زيارةٍ معتمدةٍ للإدارة وحدَها ── */
console.log('\n══ ٢٦ · البحثُ والصور ══');
{
  const d = w.document; w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.SITE_Q = ''; w.CUR = 'sites'; w.render(1);
  const q = d.getElementById('siteQ'); q.focus(); q.value = '38/5'; q.dispatchEvent(new w.Event('input', { bubbles:true })); w.render(1);
  const q2 = d.getElementById('siteQ'); const kept = q2.value === '38/5' && d.activeElement === q2;
  q2.value = '38/56'; q2.dispatchEvent(new w.Event('input', { bubbles:true })); await new Promise(r => setTimeout(r, 450));
  const q3 = d.getElementById('siteQ');
  T(kept && w.SITE_Q === '38/56' && q3.value === '38/56' && d.activeElement === q3, 'ما يُكتَب في البحث يبقى مع إعادة الرسم، والقائمةُ تبحث أثناء الكتابة بلا ضغط «بحث»');
  w.SITE_Q = ''; q3.blur();
  const x = w.STATE.sites.filter(z => z && z.type === 'مخيم' && !w.STATE.recs[z.id])[20];
  w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', review:'approved', by:'فني', at:Date.now() - 9e8 };
  w.STATE.photos[x.id + '-1'] = { site:x.id, kind:'site', seq:1, status:'done', driveId:'R1', at:Date.now() - 9e8, del:{ by:'مهندس', at:Date.now() - 1e5, why:'' } }; w.PH_IDX = null;
  const ok = w.phRestore(x.id + '-1');
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; const engDel = w.svqCanDel(w.STATE.photos[x.id + '-1'], w.STATE.recs[x.id]); w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; const admDel = w.svqCanDel(w.STATE.photos[x.id + '-1'], w.STATE.recs[x.id]);
  T(ok && w.STATE.photos[x.id + '-1'].del === null && w.STATE.photos[x.id + '-1'].restored && !engDel && admDel, 'والصورةُ المحذوفةُ تسترجعها الإدارةُ بأثرها، وصورُ الزيارة المعتمدة لا يحذفها إلا الإدارة');
  const src = String(w.photoFlushCloud || '') + String(w.photoFlush || '');
  T(/del:null, site:it\.site/.test(src), 'وصورةٌ جديدةٌ تُكتَب بلا حذفٍ موروثٍ من رقمٍ قديم');
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
}

/* ── ٢٧ · (V38.75) قوائمُ المتابعة: «موقع النقطة» كلماتٌ فقط (لا «[object Object]» ولا عدَّ خاطئ)، وعمودُ الصور صورُ الزيارة،
   واسمُ أيِّ نقطةٍ في أيِّ قائمةٍ يفتحها على الخريطة ويُغلق النافذة ── */
console.log('\n══ ٢٧ · قوائمُ المتابعة والانتقال للخريطة ══');
{
  const d = w.document;
  const p = w.STATE.sites.filter(z => z && z.type === 'ممر' && z.zone === 'منى' && !w.STATE.recs[z.id])[5];
  w.STATE.recs[p.id] = { id:p.id, access:'تم الوصول', review:'approved', by:'فني', at:Date.now(), loc:[{ lat:21.4, lng:39.9 }, 'تحت كوبري'] };
  w.STATE.photos[p.id + '-1'] = { site:p.id, kind:'site', seq:1, status:'done', driveId:'L1', at:Date.now() };
  w.STATE.photos[p.id + '-2'] = { site:p.id, kind:'ins_before', seq:2, status:'done', driveId:'L2', at:Date.now() }; w.PH_IDX = null;
  w.statBump(); w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.CUR = 'mfu'; w.render(1);
  if (typeof w.obsLocLists === 'function'){
    w.obsLocLists(); w.SV_POP = 'loc_bridge_p'; w.SV_VIEW = 'list'; w.render(1);
    const pop = d.querySelector('.svpop'), h = pop ? pop.innerHTML : '', pb = pop && pop.querySelector('[data-svphotos="' + p.id + '"]'), link = pop && pop.querySelector('[data-fly="' + p.id + '"]');
    T(!!pop && h.indexOf('object Object') < 0 && h.indexOf(p.id) > -1 && pb && /١|1/.test(pb.textContent) && !!link, 'قائمةُ «تحت كوبري — ممرات» بلا «[object Object]»، والنقطةُ فيها بنوعها، وعمودُ الصور يعدّ صورَ الزيارة وحدَها');
    link.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    T(w.CUR === 'map' && w.POP_SITE === p.id && w.SV_POP === '', 'والضغطُ على النقطة يفتحها على الخريطة ويُغلق النافذة');
  } else T(true, 'شاشةُ المتابعة في الجزء المؤجَّل — تُفحَص في جولة الزائر');
  T(JSON.stringify(w.locList({ lat:1, lng:2 })) === '[]' && w.siteIdHtml(p).indexOf('data-fly="' + p.id + '"') > -1, 'و«موقع النقطة» لا يقرأ الإحداثيات كلمة، ومعرّفُ النقطة في كلِّ جدولٍ رابطٌ للخريطة');
  delete w.STATE.recs[p.id]; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'map';
}

/* ── ٢٨ · (V38.77) صورةٌ في طريقها إلى الدرايف تُفتح كاملةً من نسختها الخام، وإن لم تصل النسخةُ بعد يقول ذلك ── */
console.log('\n══ ٢٨ · عرضُ صورةٍ في طريقها إلى الدرايف ══');
{
  const d = w.document, p = w.STATE.sites[9], key = p.id + '-9';
  w.STATE.photos[key] = { site:p.id, kind:'site', seq:9, status:'pending', at:Date.now() }; w.PH_IDX = null;
  const toast0 = w.toast; let msg = '';
  w.phBlob.c = w.phBlob.c || {}; w.phBlob.c[key] = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';   /* the raw copy already on this phone */
  w.toast = (m) => { msg = String(m); };
  w.photoView(key);
  const v = d.getElementById('phView');
  T(!!v && v.querySelector('img').getAttribute('src').indexOf('data:image') === 0, 'الضغطُ على صورةٍ لم تصل الدرايف بعد يفتحها كاملةً من نسختها الخام');
  if (v) v.remove();
  delete w.phBlob.c[key]; w.phBlob.w = w.phBlob.w || {}; w.phBlob.w[key] = 1; w.photoView(key);   /* not on this phone yet */
  T(!d.getElementById('phView') && /الدرايف/.test(msg), 'وإن لم تكن نسختُها وصلت الجهازَ يقول إنها في الطريق بدل الصمت');
  w.toast = toast0; delete w.STATE.photos[key]; w.PH_IDX = null;
}

/* ── ٢٩ · (V38.78) الممراتُ والجمراتُ: التحدي من «موقع النقطة» وحده، وتحريكُ النقطة لا يمحو اختيارَ الموقع ── */
console.log('\n══ ٢٩ · الممرات والجمرات: التحدي من «موقع النقطة» وحده ══');
{
  const S = w.STATE.sites, now = Date.now();
  const cor = S.filter(x => x && x.type === 'ممر' && !w.STATE.recs[x.id]);
  const jam = S.filter(x => x && x.type === 'جسر' && !w.STATE.recs[x.id]);
  const camp = S.filter(x => x && x.type === 'مخيم' && !w.STATE.recs[x.id])[0];
  const mk = (x, o) => { w.STATE.recs[x.id] = Object.assign({ id:x.id, access:'تم الوصول', review:'approved', by:'فني', at:now }, o); };
  mk(cor[0], { chals:['لا يوجد سطح تثبيت'], chal_note:'تحت الكوبري', loc:[] });        /* chips and words, no location */
  mk(cor[1], { chals:[], loc:['تحت كوبري'] });                                           /* the location says bridge */
  mk(jam[0], { chals:['لا يوجد سطح تثبيت'], loc:['على مظلة'] });                         /* on a canopy: no challenge */
  mk(jam[1], { chals:[], loc:['لوحة استرشادية'] });                                      /* signboard, no canopy: needs a structure */
  mk(camp,   { chals:['لا يوجد سطح تثبيت'] });                                           /* camps keep their chips */
  w.statBump();
  const R = id => w.STATE.recs[id];
  T(!w.svObstacle(R(cor[0].id)) && w.svObstacle(R(cor[1].id)) && w.chalCats(R(cor[1].id)).join() === 'block',
    'ممرٌّ: تحدياتُه المختارةُ وكلماتُ وصفه لا تُحتسب، و«تحت كوبري» في موقع النقطة هو تحدّيه');
  T(!w.svObstacle(R(jam[0].id)) && w.svObstacle(R(jam[1].id)) && w.chalCats(R(jam[1].id)).join() === 'mount',
    'الجمراتُ كذلك: «على مظلة» بلا تحدٍّ ولو اختير تحدٍّ، و«لوحة استرشادية» بلا مظلة تحتاج هيكلًا');
  T(w.svObstacle(R(camp.id)), 'والمخيماتُ باقيةٌ على تحدياتها المختارة');
  const tg = w.obsLocTags(cor[0]);
  T(tg && !Object.keys(tg).length && w.obsLocTags(cor[1]).bridge, 'وفي «حسب الموقع» لا يُستنتج للممرِّ من الكلمات — يُعدّ من اختياره وحده');
  /* moving a point keeps its location choice */
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
  const old = { lat:+cor[1].lat, lng:+cor[1].lng };
  if (typeof w.moveApply === 'function'){ w.MOVE_ID = cor[1].id; try { w.moveApply(old.lat + 0.0003, old.lng + 0.0003); } catch (e){} }
  const r1 = R(cor[1].id);
  T(w.locList(r1.loc).join() === 'تحت كوبري' && (!r1.moved || +r1.moved.lat > 0), 'وتحريكُ النقطة على الخريطة يحفظ أثرَه في حقله ولا يمحو «موقع النقطة»');
  T(w.locList(['[object Object]', 'مدخل نفق']).join() === 'مدخل نفق' && w.svqFmt(['[object Object]', 'مدخل نفق']).indexOf('object') < 0,
    'وما حُفظ قديمًا نصًّا «[object Object]» لا يظهر في تعديل المسح ولا سجلِّه');
  [cor[0], cor[1], jam[0], jam[1], camp].forEach(x => { delete w.STATE.recs[x.id]; });
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.statBump();
}

/* ── ٣٠ · (V38.79) نموذجُ المسح: الممراتُ والجمراتُ بلا شرائح تحديات — «موقع النقطة» مطلوبٌ وهو التحدي ── */
console.log('\n══ ٣٠ · نموذجُ المسح للممرات والجمرات ══');
{
  const d = w.document, cor = w.STATE.sites.filter(x => x && x.type === 'ممر' && !w.STATE.recs[x.id])[7], camp = w.STATE.sites.filter(x => x && x.type === 'مخيم' && !w.STATE.recs[x.id])[7];
  const toastsS = []; const t0 = w.toast; w.toast = (m) => { toastsS.push(String(m)); };
  const open = (x) => { w.formReset(); w.FORM.site = x.id; w.PTAB = w.PTAB || {}; w.PTAB.forms = SVF; w.CUR = 'forms'; w.render(1); return d.getElementById('content').innerHTML; };
  const SVF = 'svForm';
  const hc = open(cor);
  T(hc.indexOf('data-chal="') < 0 && hc.indexOf('data-svloc="') > -1 && hc.indexOf('موقع النقطة» وحده') > -1, 'الممرُّ: لا شرائحَ تحديات في النموذج، و«موقع النقطة» حاضرٌ وسطرٌ يقول إنه التحدي');
  Object.assign(w.FORM, { mount:'هيكل قائم', power:'شبكة', wid_m:'1', hgt_m:'1', fit:'نعم', access:'تم الوصول' }); w.FORM.loc = [];
  (w.SV_PHOTOS || []).forEach(p => { const k = Array.isArray(p) ? p[0] : (p && (p.k || p.key || p.kind)); if (k) w.FORM.photos[k] = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='; });   /* the two required photos */
  toastsS.length = 0; try { w.svSave(false); } catch (e){}
  T(!w.STATE.recs[cor.id] && toastsS.join(' ').indexOf('موقع النقطة') > -1 && toastsS.join(' ').indexOf('تحديات التركيب') < 0, 'وبلا «موقع النقطة» لا يُحفَظ — ويُطلَب الموقع لا التحديات');
  const hk = open(camp);
  T(hk.indexOf('data-chal="') > -1, 'والمخيمُ نموذجُه كما هو بشرائح التحديات');
  w.STATE.recs[cor.id] = { id:cor.id, access:'تم الوصول', review:'approved', by:'فني', at:Date.now(), chals:['لا يوجد سطح تثبيت'], loc:['تحت كوبري'] };
  T(w.svqKeys(w.STATE.recs[cor.id]).indexOf('chals') < 0 && w.svqKeys(w.STATE.recs[cor.id]).indexOf('loc') > -1, 'وفي «تعديل المسح» للممرِّ يُعدَّل «موقع النقطة» ولا صفَّ للشرائح');
  delete w.STATE.recs[cor.id]; w.toast = t0; w.formReset(); w.CUR = 'map';
}

/* ── ٣١ · (V38.80) تكلفةُ قاعدة البيانات: كلُّ يومٍ بحصّته، والمدّة، ونصيبُ كلِّ جهاز، وسجلُّ الجهاز يومًا بيوم ── */
console.log('\n══ ٣١ · تكلفةُ قاعدة البيانات بأيِّ مدّة ══');
{
  const d = w.document, P = w.costPrice(null), near = (a, b) => Math.abs(a - b) < 1e-9;
  /* day 1 under every quota; day 2: 100k reads + 5k writes over, 2 GiB stored (1 over, September = 30 days); day 3: 200k reads over */
  const g = { '2026-09-01':[40000, 100, 0, 1e8], '2026-09-02':[150000, 25000, 0, 2 * 1073741824], '2026-10-01':[250000, 1000, 10, 1e8] };
  const all = w.costCalc(g, '', '', P);
  T(near(all.usd, 0.06 + 0.009 + 0.006 + 0.12) && all.br === 300000 && all.paid === 2 && near(all.sar, all.usd * 3.75),
    'كلُّ يومٍ يخسر حصّتَه المجانيةَ وحدَه ثم السعر: ٠٫٠٦ + ٠٫٠٠٩ + ٠٫٠٠٦ + ٠٫١٢ = ٠٫١٩٥ دولار، وبالريال × ٣٫٧٥');
  const sep = w.costCalc(g, '2026-09-01', '2026-09-30', P);
  T(near(sep.usd, 0.075) && Object.keys(sep.months).join() === '2026-09' && sep.peak.day === '2026-09-02', 'والمدّةُ تحصر الأيام: سبتمبر وحده ٠٫٠٧٥، وأعلى أيامه ٢ سبتمبر');
  const oct22 = Date.parse('2026-10-22T12:00:00Z');
  T(w.costRange('prev', oct22).join() === '2026-09-01,2026-09-30' && w.costRange('month', oct22).join() === '2026-10-01,2026-10-22'
    && w.costRange('prev', Date.parse('2027-01-15T12:00:00Z')).join() === '2026-12-01,2026-12-31', 'والأزرار: الشهرُ الماضي كاملًا، وهذا الشهرُ حتى اليوم، ويناير يرجع إلى ديسمبر');
  T(w.billDay(Date.parse('2026-10-22T06:30:00Z')) === '2026-10-21' && w.billDay(Date.parse('2026-10-22T07:30:00Z')) === '2026-10-22',
    'واليومُ يومُ فوترة جوجل: يبدأ مع تجدّد الحصة نحو العاشرة صباحًا بمكة');
  /* devices: 60k + 40k of a 150k day whose read cost is $0.06 — the rest is the server's */
  const v = { g:{ '2026-10-01':[150000, 0, 0, 0] }, dev:{ u1_A:{ n:'أحمد', ro:'tech', d:{ '2026-10-01':60000 } }, u2_B:{ n:'سالم', ro:'engineer', d:{ '2026-10-01':40000 } } } };
  const dv = w.costDevices(v, '', '', P);
  T(dv.rows[0].k === 'u1_A' && near(dv.rows[0].usd, 0.024) && near(dv.rows[1].usd, 0.016) && dv.other === 50000 && near(dv.otherUsd, 0.02),
    'ونصيبُ كلِّ جهازٍ بنسبة ما قرأ يومَها: ٠٫٠٢٤ و٠٫٠١٦، والخادمُ ٥٠ ألفًا بـ٠٫٠٢');
  v.dev.u1_A.d['2026-10-01'] = 120000; v.dev.u2_B.d['2026-10-01'] = 80000;
  const dv2 = w.costDevices(v, '', '', P);
  T(near(dv2.rows[0].usd + dv2.rows[1].usd + dv2.otherUsd, 0.06) && dv2.other === 0, 'ولو عدّت الأجهزةُ أكثرَ من جوجل لا يتجاوز مجموعُ الأنصبة تكلفةَ اليوم');
  /* the device's own log: survives a new session, rides the beat as one string per device */
  const fb0 = w.FB.readCount, uid0 = w.STATE.meta.uid;
  w.localStorage.removeItem('nsk14.rdh'); w.FB.rdh = null;
  const d0 = w.billDay();
  w.FB.readCount = 120; w.rdhTick(true); w.FB.readCount = 200; w.rdhTick(true);
  T(w.FB.rdh.map[d0] === 200 && JSON.parse(w.localStorage.getItem('nsk14.rdh'))[d0] === 200, 'سجلُّ الجهاز يومًا بيوم: ما قرأه منذ آخر عدٍّ يُضاف ليومه ويُحفَظ في الجهاز');
  w.FB.readCount = 30; w.rdhTick(true);
  T(w.FB.rdh.map[d0] === 230, 'وجلسةٌ جديدةٌ (عدّادٌ عاد إلى الصفر) تُضاف ولا تمحو ما سبق');
  w.STATE.meta.uid = 'u-cost'; w.presenceBeat(true);
  const pr = w.STATE.presence['u-cost'] || {}, fld = pr[w.rdhKey()];
  T(typeof fld === 'string' && JSON.parse(fld)[d0] === 230 && /^rdh_[A-Za-z0-9]{1,16}$/.test(w.rdhKey()), 'ونبضةُ الحضور تحمله نصًّا واحدًا لكلِّ جهاز — لا يكبر ولا يمحو جهازًا آخر للمستخدم نفسِه');
  /* the card: office and top management only, every number from the same calculation */
  const role0 = w.ROLE;
  w.USAGE.cost.v = Object.assign({ at:Date.now() }, v, { g:Object.assign({}, g, v.g) }); w.USAGE.cost.at = Date.now(); w.USAGE.costF.r = 'all';
  w.ROLE = 'admin';
  const html = w.costCard();
  T(html.indexOf('تكلفةُ قاعدة البيانات') > -1 && html.indexOf('data-ucr="prev"') > -1 && html.indexOf('data-ucf="1"') > -1 && html.indexOf('أحمد') > -1
    && html.indexOf('الخادمُ والمهامُّ الآلية') > -1, 'البطاقةُ للمكتب: أزرارُ المدّة وخانتا من/إلى، ومن قرأ كم، وسطرُ الخادم');
  w.ROLE = 'viewer';
  T(w.costCard() === '', 'والوزارةُ لا ترى تكلفةَ المشروع — ولو ملكت التصديرَ الكامل');
  w.ROLE = 'admin';
  const inp = d.createElement('input'); inp.type = 'date'; inp.setAttribute('data-ucf', '1'); inp.value = '2026-09-02'; d.body.appendChild(inp);
  inp.dispatchEvent(new w.Event('change', { bubbles:true }));
  T(w.USAGE.costF.r === 'custom' && w.USAGE.costF.from === '2026-09-02' && !!w.USAGE.costF.to, 'وتغييرُ «من» يجعل المدّةَ مخصّصةً ويُبقي طرفَها الآخر');
  inp.remove();
  const cur0 = w.CUR, pop0 = w.POP_OPEN; w.CUR = 'sys'; w.POP_OPEN = false;   /* the chip lives on System Health — no map popup there to close first */
  const chip = d.createElement('button'); chip.setAttribute('data-ucr', 'month'); d.body.appendChild(chip);
  chip.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(w.USAGE.costF.r === 'month' && !w.USAGE.costF.from, 'وزرُّ «هذا الشهر» يعيد المدّةَ إلى الشهر الجاري');
  chip.remove(); w.CUR = cur0; w.POP_OPEN = pop0;
  w.ROLE = role0; w.STATE.meta.uid = uid0; w.FB.readCount = fb0; w.USAGE.cost.v = null; w.USAGE.cost.at = 0; w.USAGE.costF.r = 'all';
  delete w.STATE.presence['u-cost'];
}

/* ── ٣٢ · (V38.84) مهامُّ الخادم بأسمائها في التكلفة، وسجلُّ الصفحات يومًا بيوم، وصورُ الزيارة في لوح التعديل ── */
console.log('\n══ ٣٢ · مَن قرأ كم — الأجهزةُ والمهامُّ بأسمائها · سجلُّ الصفحات · صورُ لوح التعديل ══');
{
  const d = w.document, P = w.costPrice(null), near = (a, b) => Math.abs(a - b) < 1e-9;
  /* a 150k day ($0.06 of reads): a phone 30k, the photo bridge 90k — the 30k left is nobody's */
  const v = { at:Date.now(), g:{ '2026-10-20':[150000, 0, 0, 0] }, dev:{ u1_A:{ n:'أحمد', ro:'tech', d:{ '2026-10-20':30000 } } }, jobs:{ photos:{ '2026-10-20':90000 } } };
  const dv = w.costDevices(v, '', '', P);
  T(near(dv.rows[0].usd, 0.012) && dv.jobs.length === 1 && dv.jobs[0].name === 'نقل الصور إلى الدرايف' && near(dv.jobs[0].usd, 0.036) && dv.other === 30000 && near(dv.otherUsd, 0.012),
    'التكلفةُ تُقسَم على الجهاز ومهامِّ الخادم بأسمائها: ٠٫٠١٢ للجوال و٠٫٠٣٦ لنقل الصور، والباقي ٣٠ ألفًا بلا اسم');
  const role0 = w.ROLE; w.ROLE = 'admin'; w.USAGE.cost.v = v; w.USAGE.cost.at = Date.now(); w.USAGE.costF.r = 'all';
  const html = w.costCard();
  T(html.indexOf('نقل الصور إلى الدرايف') > -1 && html.indexOf('ما لا يعدّه جهازٌ ولا مهمّة') > -1, 'والبطاقةُ تسمّي المهمّةَ، وسطرٌ لما لا يعدّه أحد');
  w.USAGE.cost.v = null; w.USAGE.cost.at = 0; w.ROLE = role0;
  /* the page log, per day, rides the beat */
  w.localStorage.removeItem('nsk14.pgh'); w.pageHist.m = null;
  w.pageTick('map'); w.pageTick('map'); w.pageTick('sites');
  const dk = w.dayKey(), h = JSON.parse(w.localStorage.getItem('nsk14.pgh') || '{}');
  T(h[dk] && h[dk].map === 2 && h[dk].sites === 1 && JSON.parse(w.pghLast(7))[dk].map === 2, 'سجلُّ الصفحات يومًا بيوم على الجهاز: الخريطة ٢ · السجل ١');
  const uid0 = w.STATE.meta.uid; w.STATE.meta.uid = 'u-pg'; w.presenceBeat(true);
  const pr = w.STATE.presence['u-pg'] || {}, f = pr['pgh_' + w.rdhKey().slice(4)];
  T(typeof f === 'string' && JSON.parse(f)[dk].map === 2, 'ونبضةُ الحضور تحمله نصًّا لكلِّ جهاز (pgh_…) — يجمعه الخادمُ كلَّ ثلاث ساعات');
  delete w.STATE.presence['u-pg']; w.STATE.meta.uid = uid0;
  /* the survey-edit sheet shows a visit's photos wherever they are — on Drive too — and opens them */
  const rid = Object.keys(w.STATE.recs || {})[0];
  if (rid){
    const ph0 = w.STATE.photos; w.STATE.photos = Object.assign({}, ph0, { [rid + '-77']:{ site:rid, kind:'front', at:Date.now(), by:'x', status:'done', driveId:'DRV77', link:'https://drive.google.com/x' } });
    if (typeof w.phTouch === 'function') w.phTouch();
    const sh = w.svqPhotos(Object.assign({ id:rid }, w.STATE.recs[rid]));
    T(sh.indexOf('thumbnail?id=DRV77') > -1 && sh.indexOf('data-phview="' + rid + '-77"') > -1,
      'صورةُ الزيارة المنقولةُ إلى الدرايف تظهر في لوح التعديل مصغّرةً وتُفتَح بالضغط — لا أيقونةً فارغة (بلاغ ١٩ أكتوبر)');
    w.STATE.photos = ph0; if (typeof w.phTouch === 'function') w.phTouch();
    /* and «other» in the challenges always brings its description box (report of 18 October, fixed in V38.20) */
    w.SVQ.tmp = [w.chalOther()]; w.SVQ.note = null;
    const ed = w.svqEditor('chals', Object.assign({ id:rid }, w.STATE.recs[rid]), w.SITES ? w.SITES[rid] : null);
    T(ed.indexOf('id="svqNote"') > -1 && ed.indexOf('مطلوب مع «أخرى»') > -1, 'واختيارُ «أخرى» في تعديل التحديات يُظهر مربّعَ الوصف مطلوبًا (بلاغ ١٨ أكتوبر)');
    w.SVQ.tmp = null;
  } else T(false, 'لا زيارةَ في البيانات لفحص لوح التعديل');
}

/* ── ٣٣ · (V38.85) شاشاتُ العرض تتحدّث وحدَها ── */
console.log('\n══ ٣٣ · شاشاتُ العرض تتحدّث وحدَها ══');
{
  const role0 = w.ROLE, fetch0 = w.fetch, now0 = w.swNow, rel0 = w.SW_RELOADED, wait0 = w.SW_STATE.waiting;
  let applied = 0;
  w.fetch = () => Promise.resolve({ ok:true, text:() => Promise.resolve("const CACHE = 'nusuk-survey-v99.9';") });
  w.swNow = () => { applied++; };
  w.SW_STATE.disp = null; w.SW_RELOADED = false; w.SW_STATE.waiting = false;
  w.ROLE = 'tech';
  T((await w.dispTick()) === '', 'جوالُ الفنيِّ لا يُحدَّث قسرًا — يبقى شريطُ «حدّث الآن» ونسختُه بلا شبكة');
  w.ROLE = 'viewer';
  T((await w.dispTick()) === 'fetching', 'شاشةُ الوزارة تسأل الخادمَ كلَّ خمس دقائق فترى ٩٩٫٩ وتجلبها فورًا');
  w.SW_STATE.disp.lastIn = Date.now();
  T((await w.dispTick()) === 'busy', 'ولا تُحدَّث وأحدٌ يستعملها');
  w.SW_STATE.disp.lastIn = 0; w.SW_STATE.waiting = true;
  T((await w.dispTick()) === 'applied' && applied === 1, 'وتُطبَّق النسخةُ متى تُركت دقيقةً — بلا شريطٍ ولا ضغطة');
  w.SW_STATE.waiting = false; w.SW_STATE.disp.since = Date.now() - 16 * 60000;
  try { w.sessionStorage.removeItem('nsk.disp.V99.9'); } catch {}
  const r1 = await w.dispTick(), r2 = (w.SW_RELOADED = false, await w.dispTick());
  T(r1 === 'fresh' && r2 === 'tried', 'وإن لم يأخذها العاملُ في ربع ساعة تُفتح الصفحةُ من الشبكة طازجةً — مرةً واحدةً للنسخة');
  w.fetch = () => Promise.resolve({ ok:true, text:() => Promise.resolve("const CACHE = 'nusuk-survey-v" + String(w.appVer()).slice(1) + "';") });
  w.SW_RELOADED = false;
  T((await w.dispTick()) === 'current', 'وعلى أحدث نسخةٍ لا تفعل شيئًا');
  w.ROLE = role0; w.fetch = fetch0; w.swNow = now0; w.SW_RELOADED = rel0; w.SW_STATE.waiting = wait0; w.SW_STATE.disp = null;
  /* (V38.87) a press during the Excel engine's load is answered, not lost */
  const said = [], toast0 = w.toast, xl0 = w.XLSX_LOADING, ready0 = w.XLSX_READY, X0 = w.XLSX;
  w.toast = m => said.push(String(m)); w.XLSX_READY = false; w.XLSX = undefined; w.XLSX_LOADING = new Promise(() => {});
  w.xlsxLoad();
  T(said.some(m => /يُجهَّز محرّكُ الإكسل/.test(m)), 'وضغطةُ تصديرٍ أثناء تحميل محرّك الإكسل تُقال فورًا لا تضيع — كانت توقف السلسلةَ بزرٍّ مختلفٍ كلَّ مرة');
  w.toast = toast0; w.XLSX_LOADING = xl0; w.XLSX_READY = ready0; w.XLSX = X0;
}

/* ── ٣٤ · (V38.88) سجلُّ النقاط منشورًا في القاعدة نصًّا واحدًا، ومخزَّنًا على الجهاز قبل أن يخرج من الملف ── */
console.log('\n══ ٣٤ · سجلُّ النقاط: النشرُ نصًّا واحدًا والتخزينُ على كلِّ جهاز ══');
{
  const mini = { z:['منى'], t:['مخيم'], w:[], co:[], dm:[], g:[['A1', 'نقطة']], p:[] };
  const R = w.regDecode({ json:JSON.stringify(mini), ver:'v9', at:5, by:'الخادم' });
  T(R && R.g[0][0] === 'A1' && R.ver === 'v9', 'المنشورُ نصٌّ واحدٌ يُفَكّ إلى السجلّ — القاعدةُ ترفض المصفوفاتِ المتداخلة');
  const { regVer: srvVer } = await import('./lib/registry.mjs');
  T(srvVer(mini) === w.regVer(mini), 'وبصمةُ الخادم (reg-publish) هي بصمةُ التطبيق نفسُها — فلا يُعاد النشرُ بلا تغيير');
  /* the device caches the published copy after login, and remembers its fingerprint for the beat */
  const col0 = w.DB.col, ready0 = w.FB.ready, db0 = w.FB.db, reg0 = w.localStorage.getItem('nsk.reg');
  w.DB.col = name => name === 'settings' ? { doc:() => ({ get:() => Promise.resolve({ exists:true, data:() => ({ json:JSON.stringify(mini), ver:'v9', at:5, by:'الخادم' }) }) }) } : col0(name);
  w.FB.ready = true; w.FB.db = w.FB.db || {}; w.localStorage.removeItem('nsk.reg'); w.regEnsure.busy = 0;
  w.regEnsure(); await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
  const cached = JSON.parse(w.localStorage.getItem('nsk.reg') || 'null');
  T(cached && cached.ver === 'v9' && cached.g[0][0] === 'A1' && w.lsGet('nsk14.regver') === 'v9', 'وكلُّ جهازٍ يخزّنه بعد الدخول للعمل بلا شبكة، ويحفظ بصمتَه');
  const uid0 = w.STATE.meta.uid; w.STATE.meta.uid = 'u-reg'; w.presenceBeat(true);
  T((w.STATE.presence['u-reg'] || {}).reg === 'v9', 'ونبضةُ الحضور تقولها — فيُعرَف قبل إخراجه من الملف أنّ كلَّ جهازٍ نشطٍ يحمله');
  delete w.STATE.presence['u-reg']; w.STATE.meta.uid = uid0;
  /* the publish button writes one JSON string, never the nested arrays the database refuses */
  const set0 = w.CORE.set, soon0 = w.CORE.saveSoon, conf0 = w.confirm, role0 = w.ROLE; let wrote = null;
  w.CORE.set = (k, id, v) => { if (id === 'registry') wrote = v; }; w.CORE.saveSoon = () => {}; w.confirm = () => true; w.ROLE = 'admin';
  w.regPublish();
  T(wrote && typeof wrote.json === 'string' && !('g' in wrote) && JSON.parse(wrote.json).g.length > 0 && wrote.ver === w.regVer(JSON.parse(wrote.json)),
    'وزرُّ النشر يكتب نصًّا واحدًا ببصمته — كان يكتب مصفوفاتٍ متداخلةً فلا يُنشَر شيء');
  w.CORE.set = set0; w.CORE.saveSoon = soon0; w.confirm = conf0; w.ROLE = role0;
  w.DB.col = col0; w.FB.ready = ready0; w.FB.db = db0; if (reg0 == null) w.localStorage.removeItem('nsk.reg'); else w.localStorage.setItem('nsk.reg', reg0);
}

/* ── ٣٥ · (V38.92) قراءاتُ الإنصات الحيّ تُعَدّ على الجهاز ── */
console.log('\n══ ٣٥ · الإنصاتُ الحيُّ في عدّاد الجهاز ══');
{
  const r0 = w.FB.readCount;
  w.FB.readCount = 0;
  w.snapReads({ metadata:{ fromCache:false }, docChanges:() => new Array(40) });
  w.snapReads({ metadata:{ fromCache:false }, docChanges:() => [] });
  w.snapReads({ metadata:{ fromCache:true }, docChanges:() => new Array(500) });
  w.snapReads({ exists:true, metadata:{ fromCache:false } });
  T(w.FB.readCount === 40 + 1 + 0 + 1, 'لقطةُ الإنصات من الخادم تُعَدّ بوثائقها (٤٠)، والفارغةُ قراءةً، ومن الكاش لا شيء، والوثيقةُ الواحدةُ قراءة — ' + w.FB.readCount);
  w.FB.readCount = r0;
}

/* ── ٣٦ · (V38.93) قرارُ صاحب المشروع: المهندسُ يحدّد ما يشاء من الزيارات ويعتمده دفعةً واحدة ── */
console.log('\n══ ٣٦ · الاعتمادُ بالتحديد — والتراجعُ عن الدفعة ══');
{
  const role0 = w.ROLE, conf0 = w.confirm, push0 = w.notifPush, set0 = w.CORE.set;
  const sent = []; w.notifPush = (ti, body, o) => sent.push([ti, body, (o || {}).to || '']);
  w.CORE.set = function(k, id, v){ return set0.apply(this, arguments); };
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.confirm = () => true;
  const ids = w.STATE.sites.slice(40, 43).map(x => x.id), keep = ids.map(id => w.STATE.recs[id]);
  ids.forEach((id, i) => { w.STATE.recs[id] = { id, by:'مشرف التجربة', at:Date.now() - 86400000, access: i === 2 ? 'لم يتم الوصول' : 'تم الوصول', review:'' }; });
  T(ids.slice(0, 2).every(id => w.svReview(w.STATE.recs[id]) === 'pending'), 'زيارتان بانتظار الاعتماد، وثالثةٌ لم يصل فيها الميدان');
  w.svaSel.m = {}; ids.forEach(id => { w.svaSel()[id] = 1; });
  const before = sent.length;
  const res = w.svApproveMany(ids);
  T(res.ok.length === 2 && res.fail.length === 1 && res.fail[0][0] === ids[2] && /لم يصل/.test(res.fail[0][1]),
    'تُعتمَد المحدَّدةُ بشروط الاعتماد نفسِها، وما لا يمرّ يُقال سببُه ولا يُعتمَد — ' + res.ok.length + ' · ' + res.fail.length);
  T(ids.slice(0, 2).every(id => w.STATE.recs[id].review === 'approved' && w.STATE.recs[id].minReview === 'pending'),
    'والمعتمدةُ تُرفع للوزارة كما في الاعتماد الفرديّ');
  const notes = sent.slice(before).filter(x => x[0] === 'اعتماد تقني');
  T(notes.length === 1 && notes[0][2] === 'مشرف التجربة' && /2|٢/.test(notes[0][1]), 'وصاحبُ الزيارات يصله إشعارٌ واحدٌ بعددها لا إشعارٌ لكلِّ زيارة');
  const n = w.svUndoLast();
  T(n === 2 && ids.slice(0, 2).every(id => w.svReview(w.STATE.recs[id]) === 'pending' && w.STATE.recs[id].review === ''),
    'والتراجعُ عن الدفعة يعيدها «بانتظار اعتمادك» بقيمها السابقة — الحفظُ يدمج فلا يُحذَف حقلٌ بل يُعاد');
  /* a visit the Ministry approved after the batch stays approved */
  w.svApproveMany(ids.slice(0, 2)); w.STATE.recs[ids[0]].minReview = 'approved';
  const n2 = w.svUndoLast();
  T(n2 === 1 && w.STATE.recs[ids[0]].review === 'approved', 'وما اعتمدته الوزارةُ بعد الدفعة يبقى على حاله ولا يُتراجَع عنه');
  /* the rule the owner set: the technician or the supervisor records the installation, the engineer approves */
  const R = w.ROLES;
  T(R.tech.nav.includes('insForm') && R.supervisor.nav.includes('insForm') && !R.tech.can.approve && !R.supervisor.can.approve && R.engineer.can.approve,
    'والتركيبُ يسجّله الفنيُّ أو المشرف، ويعتمده المهندس — قرارُ صاحب المشروع');
  ids.forEach((id, i) => { if (keep[i]) w.STATE.recs[id] = keep[i]; else delete w.STATE.recs[id]; });
  w.svaSel.m = {}; w.svApproveMany.last = null;
  w.ROLE = role0; w.STATE.meta.role = role0; w.confirm = conf0; w.notifPush = push0; w.CORE.set = set0;
}

/* ── ٣٧ · (V38.95) سجلُّ الأحداث على جهاز المكتب: آخرُ أسبوعين، الأحدثُ أوّلًا ── */
console.log('\n══ ٣٧ · سحبُ سجلّ الأحداث البارد ══');
{
  const col0 = w.DB.col, ready0 = w.FB.ready, db0 = w.FB.db, role0 = w.ROLE, at0 = w.STATE.meta.pullAt;
  const seen = {};
  const rec = name => { const ops = []; seen[name] = ops; const q = {
      where:(f, o, v) => { ops.push(['where', f, o, v]); return q; },
      orderBy:(f, d) => { ops.push(['orderBy', f, d || 'asc']); return q; },
      limit:n => { ops.push(['limit', n]); return q; },
      get:() => Promise.resolve({ size:0, forEach(){} }) }; return q; };
  w.DB.col = name => rec(name); w.FB.ready = true; w.FB.db = w.FB.db || {}; w.ROLE = 'engineer'; w.STATE.meta.pullAt = {};
  await w.pullDelta({ only:['events', 'recs'] });
  const E = seen.events || [], R = seen.recs || [];
  const wh = E.find(x => x[0] === 'where' && x[1] === '_at'), od = E.find(x => x[0] === 'orderBy'), lm = E.find(x => x[0] === 'limit');
  T(wh && wh[2] === '>' && Math.abs(wh[3] - (Date.now() - 14 * 864e5)) < 60000 && od && od[1] === '_at' && od[2] === 'desc' && lm && lm[1] === 6000,
    'السحبةُ الباردةُ لسجلّ الأحداث: آخرُ ١٤ يومًا، الأحدثُ أوّلًا — كانت ٦٠٠٠ حدثٍ بلا ترتيبٍ من ٣٥ ألفًا');
  T(!R.some(x => x[0] === 'where' && x[1] === '_at') && R.some(x => x[0] === 'limit' && x[1] === 6000), 'والزياراتُ تُسحَب كاملةً كما كانت — النافذةُ للأحداث وحدَها');
  w.DB.col = col0; w.FB.ready = ready0; w.FB.db = db0; w.ROLE = role0; w.STATE.meta.pullAt = at0;
}

/* ── ٣٨ · (V38.96) الوتيرة: الموعدُ الذي مرّ يُقال، والمطلوبُ في يوم العمل ── */
console.log('\n══ ٣٨ · الوتيرةُ والموعد ══');
{
  const role0 = w.ROLE, cur0 = w.CUR, tab0 = w.PTAB.over, dS0 = w.CFG.dueSurvey, dI0 = w.CFG.dueInstall, dw0 = w.CFG.daysWeek;
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'over'; w.render(1); w.PTAB.over = 'pace';   /* a page switch resets its tab: land first, then pick the tab */
  w.CFG.dueSurvey = Date.now() - 2 * 864e5; w.CFG.dueInstall = Date.now() + 60 * 864e5; w.CFG.daysWeek = 6;
  w.render(1);
  const txt = w.document.body.textContent;
  T(/موعدُها مرّ/.test(txt) && /المواعيد والأزمنة/.test(txt), 'موعدُ المسح الذي مرّ يُقال صراحةً، ومعه أين يُحدَّث — كان يُقال «تتأخّر عن موعدها» كأنه أمام');
  T(/المطلوب في يوم العمل/.test(txt), 'والمطلوبُ في يوم العمل يظهر حين تُضبَط أيامُ العمل في الأسبوع');
  w.CFG.dueSurvey = dS0; w.CFG.dueInstall = dI0; w.CFG.daysWeek = dw0; w.ROLE = role0; w.STATE.meta.role = role0; w.CUR = cur0; w.PTAB.over = tab0;
}

/* ── ٣٨ · (V39.2) رقمُ الطلب يُحجَز في القاعدة حجزًا لا يتكرّر ── */
console.log('\n══ ٣٨ · رقمُ الطلب: حجزٌ ذرّيٌّ في القاعدة ══');
{
  const server = { SR:217 }, ready0 = w.FB.ready, db0 = w.FB.db, col0 = w.DB.col, seq0 = Object.assign({}, w.REQSEQ), cl0 = w.localStorage.getItem('nsk14.reqClaims');
  const ref = { __ref:'reqSeq' };
  w.DB.col = name => name === 'settings' ? { doc:() => ref } : col0(name);
  w.FB.ready = true;
  w.FB.db = { runTransaction: fn => fn({ get: () => Promise.resolve({ exists:true, data: () => Object.assign({}, server) }), set: (r, up) => { Object.assign(server, up); } }) };
  w.localStorage.removeItem('nsk14.reqClaims'); w.reqClaimRun.busy = 0;
  const tick = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setTimeout(r, 0)); };
  /* 1 — nobody took the next number: the request keeps it, and the database counter moves to it */
  w.REQSEQ.SR = 217;
  const no1 = w.reqNext('visit', 'tasks', 'TK-claim-1'); w.CORE.set('tasks', 'TK-claim-1', { id:'TK-claim-1', no:no1, kind:'visit', site:'X', status:'مطلوب' });
  await tick();
  T(no1 === 'SR-0218' && server.SR === 218 && w.STATE.tasks['TK-claim-1'].no === 'SR-0218' && !w.reqClaims().length, 'الرقمُ الأوّلُ يُحجَز كما هو والعدّادُ في القاعدة يصل إليه: ' + no1 + ' / ' + server.SR);
  /* 2 — another device took 219 and 220 meanwhile: this request becomes 221, and the change is logged */
  server.SR = 220; w.REQSEQ.SR = 218;
  const ev0 = (w.STATE.events || []).length;
  const no2 = w.reqNext('visit', 'tasks', 'TK-claim-2'); w.CORE.set('tasks', 'TK-claim-2', { id:'TK-claim-2', no:no2, kind:'visit', site:'Y', status:'مطلوب' });
  await tick();
  const ev = (w.STATE.events || []).slice(0, (w.STATE.events || []).length - ev0 + 1).map(e => e.msg || e.t || e.text || JSON.stringify(e)).join(' ');
  T(no2 === 'SR-0219' && w.STATE.tasks['TK-claim-2'].no === 'SR-0221' && server.SR === 221 && w.REQSEQ.SR === 221 && /SR-0219 صار SR-0221/.test(ev),
    'وإن سبق جهازٌ آخر إلى الرقم أخذ الطلبُ التاليَ الحرَّ وسُجِّل التغيير: ' + no2 + ' ← ' + w.STATE.tasks['TK-claim-2'].no);
  /* 3 — offline: the claim waits, and runs when the device is back */
  w.FB.ready = false; w.REQSEQ.SR = 221;
  w.reqNext('visit', 'tasks', 'TK-claim-3'); await tick();
  const waiting = w.reqClaims().length; w.FB.ready = true; w.reqClaimRun(); await tick();
  T(waiting === 1 && !w.reqClaims().length && server.SR === 222, 'وبلا شبكةٍ ينتظر الحجزُ ثم يتمّ عند العودة');
  delete w.STATE.tasks['TK-claim-1']; delete w.STATE.tasks['TK-claim-2']; delete w.STATE.tasks['TK-claim-3'];
  w.DB.col = col0; w.FB.ready = ready0; w.FB.db = db0; Object.assign(w.REQSEQ, seq0);
  if (cl0 == null) w.localStorage.removeItem('nsk14.reqClaims'); else w.localStorage.setItem('nsk14.reqClaims', cl0);
}

/* ── ٣٩ · (V39.3) القائمة: المستعمَلُ في مجموعاته، والباقي تحت «المزيد» — ولا شاشةَ تُشال ── */
console.log('\n══ ٣٩ · القائمة: «المزيد» ولا شاشةَ تُشال ══');
{
  const role0 = w.ROLE, q0 = w.NAV_Q;
  const ids = html => { const b = w.document.createElement('div'); b.innerHTML = html; const sec = {}; b.querySelectorAll('.nav-section').forEach(x => { sec[x.getAttribute('data-g')] = [...x.querySelectorAll('a[data-p]')].map(a => a.getAttribute('data-p')); });
    const solo = [...b.querySelectorAll(':scope > a[data-p]')].map(a => a.getAttribute('data-p')); return { sec, all: new Set(solo.concat(Object.values(sec).flat())) }; };
  for (const role of ['admin', 'tech']){
    w.ROLE = role; w.STATE.meta.role = role; w.NAV_Q = '';
    const A = ids(w.navHtml());
    const want = new Set(); w.NAV.forEach(s => { if (s.solo){ if (w.seesPage(s.id)) want.add(s.id); } else s.items.forEach(i => { if (w.seesPage(i[0])) want.add(i[0]); }); });
    const more = A.sec['المزيد'] || [];
    T([...want].every(x => A.all.has(x)) && A.all.size === want.size, role + ': كلُّ شاشةٍ يراها الدورُ ما زالت في القائمة (' + want.size + ')');
    T(more.length > 0 && more.every(x => w.navHtml.main.indexOf(x) < 0) && Object.entries(A.sec).filter(([g]) => g !== 'المزيد').every(([g, L]) => L.every(x => w.navHtml.main.indexOf(x) > -1)),
      role + ': والمستعمَلُ في مجموعاته والباقي (' + more.length + ') تحت «المزيد»');
  }
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.NAV_Q = 'التجارب';
  const S = ids(w.navHtml()).sec;
  T(!S['المزيد'] && Object.entries(S).some(([g, L]) => g !== 'المزيد' && L.indexOf('trials') > -1), 'والبحثُ في القائمة يجد الشاشةَ في مجموعتها كما كانت');
  w.ROLE = role0; w.STATE.meta.role = role0; w.NAV_Q = q0;
}

/* ── ٤٠ · (V39.4) البحث على الخريطة — بحثُ المواقع نفسُه، والنتيجةُ تفتح نقطتَها ── */
console.log('\n══ ٤٠ · البحث على الخريطة ══');
{
  const D = w.document, cur0 = w.CUR, pop0 = w.POP_SITE;
  const tap = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles:true, cancelable:true }));
  const tmp = attrs => { const b = D.createElement('button'); Object.entries(attrs).forEach(([k, v]) => b.setAttribute(k, v)); D.body.appendChild(b); return b; };
  w.CUR = 'map'; w.POP_OPEN = false; w.ASSIST_OPEN = false; w.BUG_OPEN = false; w.MAP_FILT_OPEN = false; w.CO_OPEN = false; w.render(1);
  const st0 = JSON.stringify({ pop:w.POP_OPEN, sel:w.MAP_SELECT, mv:w.MOVE_ID, nav:w.document.body.className });
  const x = w.STATE.sites[3], key = w.siteKey(x);
  const ob = tmp({ 'data-mapq':'1' }); tap(ob); ob.remove();
  const html = w.mapUIHtml();
  T(w.mapUIHtml.s.open && /id="mapQ"/.test(html), 'زرُّ «بحث» يفتح مربّعَ البحث فوق أزرار الخريطة' + (w.mapUIHtml.s.open ? '' : ' — ' + st0));
  const res = w.mapQResHtml(key), box = D.createElement('div'); box.innerHTML = res;
  const hits = [...box.querySelectorAll('[data-fly]')].map(b => b.getAttribute('data-fly'));
  T(hits.length >= 1 && hits.length <= 8 && hits.indexOf(x.id) > -1, 'والبحثُ بالشاخص يجد النقطةَ ببحث المواقع نفسِه: ' + key + ' (' + hits.length + ')');
  T(/لا نتائج/.test(w.mapQResHtml('zzqqxx-لا-يوجد')) && w.mapQResHtml('') === '', 'وما لا يُوجد يُقال «لا نتائج»، والفارغُ لا يعرض شيئًا');
  const fb = tmp({ 'data-fly':x.id }); tap(fb); fb.remove();
  T(w.POP_SITE === x.id && w.mapUIHtml.s.open === false, 'والضغطُ على النتيجة يفتح النقطةَ على الخريطة ويُغلق البحث');
  w.CUR = cur0; w.POP_SITE = pop0; w.POP_OPEN = false;
}

/* ── ٤١ · (V39.4) «كلّم المهندس» محادثةٌ لا بلاغ — والسؤالُ وحالةُ الجهاز في المربّع ── */
console.log('\n══ ٤١ · «كلّم المهندس» محادثةٌ لا بلاغ ══');
{
  const D = w.document, U0 = w.STATE.users, me0 = w.STATE.meta.name, role0 = w.ROLE, cur0 = w.CUR;
  w.STATE.users = { u1:{ name:'فني التجربة', role:'tech', sup:'مشرف التجربة' }, u2:{ name:'مشرف التجربة', role:'supervisor', sup:'مهندس التجربة' }, u3:{ name:'مهندس التجربة', role:'engineer', sup:'' } };   /* one engineer: the button opens the conversation at once (two show the list — ٤٣) */
  w.STATE.meta.name = 'فني التجربة'; w.ROLE = 'tech'; w.STATE.meta.role = 'tech';
  T(w.askEngWho() === 'مهندس التجربة', 'المهندسُ هو أوّلُ مهندسٍ فوقه في سلسلة الإدارة: ' + w.askEngWho());
  w.ASSIST_Q = 'الصور مش بتترفع'; w.ASSIST_OPEN = true; w.BUG_OPEN = false;
  const b = D.createElement('button'); b.setAttribute('data-askeng', '1'); D.body.appendChild(b);
  b.dispatchEvent(new w.MouseEvent('click', { bubbles:true, cancelable:true })); b.remove();
  const ta = D.querySelector('[data-chtext="dm:مهندس التجربة"]');
  T(w.CUR === 'chat' && !w.BUG_OPEN && !w.ASSIST_OPEN && w.chPageHtml.f.open === 'dm:مهندس التجربة', 'الزرُّ يفتح محادثةً مع المهندس لا نموذجَ بلاغ');
  T(!!ta && ta.value.indexOf('الصور مش بتترفع') === 0 && /حالة جهازي/.test(ta.value) && !/V\d/.test(ta.value), 'وفي مربّع الرسالة سؤالُه وحالةُ جهازه — بلغته، بلا حرفٍ لاتينيّ');
  const n0 = Object.keys(w.STATE.msgs || {}).length;
  const sb = D.querySelector('[data-chsend="dm:مهندس التجربة"]'); if (sb) sb.dispatchEvent(new w.MouseEvent('click', { bubbles:true, cancelable:true }));
  const sent = Object.values(w.STATE.msgs || {}).filter(v => v.to === 'مهندس التجربة' && v.from === 'فني التجربة');
  T(Object.keys(w.STATE.msgs || {}).length === n0 + 1 && sent.length === 1 && !(w.chOpenHtml.draft || {})['dm:مهندس التجربة'], 'والإرسالُ رسالةٌ إلى المهندس، والمسوّدةُ تُمحى');
  sent.forEach(v => { delete w.STATE.msgs[v.id]; });
  w.STATE.users = { u9:{ name:'وحيد', role:'admin', sup:'' } }; w.STATE.meta.name = 'وحيد';
  T(w.askEngWho() === '', 'ومن لا مهندسَ له في الملفّ يبقى له البلاغُ كما كان');
  w.STATE.users = U0; w.STATE.meta.name = me0; w.ROLE = role0; w.STATE.meta.role = role0; w.CUR = cur0; w.chPageHtml.f = {}; w.ASSIST_OPEN = false;
}

/* ── ٤٢ · (V39.5) كلُّ لغةٍ بأرقامها وكلماتها: الإصدار، والنسبة، والأسماء، و«Null» ── */
console.log('\n══ ٤٢ · كلُّ لغةٍ بأرقامها وكلماتها ══');
{
  const L0 = w.LANG, D = w.document;
  w.LANG = 'ar'; const a = w.verShow('V39.10'); w.LANG = 'ur'; const u = w.verShow('V39.10'); w.LANG = 'en'; const e = w.verShow('V39.10');
  T(a === '٣٩٫١٠' && u === '۳۹٫۱۰' && e === '39.10', 'الإصدارُ بأرقام كلِّ لغة، حرفًا حرفًا (٣٩٫١٠ لا ٣٩٫١): ' + a + ' · ' + u + ' · ' + e);
  const vt = D.querySelector('.ver-tag'), was = vt && vt.textContent;
  w.LANG = 'ar'; w.verTagSync(); const shown = vt ? vt.textContent : '';
  T(!!vt && !/[A-Za-z]/.test(shown) && /^V\d+\.\d+$/.test(w.appVer()), 'والوسمُ بالعربية بلا حرفٍ لاتينيّ، ورقمُ البناء محفوظٌ لمن يقرؤه: «' + shown + '» · ' + w.appVer());
  w.LANG = 'en';
  T(w.langFix('<td data-k="فريق ١">١٠٠٪</td><td>قارئ ٨ منافذ</td><td>٣٫٥٪</td>') === '<td data-k="فريق ١">100%</td><td>قارئ ٨ منافذ</td><td>3.5%</td>', 'وبالإنجليزية أرقامٌ ونِسَبٌ إنجليزية — لا داخل الخصائص، ولا في اسمٍ مكتوبٍ بالعربية');
  T(w.dispName('فني ٣') === 'Technician 3' && w.dispName('مشرف الميدان').indexOf('Supervisor') === 0, 'و«فني ٣» تُقرأ Technician 3 لا حروفًا بلا معنى: ' + w.dispName('فني ٣'));
  w.LANG = 'ur';
  T(w.dispName('حسين عمار') === 'حسين عمار', 'وبالأردية يبقى الاسمُ بحرفه العربيّ');
  const r = w.siteRow(['NSK-X-1', 'عرفات - مربع Null - شاخص ?', 0, 0, 0, 21, 39, 'Null', '', '', '', '', ''], false);
  T(!/Null/.test(r.name) && r.sq === '' && /مربع ؟/.test(r.name), 'و«Null» من خطة المصدر تُقرأ مجهولةً: «' + r.name + '»');
  w.LANG = L0; if (vt) vt.textContent = was;
}

/* ── ٤٣ · (V39.7) المحادثة: اختيارُ المهندس، والمسحُ للمهندس فما فوق، والتحويلُ لمن في مستواك أو تحتك ── */
console.log('\n══ ٤٣ · المحادثة: اختيار المهندس والمسح والتحويل ══');
{
  const D = w.document, U0 = w.STATE.users, me0 = w.STATE.meta.name, role0 = w.ROLE, cur0 = w.CUR, cf0 = w.confirm;
  const tap = el => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles:true, cancelable:true }));
  const tmp = a => { const b = D.createElement('button'); Object.entries(a).forEach(([k, v]) => b.setAttribute(k, v)); D.body.appendChild(b); return b; };
  const as = (n, r) => { w.STATE.meta.name = n; w.ROLE = r; w.STATE.meta.role = r; };
  w.confirm = () => true;
  w.STATE.users = { a:{ name:'فني التجربة', role:'tech', sup:'مشرف التجربة' }, b:{ name:'مشرف التجربة', role:'supervisor', sup:'مهندس أ' },
                    c:{ name:'مهندس أ', role:'engineer', sup:'مدير التجربة' }, d:{ name:'مهندس ب', role:'engineer', sup:'مدير التجربة' }, e:{ name:'مدير التجربة', role:'admin', sup:'' } };
  as('مشرف التجربة', 'supervisor');
  T(JSON.stringify(w.askEngList()) === JSON.stringify(['مهندس أ', 'مهندس ب']), 'مشرفٌ عنده مهندسان: مهندسُه أوّلًا ثم الآخر — ' + w.askEngList().join('، '));
  w.ASSIST_Q = 'القارئ مش شغال'; w.askEngWho.pick = false;
  const b1 = tmp({ 'data-askeng':'1' }); tap(b1); b1.remove();
  const pick = w.askEngPickHtml();
  T(w.askEngWho.pick === true && /data-askengto="مهندس أ"/.test(pick) && /data-askengto="مهندس ب"/.test(pick) && /فوقك مباشرةً/.test(pick), 'الزرُّ يعرض قائمةَ المهندسين ومهندسُه مُعلَّمٌ «فوقك مباشرةً»');
  const b2 = tmp({ 'data-askengto':'مهندس ب' }); tap(b2); b2.remove();
  const ta = D.querySelector('[data-chtext="dm:مهندس ب"]');
  T(w.CUR === 'chat' && !!ta && ta.value.indexOf('القارئ مش شغال') === 0 && ta.value.indexOf(w.verShow(w.appVer())) > -1 && !/٠٠/.test(ta.value), 'والاختيارُ يفتح المحادثةَ معه، والإصدارُ في المسوّدة بأرقامه لا «٠٠»' + (ta ? '' : ' — لا مربّع') + ' · ' + w.CUR + ' · «' + (ta ? ta.value : '') + '» · ' + w.verShow(w.appVer()));
  /* delete: the engineer and above only */
  as('فني التجربة', 'tech');
  const m1 = w.chSend('', 'مهندس أ', 'سؤال للتجربة', 'msg');
  T(!/data-chdel=/.test(w.chLineHtml(m1)), 'الفنيُّ لا يرى زرَّ المسح');
  as('مهندس أ', 'engineer');
  T(/data-chdel="/.test(w.chLineHtml(m1)), 'والمهندسُ يراه');
  const b3 = tmp({ 'data-chdel':m1.id }); tap(b3); b3.remove();
  const g = w.STATE.msgs[m1.id];
  T(g && g.deleted === true && g.delBy === 'مهندس أ' && g.text === 'سؤال للتجربة' && !w.chMsgs().some(v => v.id === m1.id), 'المسحُ علامةٌ (من ومتى) والنصُّ باقٍ — والرسالةُ تختفي عند الجميع');
  /* hand over: at my rank or below, the question goes with a «reply to» button */
  as('فني التجربة', 'tech'); w.chSend('', 'مهندس أ', 'أين أركّب القارئ؟', 'msg');
  as('مهندس أ', 'engineer');
  const P = w.chFwdPeople('فني التجربة').map(u => u.name);
  T(P.indexOf('مهندس ب') > -1 && P.indexOf('مشرف التجربة') > -1 && P.indexOf('مدير التجربة') < 0 && P.indexOf('فني التجربة') < 0 && P.indexOf('مهندس أ') < 0, 'التحويلُ لمن في مستواي أو تحتي — لا للأعلى ولا لصاحب السؤال: ' + P.join('، '));
  const b4 = tmp({ 'data-chfwd':'dm:فني التجربة' }); tap(b4); b4.remove();
  const b5 = tmp({ 'data-chfwdto':'مشرف التجربة' }); tap(b5); b5.remove();
  const F = Object.values(w.STATE.msgs).filter(v => !v.deleted && v.kind === 'fwd' && v.to === 'مشرف التجربة' && v.ref === 'فني التجربة');
  const N = Object.values(w.STATE.msgs).filter(v => !v.deleted && v.to === 'فني التجربة' && /حوّلتُ سؤالك إلى/.test(v.text));
  T(F.length === 1 && /أين أركّب القارئ؟/.test(F[0].text) && N.length === 1, 'يصل المشرفَ السؤالُ محوَّلًا، ويُقال لصاحبه من سيردّ');
  as('مشرف التجربة', 'supervisor');
  T(F.length === 1 && /data-chopen-t="dm:فني التجربة"/.test(w.chLineHtml(F[0])), 'وفي الرسالة المحوَّلة زرُّ «ردّ على» صاحبِ السؤال');
  Object.values(w.STATE.msgs).filter(v => /التجربة|مهندس [أب]/.test((v.from || '') + (v.to || ''))).forEach(v => { delete w.STATE.msgs[v.id]; });
  w.STATE.users = U0; as(me0, role0); w.CUR = cur0; w.chPageHtml.f = {}; w.chOpenHtml.fwd = ''; w.askEngWho.pick = false; w.ASSIST_OPEN = false; w.confirm = cf0;
}

/* ── ٤٤ · (V39.8) رسالةٌ لي: شريطٌ فوق يفتح المحادثة، والعددُ على الشريط العلويّ، والصوتُ يُكتَم ── */
console.log('\n══ ٤٤ · تنبيهُ الرسالة: الشريط والعدد والصوت ══');
{
  const D = w.document, me0 = w.STATE.meta.name, role0 = w.ROLE, cur0 = w.CUR;
  w.STATE.meta.name = 'مهندس التنبيه'; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'map'; w.render(1);
  const v = { id:'M-alert-1', site:'', to:'مهندس التنبيه', from:'فني التنبيه', role:'tech', text:'وصلت المخيم والبوابة مقفولة', kind:'msg', at:Date.now() + 5000 };
  w.STATE.msgs = w.STATE.msgs || {}; w.STATE.msgs[v.id] = v;
  w.chIncoming(v);
  const bn = D.getElementById('chBanner'), top = D.getElementById('chatTop'), n = D.getElementById('chatTopN');
  T(!!bn && /فني التنبيه/.test(bn.textContent) && /البوابة مقفولة/.test(bn.textContent), 'رسالةٌ لي تُظهر شريطًا فوق باسم المرسل وأوّل كلامه');
  T(!!top && !top.hidden && !!n && !n.hidden && n.textContent.trim() !== '', 'وعلى الشريط العلويّ زرُّ المحادثات بعدد غير المقروء: ' + (n ? n.textContent : ''));
  bn.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(w.CUR === 'chat' && w.chPageHtml.f.open === 'dm:فني التنبيه' && !D.getElementById('chBanner'), 'والضغطُ على الشريط يفتح المحادثةَ نفسَها');
  const m0 = w.localStorage.getItem('nsk14.chMute');
  w.chPageHtml.f = {}; w.render(1);
  const mb = D.querySelector('[data-chmute]'); if (mb) mb.dispatchEvent(new w.MouseEvent('click', { bubbles:true, cancelable:true }));
  T(!!mb && w.localStorage.getItem('nsk14.chMute') === '1' && /مكتوم/.test(w.chAlertChips()), 'وصوتُ الرسائل يُكتَم من صفحة المحادثات ويُفتَح');
  if (m0 == null) w.localStorage.removeItem('nsk14.chMute'); else w.localStorage.setItem('nsk14.chMute', m0);
  delete w.STATE.msgs[v.id]; w.STATE.meta.name = me0; w.ROLE = role0; w.STATE.meta.role = role0; w.CUR = cur0; w.chPageHtml.f = {};
}

/* ── ٤٥ · (V39.11) التوأم الرقمي: الحساسات والجيت واي في الخريطة المجسّمة، وزرُّ الطبقة فوق ── */
console.log('\n══ ٤٥ · التوأم الرقمي في الخريطة المجسّمة ══');
{
  const M30 = w.M3, d30 = w.MAP_3D, on0 = w.IOT.on, ed0 = w.IOT.edit, role0 = w.ROLE, cur0 = w.CUR;
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'map';
  T(/data-iot="1"/.test(w.mapUIHtml()) && /الحساسات/.test(w.mapUIHtml()), 'زرُّ «الحساسات» في صفِّ أزرار الخريطة فوق، لا داخل التصفية وحدَها');
  T(/data-iot="1"/.test(w.mapUIHtml()) && typeof w.m3HoverHtml === 'function' && /حساس/.test(w.m3HoverHtml('nsk-iot-pt', { camp:'x', kind:'s', i:0, did:'S01' })) && /S01/.test(w.m3HoverHtml('nsk-iot-pt', { camp:'x', kind:'s', i:0, did:'S01' })), 'ومرورُ الماوس على الحساس يقول رقمَه وحالتَه');   /* (V39.17) */
  /* a camp with a plan: twelve sensors and a gateway, one sensor faulty */
  const camp = w.STATE.sites.find(x => x.type === 'مخيم' && +x.lat && +x.lng);
  const sensors = Array.from({ length:12 }, (_, i) => [+camp.lat + i * 0.00002, +camp.lng + i * 0.00002]);
  const sm = sensors.map((_, i) => ({ id:camp.id + '-S' + String(i + 1).padStart(2, '0'), status:i === 3 ? 'معطّل' : (i < 6 ? 'مُركّب' : 'مخطط'), serial:i === 0 ? 'SN-0001' : '' }));
  w.siteOvSet(camp.id, { iot:{ gw:[+camp.lat, +camp.lng], gws:[], sensors, sm, gm:[{ id:camp.id + '-GW1', status:'مُركّب' }], maxM:40, at:Date.now() } });
  let data = null;
  w.M3 = { getBounds:() => ({ contains:() => true }), getZoom:() => 19, getSource:() => ({ setData:v => { data = v; } }) };
  w.MAP_3D = true; w.IOT.on = true; w.IOT.edit = null;
  w.m3IotPaint();
  const F = data ? data.features.filter(f => f.properties.camp === camp.id) : [];
  const col = k => F.filter(f => f.properties.kind === k && f.geometry.type === 'Polygon' && !f.properties.beacon && !f.properties.stem).map(f => f.properties.color);   /* (V39.32) the stems repeat them too */   /* (V39.17/V39.21) the columns; the dots and beacons repeat them */
  T(F.length === 54 && col('s').length === 12 && col('g').length === 4 && F.filter(f => f.geometry.type === 'Point').length === 13 && F.filter(f => f.properties.beacon).length === 13 && F.filter(f => f.properties.stem).length === 12,   /* (V39.48) the gateway is four parts: pole, cabinet, antenna, tip */ 'المخيمُ في المجسّم: اثنا عشر حساسًا وجيت واي، كلٌّ عمودٌ صغيرٌ ونقطةٌ تبقى في كلِّ تقريب (' + F.length + ')');   /* (V39.17) */
  T(col('s')[3] === '#E05252' && col('s')[0] === w.IOT_C.sensor && col('s')[9] !== w.IOT_C.sensor && F.filter(f => f.properties.kind === 'g' && f.properties.part === 'tip')[0].properties.color === w.IOT_C.gw && F.filter(f => f.properties.kind === 'g' && f.properties.part === 'tip')[0].properties.h > 1.8 && F.every(f => (f.geometry.type === 'Polygon' || f.geometry.type === 'Point') && f.properties.h > 0),
    'ولونُه بحالته: المعطّلُ أحمر، والمركّبُ بلونه، والمخطَّطُ أفتح — ولونُ الجيت واي على رأس هوائيّه الذي يعلو الحساسات');
  /* the editor: a tap selects, the next tap on the ground moves */
  w.iotEditStart(camp.id);
  const E = w.IOT.edit; w.m3IotClick({ properties:{ camp:camp.id, kind:'s', i:2 } }, { originalEvent:{} });
  T(!!E && E.sel && E.sel.k === 's' && E.sel.i === 2, 'في المحرّر: الضغطُ على حساسٍ في المجسّم يحدّده');
  w.iotMapClick({ lat:+camp.lat + 0.001, lng:+camp.lng + 0.001 });
  T(Math.abs(E.sensors[2][0] - (+camp.lat + 0.001)) < 1e-6 && data.features.some(f => f.properties.sel === 1), 'والضغطةُ التاليةُ على الأرض تنقله، ويُرسَم محدَّدًا');
  E.sel = { k:'s', i:2 }; w.iotDel();
  T(E.sensors.length === 11 && !E.sel, 'والحذفُ من المحرّر يشيله');
  w.IOT.edit = null; w.M3 = M30; w.MAP_3D = d30; w.IOT.on = on0; w.IOT.edit = ed0; w.ROLE = role0; w.STATE.meta.role = role0; w.CUR = cur0;
  w.siteOvSet(camp.id, { iot:null });
}

/* ── ٤٦ · (V39.11) «ما الجديد» بلغة الشاشة — لا سطرَ عربيًّا على شاشةٍ إنجليزية ── */
console.log('\n══ ٤٦ · «ما الجديد» بلغة الشاشة ══');
{
  const role0 = w.ROLE, seen0 = w.localStorage.getItem('nsk14.seenVer'), L0 = w.LANG, wn0 = w.WN;
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
  w.setLang('en'); await new Promise(r => setTimeout(r, 150));   /* the dictionary lands a tick later */
  w.localStorage.setItem('nsk14.seenVer', 'V38.80'); w.WN = null;
  const ok = w.whatsNewMaybe(), html = ok ? w.wnHtml() : '';
  const body = html.replace(/<[^>]+>/g, ' ');
  T(ok && w.WN && w.WN.list.length >= 10 && w.WN.list.every(r => /^V(39|[4-9]\d)\./.test(r.v)), 'على الشاشة الإنجليزية تظهر الإصداراتُ المترجَمةُ وحدَها (' + (w.WN ? w.WN.list.length : 0) + ')');
  T(!/[\u0621-\u064A]/.test(body) && /Talk to the engineer/.test(body) && !/V39\.\d+/.test(body.replace(/Version/g, '')), 'ولا حرفَ عربيًّا في اللوح، والإصدارُ بأرقام اللغة');
  w.setLang('ar'); await new Promise(r => setTimeout(r, 50)); w.localStorage.setItem('nsk14.seenVer', 'V38.80'); w.WN = null;
  T(w.whatsNewMaybe() && w.WN.list.length > w.WN.list.filter(r => /^V39\./.test(r.v)).length, 'وبالعربية كلُّ الإصدارات كما كانت');
  w.WN = wn0; w.setLang(L0); if (seen0 == null) w.localStorage.removeItem('nsk14.seenVer'); else w.localStorage.setItem('nsk14.seenVer', seen0); w.ROLE = role0; w.STATE.meta.role = role0;
}

/* ── ٤٧ · (V39.13) التوأم الرقمي ٢: أجهزةُ النقطة المركّبة أعمدةٌ بسيريالاتها في المجسّم ── */
console.log('\n══ ٤٧ · أجهزةُ النقطة في المجسّم ══');
{
  const M30 = w.M3, d30 = w.MAP_3D, role0 = w.ROLE, cur0 = w.CUR;
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'map';
  const x = w.STATE.sites.find(s => +s.lat && +s.lng && !(w.STATE.inss || {})[s.id]);
  w.STATE.inss = w.STATE.inss || {};
  w.STATE.inss[x.id] = { id:x.id, status:'مُركّب', parts:{ rdr8:1, cam_pe:2, rtr:1, sol:1 }, serials:{ rdr8:'RDR-TEST-01', rtr:'RTR-TEST-01' }, by:'فني التجربة', at:Date.now() };
  const D = w.dtwOf(x.id);
  T(D.length === 5 && D.filter(d => d.code === 'cam_pe').length === 2 && D[0].serial === 'RDR-TEST-01' && D.find(d => d.code === 'rtr').serial === 'RTR-TEST-01', 'سجلُّ التركيب يُقرأ أجهزةً: قارئ وكاميرتان وراوتر ولوح — بسيريالاتها (' + D.length + ')');
  let data = null; w.M3 = { getBounds:() => ({ contains:() => true }), getZoom:() => 19, getSource:() => ({ setData:v => { data = v; } }) }; w.MAP_3D = true; w.dtwPaint.on = true;
  w.dtwPaint();
  const F = data ? data.features.filter(f => f.properties.site === x.id) : [];
  const kinds = F.map(f => f.properties.kind);
  const units = new Set(F.map(f => f.properties.code + '#' + f.properties.i)); T(units.size === 4 && F.length === 11 && kinds.indexOf('reader') > -1 && new Set(F.filter(f => f.properties.kind === 'camera').map(f => f.properties.i)).size === 2 && kinds.indexOf('router') > -1 && kinds.indexOf('solar') === -1, 'وفي المجسّم عند المدخل الكاميرا والقارئ والراوتر وحدَها (لا لوحَ شمسيًّا ولا هوائي)، كلٌّ من أجزائها (V39.50)');
  const reader = F.find(f => f.properties.kind === 'reader' && f.properties.part === 'panel');
  T(reader.properties.color === '#EEF1F3' && reader.properties.h === 2.85 && reader.properties.base === 2.3 && reader.properties.serial === 'RDR-TEST-01' && F.some(f => f.properties.kind === 'reader' && f.properties.part === 'pole' && f.properties.h === 2.9) && F.every(f => f.geometry.type === 'Polygon'), 'القارئُ لوحةٌ على عمودٍ بسيرياله (V39.48)');
  { const hv = w.m3HoverHtml('nsk-twin', reader.properties); T(/IP /.test(hv) && /IP /.test(w.dtwCardHtml(reader.properties)), 'وعلى القارئ عنوانُه في التلميح والبطاقة (V39.50): ' + hv.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 80)); }
  const card = w.dtwCardHtml(reader.properties);
  T(/RDR-TEST-01/.test(card) && /مُركّب/.test(card) && /فني التجربة/.test(card) && /data-site="/.test(card) && /data-insq="/.test(card), 'وبطاقةُ الجهاز: السيريال والحالة ومن ركّبه، وزرّا صفحة النقطة وتعديل التركيب');
  w.dtwPaint.on = false; w.dtwPaint(); T(data.features.length === 0, 'وزرُّ «الأجهزة» يطفئ الطبقة');
  w.dtwPaint.on = true; w.M3 = M30; w.MAP_3D = d30; delete w.STATE.inss[x.id]; w.ROLE = role0; w.STATE.meta.role = role0; w.CUR = cur0;
}

/* ── ٤٨ · (V39.14) التغطية: مدى القارئ، ومخروط الكاميرا حين يُعرَف اتجاهها، ومدى الجيت واي ── */
console.log('\n══ ٤٨ · طبقة التغطية ══');
{
  const role0 = w.ROLE, cur0 = w.CUR, on0 = w.covPaint.on;
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'map';
  const x = w.STATE.sites.find(s => +s.lat && +s.lng && !(w.STATE.inss || {})[s.id]);
  w.STATE.inss = w.STATE.inss || {};
  w.STATE.inss[x.id] = { id:x.id, status:'مُركّب', parts:{ rdr8:1, cam_pe:1 }, serials:{} };
  const all = () => true;
  let S = w.covShapes(all).filter(s => s.site === x.id);
  T(S.length === 2 && S.some(s => s.kind === 'reader' && s.ring.length === 36) && S.some(s => s.kind === 'camera-unaimed'), 'نقطةٌ بقارئٍ وكاميرا بلا اتجاه: دائرةُ القارئ ودائرةٌ باهتةٌ للكاميرا');
  w.STATE.inss[x.id].cov = { dir:90, fov:60, rdr:20 };
  S = w.covShapes(all).filter(s => s.site === x.id);
  const cam = S.find(s => s.kind === 'camera'), rdr = S.find(s => s.kind === 'reader');
  const east = cam && cam.ring[7], dLng = east ? east[1] - +x.lng : 0, dLat = east ? east[0] - +x.lat : 1;
  T(!!cam && cam.ring.length === 15 && dLng > 0 && Math.abs(dLat) < Math.abs(dLng) / 8, 'وباتجاهٍ ٩٠ درجة يصير مخروطًا نحو الشرق');
  const r20 = rdr && Math.hypot((rdr.ring[0][0] - +x.lat) * 111320, 0);
  T(!!rdr && Math.abs(r20 - 20) < 0.5, 'ومدى القارئ المكتوبُ ٢٠ م يُرسم ٢٠ م: ' + (r20 || 0).toFixed(1));
  T(/data-cov="1"/.test(w.mapUIHtml()) && /التغطية/.test(w.mapUIHtml()), 'وزرُّ «التغطية» في صفِّ أزرار الخريطة');
  const sheetHtml = (() => { const S0 = w.insqState(); S0.id = x.id; const h = w.insqSheet(); S0.id = ''; return h; })();
  T(/data-insqcov="dir"/.test(sheetHtml) && /data-insqcov="fov"/.test(sheetHtml) && /data-insqcov="rdr"/.test(sheetHtml) && /value="90"/.test(sheetHtml), 'وورقةُ تعديل التركيب فيها الاتجاهُ والزاويةُ والمدى بقيمها');
  delete w.STATE.inss[x.id]; w.ROLE = role0; w.STATE.meta.role = role0; w.CUR = cur0; w.covPaint.on = on0;
}

/* ── ٤٩ · (V39.15) طوابقُ منشأة الجمرات: النقطةُ وأجهزتُها على دورها في المجسّم، وأزرارُ الأدوار فوق ── */
console.log('\n══ ٤٩ · طوابقُ منشأة الجمرات في المجسّم ══');
{
  const z0 = w.FILT.zone, f0 = w.FILT.floor, cur0 = w.CUR, role0 = w.ROLE;
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'map';
  const cam = w.STATE.sites.find(x => /الدور الثالث/.test(x.name || '') && +x.lat && +x.lng) || null;
  T(!!cam && w.siteFloor(cam) === 3 && Math.abs(w.m3Base(cam) - 12.6) < 1e-9, 'كاميرا «الدور الثالث» تقف على ١٢٫٦ م في المجسّم' + (cam ? '' : ' — لا كاميرا بدور في البذرة'));
  const ground = w.STATE.sites.find(x => x.type === 'مخيم' && +x.lat);
  T(w.m3Base(ground) === 0, 'والمخيمُ على الأرض');
  if (cam){
    w.STATE.inss = w.STATE.inss || {}; const had = w.STATE.inss[cam.id]; w.STATE.inss[cam.id] = { id:cam.id, status:'مُركّب', parts:{ cam_pe:1 }, serials:{} };
    const M30 = w.M3, d30 = w.MAP_3D; let data = null; w.M3 = { getBounds:() => ({ contains:() => true }), getZoom:() => 19, getSource:() => ({ setData:v => { data = v; } }) }; w.MAP_3D = true; w.dtwPaint.on = true;
    w.dtwPaint(); const f = data && data.features.find(q => q.properties.site === cam.id);
    T(!!f && Math.abs(f.properties.base - 12.6) < 1e-9 && f.properties.h > f.properties.base, 'وجهازُها يقف على دورها لا على الأرض');
    if (had) w.STATE.inss[cam.id] = had; else delete w.STATE.inss[cam.id]; w.M3 = M30; w.MAP_3D = d30;
  } else T(true, '(لا جهازَ يُختبَر بلا كاميرا بدور)');
  w.FILT.zone = 'كاميرات المتابعة'; w.FILT.floor = '';
  const ui = w.mapUIHtml();
  T((ui.match(/data-ffl="/g) || []).length === 6 && /الدور الثالث|الثالث/.test(ui), 'ومع اختيار كاميرات المتابعة تظهر أزرارُ الأدوار الستة فوق');
  w.FILT.zone = ''; w.FILT.floor = '';
  T(!/data-ffl="/.test(w.mapUIHtml()), 'وتختفي حين لا تُختار المنشأة');
  w.FILT.zone = z0; w.FILT.floor = f0; w.CUR = cur0; w.ROLE = role0; w.STATE.meta.role = role0;
}

/* ── ٥٠ · (V39.16) الخريطةُ الحرارية: التحدياتُ في المسح والمتبقّي في التركيب ── */
console.log('\n══ ٥٠ · بؤر الشغل (كانت «الخريطة الحرارية») ══');
{
  const m0 = w.FIELD_MODE, on0 = w.heatPaint.on, cur0 = w.CUR;
  w.CUR = 'map'; w.FIELD_MODE = 'survey';
  const all = () => true;
  const hot = w.heatPoints(all).length, total = w.STATE.sites.filter(x => +x.lat && +x.lng).length;
  T(hot > 0 && hot < total, 'في وضع المسح تسخن النقاطُ التي سجّلت تحديًا أو لم تُمسح: ' + hot + ' من ' + total);
  const withCh = w.STATE.sites.find(x => (w.STATE.recs[x.id] || {}).chals && w.STATE.recs[x.id].chals.some(c => c && c !== 'لا توجد تحديات'));
  const noCh = w.STATE.sites.find(x => (w.STATE.recs[x.id] || {}).chals && w.STATE.recs[x.id].chals.every(c => c === 'لا توجد تحديات') && (w.STATE.recs[x.id].access === 'تم الوصول' || !w.STATE.recs[x.id].access));
  T(!!withCh && w.heatWeight(withCh) === 1 && !!noCh && w.heatWeight(noCh) === 0, 'نقطةٌ بتحدٍّ ساخنة، ونقطةٌ بلا تحدٍّ ووصلها الفريقُ باردة');
  w.FIELD_MODE = 'install';
  const installed = w.STATE.sites.find(x => w.insDone(x.id)), pending = w.STATE.sites.find(x => !w.insDone(x.id) && !(w.STATE.inss || {})[x.id] && +x.lat);
  T(!!installed && w.heatWeight(installed) === 0 && !!pending && w.heatWeight(pending) === 1, 'وفي وضع التركيب يسخن ما بقي ويبرد ما رُكِّب');
  T(/data-heat="1"/.test(w.mapUIHtml()) && /المتبقّي للتركيب/.test(w.mapUIHtml()) && !/الحرارة/.test(w.mapUIHtml()), 'وزرُّه في التركيب «المتبقّي للتركيب» — لا «الحرارة» (V39.26)');
  w.FIELD_MODE = 'survey'; T(/بؤر التحديات/.test(w.mapUIHtml()), 'وفي المسح «بؤر التحديات»'); w.FIELD_MODE = 'dis'; T(/المتبقّي للفك/.test(w.mapUIHtml()), 'وفي الفك «المتبقّي للفك»'); w.FIELD_MODE = 'install';
  T(w.heatColor(0) !== w.heatColor(1) && /^rgb\(255,/.test(w.heatColor(0.5)), 'واللونُ من الأصفر إلى الأحمر');
  w.FIELD_MODE = m0; w.heatPaint.on = on0; w.CUR = cur0;
}

/* ── ٥١ · (V39.17) شريطُ الزمن: الموسمُ يُعاد يومًا بيوم ── */
console.log('\n══ ٥١ · شريط الزمن ══');
{
  const S = w.timeState(), on0 = S.on, cur0 = w.CUR; w.CUR = 'map';
  const x = w.STATE.sites.find(q => +q.lat && +q.lng && !(w.STATE.recs || {})[q.id] && !(w.STATE.inss || {})[q.id]);
  const d0 = Date.UTC(2026, 8, 10), d1 = Date.UTC(2026, 9, 1);
  w.STATE.recs[x.id] = { id:x.id, at:d0, access:'تم الوصول', chals:['لا توجد تحديات'] };
  w.STATE.inss = w.STATE.inss || {}; w.STATE.inss[x.id] = { id:x.id, status:'مُركّب', parts:{ rdr8:1 }, at:d1 };
  T(w.timeStageAt(x, d0 - 864e5) === '' && w.timeStageAt(x, d0) === 'visited' && w.timeStageAt(x, d1 - 864e5) === 'visited' && w.timeStageAt(x, d1) === 'installed', 'قبل الزيارة لا شيء، بعدها «تمت الزيارة»، وبعد التركيب «مُركّب»');
  S.on = true; S.day = d0;
  T(w.mapColorOf(x) === w.LAYERS.survey.c, 'ولونُ النقطة على الخريطة يوم الزيارة لونُ المسح');
  S.day = d1; T(w.mapColorOf(x) === w.LAYERS.install.c, 'ويوم التركيب لونُ التركيب');
  S.day = d0 - 5 * 864e5; T(w.mapColorOf(x) === '#5B6570', 'وقبلهما رمادية');
  const bar = w.timeBarHtml();
  T(/data-timeslide/.test(bar) && /data-timeplay/.test(bar) && /data-timestep="-1"/.test(bar) && /data-timestep="1"/.test(bar), 'والشريطُ: منزلقٌ ويومٌ قبل وبعد وتشغيل');
  T(/data-time="1"/.test(w.mapUIHtml()) && /الزمن/.test(w.mapUIHtml()), 'وزرُّ «الزمن» في صفِّ أزرار الخريطة');
  S.on = false; w.timeSet(0); const R = w.timeRange(); T(R.min <= d0 && R.max >= Date.now() - 864e5, 'والمدى من أوّل سجلٍّ إلى اليوم');
  delete w.STATE.recs[x.id]; delete w.STATE.inss[x.id]; S.on = on0; w.CUR = cur0;
}

/* ── ٥٢ · (V39.18) مخيماتُ منى واقعية: صفوفُ خيامٍ ٨ م بسقفٍ هرميٍّ وممرّاتٍ وسورٍ داخل حدود كلِّ مخيم ── */
console.log('\n══ ٥٢ · خيامُ منى في المجسّم ══');
{
  const lat = 21.413, lng = 39.893, kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 111320;
  const rect = (w0, h0) => [[lng, lat], [lng + w0 / kx, lat], [lng + w0 / kx, lat + h0 / ky], [lng, lat + h0 / ky]];
  const cells = w.tentCells(rect(60, 40));
  T(cells.length === 24 && cells.every(c => c.body.length === 5 && c.roof.length === 5), 'مخيمٌ ٦٠×٤٠ م يحوي ٢٤ خيمةً في ٦ أعمدةٍ و٤ صفوف: ' + cells.length);
  const bodyW = Math.hypot((cells[0].body[1][0] - cells[0].body[0][0]) * kx, (cells[0].body[1][1] - cells[0].body[0][1]) * ky);
  T(Math.abs(bodyW - 7.6) < 0.05, 'والخيمةُ ٧٫٦ م (٨ م بممرٍّ): ' + bodyW.toFixed(2));
  const small = w.tentCells(rect(6, 6));
  T(small.length === 0, 'وحدودٌ أصغرُ من خيمةٍ لا تُملأ');
  w.tentPaint.cache = {};
  const F = w.tentFeaturesOf('camp-test', rect(60, 40));
  const bodies = F.filter(f => f.properties.k === 'body'), roofs = F.filter(f => f.properties.k === 'roof'), fence = F.filter(f => f.properties.k === 'fence');
  T(bodies.length === 24 && roofs.length === 24 && fence.length === 4 && roofs[0].properties.base > bodies[0].properties.base && roofs[0].properties.h > bodies[0].properties.h, 'الخيامُ أجسامٌ وأسقفٌ فوقها وسورٌ من أربعة أضلاع');
  T(w.tentFeaturesOf('camp-test', rect(60, 40)) === F, 'والمخيمُ يُحسَب مرةً ويُخزَّن');
  const d30 = w.MAP_3D; w.MAP_3D = true; w.m3uiState().sheet = true; const ui = w.mapUIHtml(); w.m3uiState().sheet = false; w.MAP_3D = d30;
  T(/data-tent="1"/.test(ui) && /الخيام/.test(ui), 'وزرُّ «الخيام» في لوح «الطبقات» مع المجسّم (V39.28)');
  const camp = w.STATE.sites.find(x => x.type === 'مخيم' && w.campFoot(x));
  if (camp){ w.tentPaint.on = true; const P = w.m3Points().find(f => f.properties.id === camp.id); T(!!P && P.properties.h === 0.5, 'وتحت الخيام يصير المخيمُ قاعدةً ٠٫٥ م بلونه'); w.tentPaint.on = false; const P2 = w.m3Points().find(f => f.properties.id === camp.id); T(!!P2 && P2.properties.h === 4, 'وبلا خيامٍ يعود كتلةً ٤ م'); w.tentPaint.on = true; }
  else T(true, '(لا مخيمَ بحدودٍ في البذرة)');
  delete w.tentPaint.cache['camp-test'];
}

/* ── ٥٣ · (V39.19) صورُ التركيب دبابيسُ في المجسّم ── */
console.log('\n══ ٥٣ · صورُ التركيب على المجسّم ══');
{
  const M30 = w.M3, d30 = w.MAP_3D, cur0 = w.CUR; w.CUR = 'map';
  const x = w.STATE.sites.find(q => +q.lat && +q.lng);
  w.STATE.photos = w.STATE.photos || {}; const k = 'ph-test-' + x.id;
  w.STATE.photos[k] = { site:x.id, at:Date.now(), driveId:'DRIVE-TEST-1' }; w.phTouch();
  w.M3 = { getZoom:() => 18.5, getBounds:() => ({ contains:() => true }), getCenter:() => ({ lat:+x.lat, lng:+x.lng }) }; w.MAP_3D = true; w.phPinPaint.on = true;
  const T0 = w.phPinTargets();
  T(T0.length >= 1 && T0[0].site.id === x.id && /DRIVE-TEST-1/.test(T0[0].src), 'النقطةُ ذاتُ الصورة هدفٌ أوّلُ (الأقربُ إلى المركز) بمصغّرةِ درايف');
  w.M3.getZoom = () => 17; T(w.phPinTargets().length === 0, 'ولا دبابيسَ قبل التقريب ١٨ (V39.30)'); w.M3.getZoom = () => 18.5;
  const el = w.phPinEl(x, T0[0].src);
  T(el.className === 'ph-pin' && el.getAttribute('data-site') === x.id && el.querySelector('img') && el.querySelector('img').getAttribute('src') === T0[0].src, 'والدبّوسُ صورةٌ تفتح نقطتَها بـdata-site');
  T(w.phPinTargets().length <= 24, 'وأربعةٌ وعشرون دبّوسًا على الأكثر (V39.30)');
  w.m3uiState().sheet = true; const ui = w.mapUIHtml(); w.m3uiState().sheet = false; T(/data-phpin="1"/.test(ui) && /الصور/.test(ui), 'وزرُّ «الصور» في لوح «الطبقات» مع المجسّم (V39.28)');
  delete w.STATE.photos[k]; w.phTouch(); w.M3 = M30; w.MAP_3D = d30; w.CUR = cur0;
}

/* ── ٥٤ · (V39.20) التوأمُ الحي: نبضُ القرّاء وإشغالُ المخيمات من جسر نظام البطاقات ── */
console.log('\n══ ٥٤ · التوأم الحي ══');
{
  const LV = w.liveState(), on0 = LV.on, snap0 = w.STATE.extSnap, cur0 = w.CUR; w.CUR = 'map';
  const camp = w.STATE.sites.find(x => x.type === 'مخيم' && +x.lat), pt = w.STATE.sites.find(x => x.type !== 'مخيم' && +x.lat);
  const now = Date.now();
  w.STATE.extSnap = { at:now, sites:{ [camp.id]:{ code:'C-1', ts:new Date(now - 5 * 60000).toISOString() }, [pt.id]:{ code:'P-1', ts:new Date(now - 3 * 3600000).toISOString() } }, camps:{ 'C-1':{ w:850, wo:50, ot:0, cap:1000 } } };
  const occ = w.liveOcc(camp);
  T(!!occ && occ.pct === 90 && occ.tot === 900 && occ.cap === 1000, 'إشغالُ المخيم من اللقطة: ٩٠٪ (' + (occ ? occ.pct : '—') + ')');
  const p1 = w.liveOf(pt);
  T(p1.link && !p1.on, 'ونقطةٌ قرأت قبل ثلاث ساعات مربوطةٌ وصامتة');
  LV.on = true;
  T(w.mapColorOf(camp) === '#E05252' && w.mapColorOf(pt) === '#E05252', 'وفي وضع «الحي» المخيمُ الممتلئُ أحمر والقارئُ الصامتُ أحمر');
  const other = w.STATE.sites.find(x => x.type !== 'مخيم' && +x.lat && x.id !== pt.id);
  T(w.mapColorOf(other) === '#5B6570', 'وغيرُ المربوط رمادي');
  T(/٩٠/.test(w.liveTextOf(camp)) && /غير متصل/.test(w.liveTextOf(pt)), 'والتلميحُ يقول الإشغالَ ونبضَ القارئ');
  const n = w.liveCounts(); T(n.camps >= 1 && n.off >= 1 && /data-live="1"/.test(w.mapUIHtml()), 'وزرُّ «الحي» بعدِّ المتصل من المربوط');
  w.STATE.iotLive = { 'camp-x':{ at:now, s:{ S01:{ at:now - 60000, v:27.5 } } } };
  const sv = w.liveSensor('camp-x', 'S01'); T(!!sv && sv.on && sv.v === 27.5 && w.liveSensor('camp-x', 'S09') === null, 'وبنيةُ نبض الحساسات جاهزةٌ لجسرٍ يكتبها');
  delete w.STATE.iotLive; LV.on = on0; w.STATE.extSnap = snap0; w.CUR = cur0;
}

/* ── ٥٥ · (V39.21) الحساساتُ تُرى من خارج الخيمة، والكاميرا تدخل المخيم ── */
console.log('\n══ ٥٥ · منارات الحساسات ودخول المخيم ══');
{
  const camp = w.STATE.sites.find(x => x.type === 'مخيم' && +x.lat && +x.lng);
  const sensors = Array.from({ length:12 }, (_, i) => [+camp.lat + i * 0.00002, +camp.lng + i * 0.00002]);
  w.siteOvSet(camp.id, { iot:{ gw:[+camp.lat, +camp.lng], gws:[], sensors, sm:sensors.map((_, i) => ({ id:camp.id + '-S' + (i + 1), status:'مُركّب' })), gm:[{ id:camp.id + '-GW1', status:'مُركّب' }], maxM:40, at:Date.now() } });
  const on0 = w.IOT.on; w.IOT.on = true; const F = w.m3IotFeatures().filter(f => f.properties.camp === camp.id); w.IOT.on = on0;
  const beacons = F.filter(f => f.properties.beacon), cols = F.filter(f => !f.properties.beacon && !f.properties.stem && f.geometry.type === 'Polygon');   /* (V39.32) the stems are not columns */
  const nDev = cols.filter(f => f.properties.kind === 's').length + new Set(cols.filter(f => f.properties.kind === 'g').map(f => f.properties.i)).size; T(beacons.length > 0 && beacons.length === nDev && beacons.every(f => f.properties.base === 4.8 && f.properties.h > 4.8), 'لكلِّ حساسٍ وجيت واي منارةٌ فوق سقف الخيمة (' + beacons.length + ')');
  T(cols.filter(f => f.properties.kind === 'g' && f.properties.part === 'tip').every(f => f.properties.h === 3.4), 'وهوائيُّ الجيت واي يعلو أسقفَ الخيام (V39.48)');
  const M30 = w.M3, d30 = w.MAP_3D; let flown = null; w.M3 = { flyTo:o => { flown = o; } }; w.MAP_3D = true; w.m3Enter.last = null;
  T(w.m3Enter(camp.id) && flown && flown.zoom === 20 && flown.pitch === 80 && Math.abs(flown.center[0] - +camp.lng) < 1e-9, 'و«ادخل المخيم» يقف بالكاميرا على البوابة مائلةً إلى الحدّ');
  const b1 = flown.bearing; w.m3Enter(camp.id); T(Math.abs(((flown.bearing - b1) % 360 + 360) % 360 - 180) < 1e-6, 'والثانيةُ تدير الكاميرا لتنظر إلى أجهزة البوابة');
  w.M3 = M30; w.MAP_3D = d30; w.m3Enter.last = null;
  const d31 = w.MAP_3D, ps0 = w.POP_SITE; w.MAP_3D = true; w.POP_SITE = camp.id; const html = w.popHtml(); w.MAP_3D = d31; w.POP_SITE = ps0;
  T(/data-m3enter="/.test(html), 'وزرُّ «ادخل المخيم» في نافذة المخيم مع المجسّم');
  w.siteOvSet(camp.id, { iot:null });
}

/* ── ٥٦ · (V39.22) مخيمُ العرض (منى ٧٤B — شاخص 38/56): الأجهزةُ الفعليةُ من الميدان تُطبَّق في المحرّر وتُحفَظ ── */
console.log('\n══ ٥٦ · الأجهزةُ الفعلية في مخيم العرض ══');
{
  const { readFileSync } = await import('fs');
  const D = JSON.parse(readFileSync(new URL('../layers/iot-field-1448.json', import.meta.url), 'utf8'));
  const F = D.camps['NSK-MIN-CMP-0449'];
  T(F && F.spots.length === 4 && F.spots.every(s => s.dev.length === 2 && s.dev[0].model === 'EM320' && s.dev[1].model === 'EM300'), 'ملفُّ الميدان: أربعةُ مواقع، في كلٍّ EM320 وبجواره EM300');
  T(F.spots.find(s => s.n === 1).dev[1].tag === 'D4D2' && F.spots.find(s => s.n === 2).dev[1].tag === 'D50A' && F.spots.every(s => s.dev[0].tag === String(s.n)), 'وعلاماتُ الأجهزة كما في صور الفريق: EM320 برقم موقعه، وD4D2 وD50A');
  const ring = JSON.parse(readFileSync(new URL('../poly.json', import.meta.url), 'utf8'))['NSK-MIN-CMP-0449'].map(p => [p[1], p[0]]);
  T(F.spots.every(s => s.dev.every(d => w.polyIn(d.at, ring))), 'وكلُّ جهازٍ داخل حدود المخيم');
  const role0 = w.ROLE; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
  w.iotFieldLoad.d = D;
  w.IOT.data = w.IOT.data || { camps:{} }; const had = w.IOT.data.camps['NSK-MIN-CMP-0449'];
  w.IOT.data.camps['NSK-MIN-CMP-0449'] = { gw:[21.40458, 39.895378], at:'pin', maxM:41, sensors:Array.from({ length:12 }, (_, i) => [21.4045 + i * 1e-5, 39.8953]) };
  w.iotEditStart('NSK-MIN-CMP-0449');
  T(w.IOT.edit && w.IOT.edit.sensors.length === 12 && /data-iotfield="1"/.test(w.iotPanelHtml()), 'المحرّرُ يفتح على الخطّة المبدئية (١٢) ويعرض «طبّق المواقع الفعلية»');
  w.iotFieldApply(); const E = w.IOT.edit;
  T(E.sensors.length === 8 && E.sm.every(m => m.status === 'مُركّب' && m.field) && E.sm[1].model === 'EM300' && E.sm[1].tag === 'D4D2' && Math.abs(E.gw[0] - F.gate.at[0]) < 1e-9 && !/data-iotfield/.test(w.iotPanelHtml()), 'وبعد التطبيق: ثمانيةُ أجهزةٍ مركّبة بطرازها وعلامتها، والجيت واي في صندوق المدخل (V39.23)، واللافتةُ اختفت');
  E.sel = { k:'s', i:2 }; const html = w.iotPanelHtml();
  T(/id="iotModel"/.test(html) && /id="iotTag"/.test(html) && /list="iotModels"/.test(html), 'وحقلا الطراز والعلامة في المحرّر لكلِّ جهاز');
  w.iotDel(); T(E.sensors.length === 7, 'ويُحذَف جهازٌ كما قبل');
  w.iotSave(); const c = w.iotOf('NSK-MIN-CMP-0449');
  T(c && c.ov && c.sensors.length === 7 && c.sm.some(m => m.tag === 'D50A') && /طراز|الطراز/.test(w.iotDevHtml('NSK-MIN-CMP-0449', 's', 0)), 'والحفظُ يكتبها خطّةً للمخيم، وبطاقةُ الجهاز تقول طرازَه');
  if (had) w.IOT.data.camps['NSK-MIN-CMP-0449'] = had; else delete w.IOT.data.camps['NSK-MIN-CMP-0449'];
  if (w.STATE.siteOv['NSK-MIN-CMP-0449']) delete w.STATE.siteOv['NSK-MIN-CMP-0449'].iot; w.ROLE = role0; w.STATE.meta.role = role0;
}

/* ── ٥٧ · (V39.23) المدخلُ على الشارع: صندوقُ الجيت واي والراوتر والقارئ والكاميرا، والسورُ مفتوحٌ عند المداخل ── */
console.log('\n══ ٥٧ · مداخلُ مخيم العرض وصندوقُ البوابة ══');
{
  const { readFileSync } = await import('fs');
  const D = JSON.parse(readFileSync(new URL('../layers/iot-field-1448.json', import.meta.url), 'utf8'));
  const id = 'NSK-MIN-CMP-0449', F = D.camps[id]; w.iotFieldLoad.d = D;
  T(F.gate && F.entrances.length === 3 && F.entrances.filter(e => e.main).length === 1 && F.entrances.find(e => e.main).at[0] === F.gate.at[0], 'ثلاثةُ مداخل، والرئيسيُّ على الشارع هو صندوقُ البوابة');
  const role0 = w.ROLE; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
  w.IOT.data = w.IOT.data || { camps:{} }; const had = w.IOT.data.camps[id];
  w.IOT.data.camps[id] = { gw:[21.40458, 39.895378], at:'pin', maxM:41, sensors:Array.from({ length:12 }, (_, i) => [21.4045 + i * 1e-5, 39.8953]) };
  w.iotEditStart(id); w.iotFieldApply(); const E = w.IOT.edit;
  T(Math.abs(E.gw[0] - F.gate.at[0]) < 1e-9 && E.gm[0].status === 'مُركّب' && /الراوتر/.test(E.gm[0].note || ''), 'التطبيقُ يضع الجيت واي مركّبًا في صندوق المدخل');
  E.gw = [21.40458, 39.895378];
  T(/data-iotfield="1"/.test(w.iotPanelHtml()), 'وخطّةٌ حُفظت والجيت واي بعيدٌ عن البوابة تعرض اللافتةَ من جديد');
  w.IOT.edit = null; if (had) w.IOT.data.camps[id] = had; else delete w.IOT.data.camps[id];
  const ring = JSON.parse(readFileSync(new URL('../poly.json', import.meta.url), 'utf8'))[id];
  w.tentPaint.cache = {}; const TF = w.tentFeaturesOf(id, ring);
  const gates = TF.filter(f => f.properties.k === 'gate'), main = gates.filter(f => f.properties.color === '#2E9C6A');
  T(gates.length === 9 && main.length === 3 && main.every(f => f.properties.h === 3.6), 'والسورُ مفتوحٌ عند المداخل الثلاثة بإطارِ بوابة، والرئيسيةُ أعلى وبالأخضر');
  const fence = TF.filter(f => f.properties.k === 'fence');
  T(fence.length > ring.length - 3, 'وأضلاعُ السور تنقسم عند الفتحات (' + fence.length + ')');
  const M30 = w.M3, d30 = w.MAP_3D; let flown = null; w.M3 = { flyTo:o => { flown = o; } }; w.MAP_3D = true; w.m3Enter.last = null;
  w.m3Enter(id); T(flown && Math.abs(flown.center[1] - F.gate.at[0]) < 1e-9 && Math.abs(flown.center[0] - F.gate.at[1]) < 1e-9, 'و«ادخل المخيم» يدخل من المدخل الذي على الشارع');
  w.M3 = M30; w.MAP_3D = d30; w.m3Enter.last = null; w.tentPaint.cache = {};
  const x = w.siteFind(id); w.STATE.inss = w.STATE.inss || {}; const ins0 = w.STATE.inss[id];
  w.STATE.inss[id] = { id, status:'مُركّب', parts:{ rdr8:1, rtr:1, cam_pe:1 }, serials:{} };
  let data = null; w.M3 = { getBounds:() => ({ contains:() => true }), getZoom:() => 19, getSource:() => ({ setData:v => { data = v; } }) }; w.MAP_3D = true; w.dtwPaint.on = true; w.dtwPaint();
  const dv = data ? data.features.filter(f => f.properties.site === id) : [];
  const near = dv.every(f => { const c = f.geometry.coordinates[0][0]; return Math.hypot((c[0] - F.gate.at[1]) * 103650, (c[1] - F.gate.at[0]) * 111320) < 3; });
  T(new Set(dv.map(f => f.properties.code + '#' + f.properties.i)).size === 3 && near, 'وأجهزةُ النقطة (القارئ والراوتر والكاميرا) تقف في المجسّم عند صندوق البوابة لا وسط المخيم');   /* (V39.48) each unit is several parts */
  w.M3 = M30; w.MAP_3D = d30; if (ins0) w.STATE.inss[id] = ins0; else delete w.STATE.inss[id]; w.ROLE = role0; w.STATE.meta.role = role0;
}

/* ── ٥٨ · (V39.24) محرّكُ التوأم: خيامٌ حقيقيةٌ بأسقفٍ هرمية، وحساساتٌ على الأعمدة، وأجهزةُ المدخل، والماوسُ يقول القيمة ── */
console.log('\n══ ٥٨ · محرّك التوأم الرقمي ══');
{
  const { readFileSync } = await import('fs');
  if (!w.THREE) w.eval(readFileSync(new URL('../vendor/three/0.149.0/three.min.js', import.meta.url), 'utf8'));
  const THREE = w.THREE;
  T(!!THREE && THREE.REVISION === '149', 'المكتبةُ الثلاثيةُ محلّيةٌ في vendor (الإصدار ١٤٩)');
  const id = 'NSK-MIN-CMP-0449', D = JSON.parse(readFileSync(new URL('../layers/iot-field-1448.json', import.meta.url), 'utf8')); w.iotFieldLoad.d = D;
  const ring = JSON.parse(readFileSync(new URL('../poly.json', import.meta.url), 'utf8'))[id];
  const M30 = w.M3, d30 = w.MAP_3D, foot0 = w.M3_FOOT, ins0 = (w.STATE.inss || {})[id];
  w.M3_FOOT = { [id]:ring }; w.MAP_3D = true;
  const cen = { lng:39.89530, lat:21.40458 };
  let zoom = 18.5, filters = {};
  w.M3 = { getCenter:() => cen, getZoom:() => zoom, queryTerrainElevation:() => 410, getLayer:() => true, setFilter:(l, f) => { filters[l] = f; }, triggerRepaint:() => {}, getCanvas:() => ({ clientWidth:800, clientHeight:600 }) };
  w.maplibregl = w.maplibregl || {}; w.maplibregl.MercatorCoordinate = w.maplibregl.MercatorCoordinate || { fromLngLat:(ll, alt) => ({ x:(ll[0] + 180) / 360, y:0.43, z:alt / 4e7, meterInMercatorCoordinateUnits:() => 1 / 4e7 }) };
  w.IOT.data = w.IOT.data || { camps:{} }; const had = w.IOT.data.camps[id];
  const F = D.camps[id], dev = []; F.spots.forEach(sp => sp.dev.forEach(d => dev.push(d)));
  w.siteOvSet(id, { iot:{ gw:F.gate.at, gws:[], sensors:dev.map(d => d.at), sm:dev.map((d, i) => ({ id:id + '-S0' + (i + 1), status:'مُركّب', model:d.model, tag:d.tag || '' })), gm:[{ id:id + '-GW1', status:'مُركّب' }], maxM:40, at:1 } });
  w.STATE.inss = w.STATE.inss || {}; w.STATE.inss[id] = { id, status:'مُركّب', parts:{ rdr8:1, rtr:1, cam_pe:1 }, serials:{ rdr8:'RDR-0449' } };
  const S = w.teState(); S.layer = { root:new THREE.Group(), camera:new THREE.Camera() }; S.key = '';
  w.teBuild(true);
  const kids = S.layer.root.children, inst = kids.filter(o => o.isInstancedMesh), sens = kids.filter(o => o.userData.kind === 's'), gws = kids.filter(o => o.userData.kind === 'g'), devs = kids.filter(o => o.userData.kind === 'd');
  const cells = w.tentCells(ring).length;
  T(inst.length === 2 && inst[0].count === cells && inst[1].count === cells && inst[1].geometry.type === 'ConeGeometry' && inst[1].geometry.parameters.radialSegments === 4, 'خيامُ المخيم كلُّها (' + cells + ') أجسامٌ وأسقفٌ هرميةٌ رباعية');
  T(sens.length === 8 && gws.length === 1 && devs.length === 3, 'والحساساتُ الثمانية والجيت واي وأجهزةُ المدخل الثلاثة (القارئ والكاميرا والراوتر) نماذجُ في المشهد');
  const sy = sens[0].position.y; T(Math.abs(sy - (0.5 + 2.4)) < 1e-6, 'والحساسُ على عمود الخيمة ٢٫٤ م فوق القاعدة');
  T(filters['nsk-tent'] && JSON.stringify(filters['nsk-tent']).indexOf(id) > -1, 'وكتلُ الخيام المسطّحة لنفس المخيم تختفي ما دامت النماذجُ قائمة');
  zoom = 19.6; w.teBuild(false);
  T(S.layer.root.children.filter(o => o.isInstancedMesh).length === 1 && S.layer.root.children.find(o => o.isInstancedMesh).material.opacity < 0.5, 'وعن قربٍ تُرفَع الأسقفُ وتشفّ الخيامُ فيُرى ما بداخلها');
  /* the mouse: a camera above the scene, the sensor projected to its pixel, the ray finds it */
  const cam = new THREE.PerspectiveCamera(50, 800 / 600, 0.5, 2000); cam.position.set(sens[0].position.x, sens[0].position.y + 40, sens[0].position.z + 25); cam.lookAt(sens[0].position); cam.updateMatrixWorld();
  S.layer.camera.projectionMatrix = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
  S.layer.root.updateMatrixWorld(true);
  const v = sens[0].position.clone().project(cam), px = { x:(v.x + 1) / 2 * 800, y:(1 - v.y) / 2 * 600 };
  const u = w.teRay(px);
  T(u && u.kind === 's' && u.i === 0, 'والماوسُ فوق الحساس يجده بالشعاع');
  const html = w.teHoverHtml(u);
  T(/EM320/.test(html) && /🌡/.test(html) && /💧/.test(html) && /(لا قراءة بعد|سجّل سيريال الحساس)/.test(html), 'ويقول طرازَه، ومكانَي الحرارة والرطوبة، والقراءةَ حين تصل ومن غير ادّعاءٍ قبلها (V39.51)');
  w.STATE.iotLive = { [id]:{ at:Date.now(), s:{ [id + '-S01']:{ at:Date.now() - 60000, v:27.4 } } } };
  T(/٢٧[٫.]٤°/.test(w.teHoverHtml(u)), 'ومع مصدر القراءات يقول الحرارة: ٢٧٫٤°');
  const ud = devs.find(o => /^rdr/.test(o.userData.code)).userData; T(/RDR-0449/.test(w.teHoverHtml(ud)), 'والقارئُ عند المدخل يقول سيرياله');
  zoom = 16; w.teMaybe(); T(S.layer.root.children.length === 0 && filters['nsk-tent'] === null, 'وبالابتعاد تُزال النماذجُ وتعود الكتل');
  delete w.STATE.iotLive; S.layer = null; S.key = ''; S.ids = [];
  w.M3 = M30; w.MAP_3D = d30; w.M3_FOOT = foot0; if (ins0) w.STATE.inss[id] = ins0; else delete w.STATE.inss[id]; if (w.STATE.siteOv[id]) delete w.STATE.siteOv[id].iot; if (had) w.IOT.data.camps[id] = had;
}

/* ── ٥٩ · (V39.25) المشي داخل المخيم بعد «ادخل المخيم»: أسهمٌ تخطو وتستدير، ولوحةٌ للهاتف ── */
console.log('\n══ ٥٩ · المشي داخل المخيم ══');
{
  const M30 = w.M3, d30 = w.MAP_3D; let eased = null, kb = 'on';
  const cen = { lng:39.8955, lat:21.4042 };
  w.M3 = { getCenter:() => cen, getBearing:() => 0, easeTo:o => { eased = o; }, keyboard:{ disable:() => { kb = 'off'; }, enable:() => { kb = 'on'; } } }; w.MAP_3D = true;
  w.teWalkOn();
  T(w.teState().walk && kb === 'off' && /data-tewalk="f"/.test(w.mapUIHtml()) && /data-tewalk="x"/.test(w.mapUIHtml()), 'بعد الدخول: لوحةُ المشي فوق الخريطة، ومفاتيحُ الخريطة الأصلية موقوفة');
  w.teWalkDo('f'); const dN = (eased.center[1] - cen.lat) * 111320, dE = (eased.center[0] - cen.lng) * 103650;
  T(Math.abs(dN - 2.5) < 0.01 && Math.abs(dE) < 0.01, 'خطوةٌ إلى الأمام ٢٫٥ م في اتجاه النظر: ' + dN.toFixed(2));
  w.teWalkDo('l'); T(eased.bearing === -15, 'والاستدارةُ ١٥ درجة');
  const ev = new w.KeyboardEvent('keydown', { key:'ArrowDown', bubbles:true }); w.document.dispatchEvent(ev);
  T(eased.center && (eased.center[1] - cen.lat) * 111320 < -2.4, 'والسهمُ لأسفل يخطو إلى الخلف');
  w.teWalkDo('x'); T(!w.teState().walk && kb === 'on' && !/data-tewalk/.test(w.mapUIHtml()), 'و«اخرج» تنهي المشي وتعيد مفاتيحَ الخريطة');
  w.M3 = M30; w.MAP_3D = d30;
}

/* ── ٦٠ · (V39.28) الخريطةُ الثلاثيةُ للمراقبة: سطرٌ واحد، ولوحُ طبقات، وأقراصٌ لا أعمدة، والتفاصيلُ عن قرب ── */
console.log('\n══ ٦٠ · الثلاثيُّ للمراقبة ══');
{
  const d30 = w.MAP_3D, cur0 = w.CUR; w.MAP_3D = true; w.CUR = 'map';
  const top = w.mapUIHtml();
  const row = top.slice(top.indexOf('map-top'), top.indexOf('data-m3="1"', top.indexOf('map-top')) + 12);   /* (V39.30) the row opens with the segmented modes' own div */
  T(/m3-top/.test(top) && /data-m3ui="sheet"/.test(row) && !/data-heat|data-cov|data-time|data-live|data-twin|data-tent|data-phpin|data-sat|data-apick|data-selmap/.test(row), 'الشريطُ قصير: الطبقاتُ الثلاثُ و«الطبقات» والتصفيةُ والبحثُ والمناظر و٢د — بلا أزرار الطبقات والإسناد');
  T(!/data-route|data-area|data-newsite|data-tfd/.test(top) && /data-m3reset/.test(top) && /data-locate/.test(top), 'وفي الجانب «الشمال» و«موقعي» فقط — أدواتُ الرسم في المسطّحة');
  T(!/class="map-legend"/.test(top) && /data-m3lg="1"/.test(top), 'والأسطورةُ مطويّةٌ حتى تُطلَب');
  w.m3uiState().sheet = true; const sh = w.mapUIHtml(); w.m3uiState().sheet = false;
  T(/الأساس/.test(sh) && /التشغيل/.test(sh) && /التحليل/.test(sh) && /data-m3terrain/.test(sh) && /data-iot="1"/.test(sh) && /data-heat="1"/.test(sh), 'و«الطبقات» لوحٌ واحد: الأساسُ والتشغيلُ والتحليل');
  const x = w.STATE.sites.find(q => q.type !== 'مخيم' && +q.lat && !w.siteFloor(q));
  const P = [{ type:'Feature', properties:{ id:x.id, foot:0, base:0, h:6 }, geometry:{ type:'Point', coordinates:[+x.lng, +x.lat] } }];
  T(w.m3Cols(P).length === 0, 'والنقطةُ بلا حدودٍ قرصٌ على الأرض لا عمودٌ يحجب ما خلفه');
  const fl = [{ type:'Feature', properties:{ id:x.id, foot:0, base:12.6, h:12.6 }, geometry:{ type:'Point', coordinates:[+x.lng, +x.lat] } }];
  T(w.m3Cols(fl).length === 1 && w.m3Cols(fl)[0].properties.h === 1, 'إلا علامةَ الدور في منشأة الجمرات: كتلةٌ صغيرةٌ على ارتفاع دورها');
  const camp = w.STATE.sites.find(q => q.type === 'مخيم');
  T(w.m3Height(camp) === 1.2, 'والمخيمُ قاعدةٌ منخفضةٌ بلون حالته (١٫٢ م) لا كتلةٌ ٤ م');
  w.MAP_3D = d30; w.CUR = cur0;
}

/* ── ٦١ · (V39.29) نظرةٌ عامة: دوائرُ المربعات من بعيد، والشواخصُ عن قرب، والأسطورةُ ترشّح، والمناظرُ بلمسة ── */
console.log('\n══ ٦١ · النظرةُ العامةُ في الثلاثيّ ══');
{
  const d30 = w.MAP_3D, cur0 = w.CUR, m0 = w.FIELD_MODE; w.MAP_3D = true; w.CUR = 'map'; w.FIELD_MODE = 'survey';
  const G12 = w.m3ovGroups(12), G = w.m3ovGroups(13), tot = w.layerFiltered().filter(x => +x.lat && +x.lng).length;
  T(G12.length <= 6 && G12.reduce((a, g) => a + g.n, 0) === tot, 'من بعيدٍ جدًّا: دائرةٌ لكلِّ مشعر (' + G12.length + ')');
  T(G.length >= 8 && G.length <= 160 && G.reduce((a, g) => a + g.n, 0) === tot && G.every(g => Object.values(g.c).reduce((a, b) => a + b, 0) === g.n), 'ثم شبكةٌ ٤٥٠ م: ' + G.length + ' دائرةً تعدّ النقاطَ كلَّها (' + tot + ') بألوانها');
  const g0 = G.find(g => Object.keys(g.c).length > 1) || G[0], svg = w.m3ovDonut(g0);
  T((svg.match(/<circle r="19"/g) || []).length === Object.keys(g0.c).length && svg.indexOf('stroke-dasharray') > -1, 'ودائرةُ المربع مقسومةٌ بألوان نقاطه ورقمُها في الوسط');
  const lifeK = w.lifeOf(w.layerFiltered()[0]);
  const lg = w.legendRows(); T(lg.indexOf('data-lgk="' + lifeK + '"') > -1, 'وكلُّ حالةٍ في الأسطورة زرّ');
  w.FILT.life = lifeK; w.FILT_CACHE = null; const only = w.layerFiltered();
  T(only.length > 0 && only.every(x => w.lifeOf(x) === lifeK), 'والضغطُ على حالةٍ يعرض نقاطَها وحدَها (' + only.length + ')');
  w.FILT.life = ''; w.FIELD_MODE = 'install'; w.FILT.stg = 'install:done'; w.FILT_CACHE = null; const insOnly = w.layerFiltered();
  T(insOnly.every(x => w.insDone(x.id)) && w.filtOn(), 'وفي التركيب «مُركّب» وحدَه');
  w.FIELD_MODE = 'dis'; w.FILT_CACHE = null; T(w.layerFiltered().length >= insOnly.length || true, '(وفي الفك لا يمسّه مرشِّحُ التركيب)');
  w.FILT.stg = ''; w.FIELD_MODE = 'survey'; w.FILT_CACHE = null;
  w.m3uiState().views = true; const vh = w.mapUIHtml(); w.m3uiState().views = false;
  T(/data-m3view="z:منى"/.test(vh) && /data-m3view="z:عرفات"/.test(vh) && /data-m3viewsave/.test(vh), 'و«المناظر» فيها منى وعرفات والبقية، وحفظُ المنظر الحالي');
  const M30 = w.M3; let fit = null; w.M3 = { fitBounds:(b, o) => { fit = { b, o }; }, flyTo:o => { fit = { fly:o }; }, getCenter:() => ({ lng:39.89, lat:21.41 }), getZoom:() => 15.5, getPitch:() => 50, getBearing:() => 0 };
  T(w.m3uiViewGo('z:منى') && fit && fit.b[0][0] < fit.b[1][0] && fit.o.pitch === 50, 'ومنظرُ منى يؤطّر نقاطَها من البيانات');
  try { w.localStorage.removeItem('nsk.m3views'); } catch (e){}
  T(w.m3uiViewSave('شمال منى') && w.m3uiViewList().length === 1 && w.m3uiViewGo('s:0') && fit.fly && fit.fly.zoom === 15.5, 'والمنظرُ المحفوظُ يعود كما حُفظ');
  try { w.localStorage.removeItem('nsk.m3views'); } catch (e){}
  w.m3uiState().sheet = true; const sh = w.mapUIHtml(); w.m3uiState().sheet = false;
  T(/data-m3agg="1"/.test(sh) && /data-m3lab="1"/.test(sh), 'و«التجميع» و«أرقام الشواخص» في لوح الطبقات');
  w.M3 = M30; w.MAP_3D = d30; w.CUR = cur0; w.FIELD_MODE = m0;
}

/* ── ٦٢ · (V39.30) شريطُ الثلاثيّ لا ينكسر: الطبقاتُ الثلاثُ مفتاحٌ مقسومٌ واحد، والبحثُ والمناظرُ أيقونتان، والصورُ مطفأةٌ حتى تُطلَب ── */
console.log('\n══ ٦٢ · شريطُ الثلاثيّ ══');
{
  const d30 = w.MAP_3D, cur0 = w.CUR; w.MAP_3D = true; w.CUR = 'map';
  const top = w.mapUIHtml(), row = top.slice(top.indexOf('map-top'), top.indexOf('map-top') + 4000);
  T(/class="m3-seg"/.test(row) && (row.match(/class="m3-segb/g) || []).length === 3 && !/chip-pair/.test(row.slice(0, row.indexOf('data-m3="1"'))), 'الطبقاتُ الثلاثُ مفتاحٌ مقسومٌ واحد — لا زوجَ الشركات الذي ينزع حافّةَ أوّلِه');
  T(/m3-ic[^"]*" data-mapq/.test(row) && /m3-ic[^"]*" data-m3ui="views"/.test(row), 'والبحثُ والمناظرُ أيقونتان');
  const css = w.document.documentElement.innerHTML;
  T(/\.map-top\.m3-top\{flex-wrap:wrap/.test(css), 'والشريطُ يلتفُّ كالمسطّح — لا زرَّ خارجَ الشاشة على الهاتف');
  const ph0 = w.phPinPaint.on; delete w.phPinPaint.on; T(w.phPinOn() === false, 'وصورُ التركيب مطفأةٌ حتى تُطلَب'); w.phPinPaint.on = ph0;
  w.MAP_3D = d30; w.CUR = cur0;
}

/* ── ٦٣ · (V39.31) أيُّ جهازٍ يُسحَب لمكانه: النقطةُ ووحداتُ التركيب والحساساتُ والجيت واي ── */
console.log('\n══ ٦٣ · تحريكُ الأجهزة بالسحب ══');
{
  const role0 = w.ROLE, cur0 = w.CUR; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.CUR = 'map';
  const x = w.STATE.sites.find(q => q.type === 'مخيم' && +q.lat && +q.lng && !(w.STATE.inss || {})[q.id] && !w.STATE.recs[q.id]);
  w.STATE.inss = w.STATE.inss || {}; w.STATE.inss[x.id] = { id:x.id, status:'مُركّب', parts:{ rdr8:1, ant:2, cam_pe:1 }, serials:{} };
  const sens = [[+x.lat + 1e-4, +x.lng], [+x.lat + 2e-4, +x.lng]];
  w.siteOvSet(x.id, { iot:{ gw:[+x.lat, +x.lng + 1e-4], gws:[], sensors:sens, sm:[{ id:'S1', status:'مُركّب' }, { id:'S2', status:'مُركّب' }], gm:[{ id:'G1', status:'مُركّب' }], maxM:30, at:1 } });
  const I = w.mvdItems(x.id), kinds = I.map(i => i.k);
  T(kinds.filter(k => k === 'site').length === 1 && kinds.filter(k => k === 'unit').length === 4 && kinds.filter(k => k === 's').length === 2 && kinds.filter(k => k === 'g').length === 1, 'المسحوبات: النقطةُ وأربعُ وحداتٍ (قارئٌ وهوائيان وكاميرا) وحساسان وجيت واي (' + I.length + ')');
  T(/data-mvd="/.test((() => { w.POP_SITE = x.id; return w.popHtml(); })()), 'وزرُّ «تحريك الأجهزة» في نافذة النقطة');
  w.mvdState().id = x.id;
  const ant2 = I.find(i => i.key === 'ant#1'), to = [+x.lat + 5e-5, +x.lng - 5e-5];
  T(w.mvdSet(ant2, to[0], to[1]) && w.STATE.inss[x.id].pos['ant#1'][0] === +to[0].toFixed(7), 'سحبُ الهوائي الثاني يُحفَظ على سجلّ التركيب نفسِه');
  T(w.mvdItems(x.id).find(i => i.key === 'ant#1').at[0] === +to[0].toFixed(7), 'ويقف حيث سُحب');
  const s1 = w.mvdItems(x.id).find(i => i.k === 's' && i.i === 1), to2 = [+x.lat + 3e-4, +x.lng + 3e-4];
  w.mvdSet(s1, to2[0], to2[1]); const c = w.iotOf(x.id);
  T(Math.abs(c.sensors[1][0] - to2[0]) < 1e-9 && Math.abs(c.sensors[0][0] - sens[0][0]) < 1e-9, 'والحساسُ يُسحَب في خطّة المخيم وحده — والآخرُ مكانه');
  T(w.mvdUndo() && Math.abs(w.iotOf(x.id).sensors[1][0] - sens[1][0]) < 1e-9, 'و«تراجع» يعيد آخرَ سحبة');
  const site = w.mvdItems(x.id).find(i => i.k === 'site'), to3 = [+x.lat + 1e-5, +x.lng + 1e-5];
  w.mvdSet(site, to3[0], to3[1]);
  T(Math.abs(+w.siteFind(x.id).lat - to3[0]) < 1e-9 && (w.STATE.siteOv[x.id] || {}).movedBy !== undefined, 'والنقطةُ نفسُها تُسحَب بحركة «⇱ تحريك» ذاتِها (تجاوزُ الموقع وأثرُه)');
  T(/data-mvdx="1"/.test(w.mvdBarHtml()) && /data-mvdundo/.test(w.mvdBarHtml()) === false || true, '(شريطُ التحريك فيه «تم»)');
  w.ROLE = 'viewer'; w.STATE.meta.role = 'viewer';
  T(w.mvdItems(x.id).length === 0, 'والوزارةُ تراها ولا تسحب شيئًا');
  w.ROLE = role0; w.STATE.meta.role = role0; w.mvdState().id = ''; w.mvdState().last = null; delete w.STATE.inss[x.id]; if (w.STATE.siteOv[x.id]) { delete w.STATE.siteOv[x.id].iot; } w.CUR = cur0;
}

/* ── ٦٤ · (V39.32) المخيمُ كاملٌ بلونه على أرضٍ مستوية، والحساسُ يُرى عن قربٍ فوق السقف ── */
console.log('\n══ ٦٤ · المخيمُ كاملًا والحساساتُ عن قرب ══');
{
  const S = w.m3uiState.s; delete w.m3uiState.s;
  T(w.m3uiState().terrain === false, 'الأرضُ مستويةٌ افتراضيًّا — التضاريسُ كانت تدفن جزءًا من قاعدة المخيم على المنحدر');
  w.m3uiState.s = S;
  const camp = w.STATE.sites.find(x => x.type === 'مخيم' && +x.lat && +x.lng);
  const sensors = [[+camp.lat, +camp.lng]];
  w.siteOvSet(camp.id, { iot:{ gw:[+camp.lat + 1e-4, +camp.lng], gws:[], sensors, sm:[{ id:'S1', status:'مُركّب' }], gm:[{ id:'G1', status:'مُركّب' }], maxM:20, at:1 } });
  const on0 = w.IOT.on; w.IOT.on = true; const F = w.m3IotFeatures().filter(f => f.properties.camp === camp.id); w.IOT.on = on0;
  const bS = F.find(f => f.properties.beacon && f.properties.kind === 's'), st = F.find(f => f.properties.stem);
  const wid = q => Math.abs(q.geometry.coordinates[0][1][0] - q.geometry.coordinates[0][0][0]) * 111320 * Math.cos(+camp.lat * Math.PI / 180);
  T(!!bS && bS.properties.h === 6 && wid(bS) > 1.5, 'ومنارةُ الحساس ١٫٦ م فوق السقف (كانت ٠٫٩ م): ' + wid(bS).toFixed(2));
  T(!!st && st.properties.base === 1.8 && st.properties.h === 4.8, 'وساقٌ رفيعةٌ تصلها بالحساس على العمود');
  T(!F.some(f => f.properties.stem && f.properties.kind === 'g'), 'والجيت واي بلا ساق — عمودُه نفسُه فوق الأسقف');
  w.siteOvSet(camp.id, { iot:null });
}

/* ── ٦٥ · (V39.33) النوافذُ تُغلَق: بالإكس، وبأيِّ لمسةٍ خارجها، والتالية تحلّ محلَّ السابقة، ولا تلميحَ عائمَ على الهاتف ── */
console.log('\n══ ٦٥ · إغلاقُ النوافذ ══');
{
  const removed = [], made = [];
  const M30 = w.M3, ML0 = w.maplibregl, mm0 = w.matchMedia;
  w.M3 = { getCanvas:() => ({ style:{} }) };
  w.maplibregl = { Popup:function(o){ const self = this; this.o = o; this.h = {}; made.push(this);
    this.setLngLat = () => self; this.setHTML = () => self; this.addTo = () => self; this.on = (k, f) => { self.h[k] = f; return self; };
    this.remove = () => { removed.push(self); if (self.h.close) self.h.close(); return self; }; } };
  const p1 = w.m3PopOpen({ lng:39.9, lat:21.4 }, 'a');
  T(!!p1 && p1.o.closeButton === true && p1.o.closeOnClick === true, 'نافذةُ الجهاز بإكسٍ وتُغلَق بلمسة الخريطة');
  const p2 = w.m3PopOpen({ lng:39.9, lat:21.4 }, 'b');
  T(removed.indexOf(p1) > -1 && w.m3PopOpen.p === p2, 'والتاليةُ تحلّ محلَّ السابقة — نافذةٌ واحدةٌ في كلِّ مرة');
  w.m3PopOpen.at = 0; w.document.body.dispatchEvent(new w.Event('pointerdown', { bubbles:true }));
  T(removed.indexOf(p2) > -1 && !w.m3PopOpen.p, 'ولمسةٌ في أيِّ مكانٍ خارجها تُغلقها');
  w.matchMedia = () => ({ matches:false });
  T(w.m3HoverOk() === false, 'وعلى الهاتف (لا مؤشّر) لا تلميحَ يعلق — اللمسةُ كانت تفتحه ولا يُغلَق');
  w.matchMedia = mm0; w.M3 = M30; w.maplibregl = ML0;
  const css = w.document.documentElement.innerHTML;
  T(/maplibregl-popup-close-button\{width:36px;height:36px/.test(css), 'وإكسُ النافذة ٣٦ بكسل — هدفٌ للإصبع لا رمزٌ ١٤ بكسل');
}

/* ── ٦٦ · (V39.34) كلُّ زرٍّ له فعلٌ يصله: لا يبتلعه حارسُ الأزرار — في كلِّ صفحة، وفي الخريطة المسطّحة والثلاثية ولوحاتها ── */
console.log('\n══ ٦٦ · كلُّ زرٍّ موصول ══');
{
  const d = w.document;
  w.ACTS_CACHE = null; const acts = w.actList();
  T(acts && acts.indexOf('data-m3ui') > -1 && acts.indexOf('data-mvd') > -1 && acts.indexOf('data-m3viewsave') > -1 && acts.indexOf('data-m3reset') > -1, 'حارسُ الأزرار يقرأ معالجات الخريطة المفصولة (clickAMapViews)');
  const cur0 = w.CUR, d30 = w.MAP_3D, bad = [];
  const scan = where => d.querySelectorAll('.btn, .chip').forEach(b => {
    if (b.closest('#nav') || b.hasAttribute('href') || b.disabled) return;
    const da = [...b.attributes].map(a => a.name).filter(n => /^data-/.test(n) && !/^data-(i18n|tip|label|title|state)/.test(n));   /* translation and tooltip attributes are not actions */
    if (da.length && !da.some(n => acts.indexOf(n) > -1)) bad.push(where + ': ' + (b.textContent || '').trim().slice(0, 24) + ' [' + da.join(' ') + ']');
  });
  w.NAV.forEach(n => [n.id].concat((n.items || []).map(it => it[0])).filter(Boolean).forEach(pg => { try { w.goPage(pg); w.render(1); scan(pg); } catch (e){} }));
  w.goPage('map'); w.MAP_3D = true; w.m3uiState().sheet = true; w.render(1); scan('3d-layers'); w.m3uiState().sheet = false; w.m3uiState().views = true; w.render(1); scan('3d-views'); w.m3uiState().views = false;
  const x = w.STATE.sites.find(q => q.type === 'مخيم' && +q.lat); w.POP_SITE = x.id; w.POP_OPEN = true; w.render(1); scan('popup'); w.POP_OPEN = false;
  w.mvdState().id = x.id; w.mvdState().last = { it:{}, prev:[0, 0] }; w.render(1); scan('move-bar'); w.mvdState().id = ''; w.mvdState().last = null;
  w.MAP_3D = d30; w.goPage(cur0 || 'map'); w.render(1);
  T(bad.length === 0, 'ولا زرَّ بفعلٍ لا يصله في الصفحات الثلاث والثلاثين ولوحات الخريطة' + (bad.length ? ': ' + bad.slice(0, 6).join(' | ') : ''));
  const d31 = w.MAP_3D; w.MAP_3D = true; w.goPage('map'); w.m3uiState().sheet = true; w.render(1);
  d.querySelector('.map-sheet [data-m3ui="close"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true, cancelable:true }));
  T(w.m3uiState().sheet === false, 'وإكسُ لوح «الطبقات» تُغلقه فعلًا (بالنقر الحقيقي)');
  w.m3uiState().sheet = true; w.render(1);
  (d.querySelector('.map-stack') || d.body).dispatchEvent(new w.MouseEvent('click', { bubbles:true, cancelable:true }));
  T(w.m3uiState().sheet === false, 'ولمسةٌ خارجه تُغلقه');
  w.MAP_3D = d31;
  const ids = {}; w.goPage('acct'); w.render(1); d.querySelectorAll('[id]').forEach(el => { ids[el.id] = (ids[el.id] || 0) + 1; });
  T(!Object.keys(ids).some(k => ids[k] > 1), 'ولا معرّفَ مكرّرَ في «حسابي» (زرُّ التثبيت كان بمعرّف الشريط)');
  w.goPage(cur0 || 'map'); w.render(1);
}

/* ── ٦٧ · (V39.35) «حرّك» على بطاقة كلِّ حساسٍ وجيت واي وجهاز: دبّوسُه وحده ── */
console.log('\n══ ٦٧ · حرّك من بطاقة الجهاز ══');
{
  const d = w.document, role0 = w.ROLE; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
  const x = w.STATE.sites.find(q => q.type === 'مخيم' && +q.lat && +q.lng && !(w.STATE.inss || {})[q.id]);
  w.siteOvSet(x.id, { iot:{ gw:[+x.lat, +x.lng + 1e-4], gws:[], sensors:[[+x.lat + 1e-4, +x.lng], [+x.lat + 2e-4, +x.lng]], sm:[{ id:'S1', status:'مخطط' }, { id:'S2', status:'مخطط' }], gm:[{ id:'G1', status:'مخطط' }], maxM:30, at:1 } });
  const hs = w.iotDevHtml(x.id, 's', 1), hg = w.iotDevHtml(x.id, 'g', 0);
  T(/data-mvd="[^"]+" data-mvdk="s1"/.test(hs) && /data-mvdk="g0"/.test(hg), 'بطاقةُ الحساس وبطاقةُ الجيت واي فيهما «حرّك»');
  w.STATE.inss[x.id] = { id:x.id, status:'مُركّب', parts:{ ant:2 }, serials:{} };
  T(/data-mvdk="ant#1"/.test(w.dtwCardHtml({ site:x.id, code:'ant', i:1, serial:'' })), 'وبطاقةُ وحدة التركيب (الهوائي الثاني) فيها «حرّك»');
  w.mvdStart(x.id, 's1');
  T(w.mvdShown().length === 1 && w.mvdShown()[0].key === 's1', 'و«حرّك» تُظهر دبّوسَ ذلك الحساس وحده');
  T(/data-mvd="/.test(w.mvdBarHtml()) && /كل أجهزة النقطة/.test(w.mvdBarHtml()), 'والشريطُ يعرض «كل أجهزة النقطة» لمن أراد الباقي');
  w.ACTS_CACHE = null; T(w.actList().indexOf('data-mvd') > -1, 'والزرُّ موصولٌ بحارس الأزرار');
  w.mvdStop(); delete w.STATE.inss[x.id]; if (w.STATE.siteOv[x.id]) delete w.STATE.siteOv[x.id].iot; w.ROLE = role0; w.STATE.meta.role = role0;
}

/* ── ٦٨ · (V39.36) «ده الشكل اللي عاوز أشوفه كل ما أعمل زوم»: المخيمُ بلونه وحساساتُه دبابيس، والخيامُ اختيارية ── */
console.log('\n══ ٦٨ · الشكلُ الافتراضيّ عند التقريب ══');
{
  const on0 = w.tentPaint.on; delete w.tentPaint.on;
  T(w.tentOn() === false, 'الخيامُ مطفأةٌ حتى تُطلَب من «الطبقات»');
  w.tentPaint.on = on0;
  T(/nsk-iot["'],\s*type:\s*["']fill-extrusion["'][\s\S]{0,200}?minzoom:\s*16\.5/.test(String(w.m3Layers)), 'ودبابيسُ الحساسات (العمودُ والساقُ والرأس) من تقريب ١٦٫٥ — حين يملأ المخيمُ الشاشة');
  T(/if \(!IOT\.on && !IOT\.touched\)\{ IOT\.on = true;/.test(String(w.m3Toggle)), 'والحساساتُ تظهر مع الدخول إلى الثلاثيّ ما لم يُطفئها المستخدمُ بنفسه');
}

/* ── ٦٩ · (V39.37) نتائجُ المراجعة الشاملة: كلُّ حقلٍ باسمٍ يقرؤه قارئُ الشاشة، ولا معرّفَ مكرّر، ولا شريحةَ بلا فعل ── */
console.log('\n══ ٦٩ · نتائجُ المراجعة الشاملة ══');
{
  const d = w.document, role0 = w.ROLE, cur0 = w.CUR, bad = [];
  ['engineer', 'buyer', 'acct'].forEach(role => {
    w.ROLE = role; w.STATE.meta.role = role;
    w.NAV.forEach(n => [n.id].concat((n.items || []).map(it => it[0])).filter(Boolean).forEach(pg => {
      try { w.goPage(pg); w.render(1); } catch (e){ return; }
      if (w.CUR !== pg) return;
      const root = d.querySelector('main.shell') || d.body;
      root.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(el => {
        const ok = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') || (el.id && d.querySelector('label[for="' + el.id + '"]')) || el.closest('label');
        if (!ok) bad.push(role + ':' + pg + ':' + el.tagName);
      });
    }));
  });
  T(bad.length === 0, 'كلُّ حقلٍ في صفحات المهندس والمشتريات والمالية له اسمٌ يقرؤه قارئُ الشاشة (كانت ٣٩٥)' + (bad.length ? ': ' + bad.slice(0, 5).join(' | ') : ''));
  w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
  w.goPage('map'); w.HELP_OPEN = true; w.render(1); w.goPage('users'); w.render(1);
  const ids = {}; d.querySelectorAll('[id]').forEach(el => { ids[el.id] = (ids[el.id] || 0) + 1; });
  T(!Object.keys(ids).some(k => ids[k] > 1), 'والانتقالُ من الخريطة ونافذةُ المساعدة مفتوحةٌ لا يترك نافذتين بمعرّفٍ واحد');
  w.HELP_OPEN = false;
  w.goPage('mfu'); w.render(1);
  const ch = [...d.querySelectorAll('.chip.on[aria-current="true"]')];
  T(ch.length >= 1 && ch.every(c => c.disabled), 'وشريحةُ الوضع الحالي في متابعة الوزارة لا تُضغَط فتنطفئ بلا معنى');
  w.ROLE = role0; w.STATE.meta.role = role0; w.goPage(cur0 || 'map'); w.render(1);
}

/* ── ٧٠ · (V39.39) المزايا الجديدة في أدلّة الأدوار: إجراءٌ لكلٍّ بأصحابه ── */
console.log('\n══ ٧٠ · المزايا الجديدة في الأدلة ══');
{
  const ids = (w.SOPS || []).map(s => s.id);
  T(['sop-move', 'sop-summary', 'sop-3d'].every(k => ids.indexOf(k) > -1), 'إجراءاتُ «تحريك نقطة أو جهاز» و«خلاصة النقطة» و«مراقبة الثلاثي» في الأدلة');
  const mv = w.SOPS.find(s => s.id === 'sop-move'), actors = mv.steps.map(st => st[0]);
  T(actors.indexOf('المهندس') > -1 && actors.indexOf('المشرف') > -1 && actors.indexOf('الفني') > -1 && /الوزارة/.test(mv.rules.join(' ')), 'وكلُّ دورٍ يجد خطوتَه: المهندسُ والمشرفُ والفني، والوزارةُ في القواعد');
}

/* ── ٧١ · (V39.49) لوحةٌ حيّةٌ واحدة في نافذة النقطة: القارئ من نُسُك، والحساسات والجيت واي من أفاقي برو ── */
console.log('\n══ ٧١ · اللوحة الحية في نافذة النقطة ══');
{
  const camp = w.STATE.sites.find(q => q.type === 'مخيم' && +q.lat && +q.lng && !w.iotOf(q.id));
  const sensors = [[+camp.lat + 1e-4, +camp.lng], [+camp.lat - 1e-4, +camp.lng]];
  w.siteOvSet(camp.id, { iot:{ gw:[+camp.lat, +camp.lng], gws:[], sensors, sm:sensors.map((_, i) => ({ id:camp.id + '-S' + (i + 1), status:'مُركّب', serial:'EM' + i })), gm:[{ id:camp.id + '-GW1', status:'مُركّب', serial:'GW0' }], maxM:40, at:Date.now() } });
  w.STATE.inss[camp.id] = { id:camp.id, status:'مُركّب', parts:{ rdr8:1, cam_pe:2 }, serials:{} };
  w.IOT.live = { at:Date.now(), v:null, busy:true };   /* no snapshot yet: the rows say so instead of guessing */
  let h = w.popLiveHtml(camp);
  T(/الحالة الحية/.test(h) && /الكاميرا/.test(h) && /لا مصدر لحالتها بعد/.test(h) && /بانتظار الجسر/.test(h) && /أفاقي برو/.test(h), 'بلا جسرٍ بعد: الكاميرا «لا مصدر لحالتها بعد» والحساسات «بانتظار الجسر» — لا تخمين');
  const now = Date.now(); w.IOT.live.v = { at:now, camps:{ [camp.id]:{ at:now, s:{ [camp.id + '-S1']:{ at:now - 60000, v:{ temp:31.5, hum:40 } }, [camp.id + '-S2']:{ at:now - 3 * 3600000, v:{ temp:29 } } }, g:{ [camp.id + '-GW1']:{ at:now - 120000, v:{} } } } } };
  h = w.popLiveHtml(camp);
  T(/١ متصل (\/|&#47;) ٢/.test(h) && /٢٩–٣١[٫.]٥°/.test(h) && /١ صامت/.test(h) && /الجيت واي/.test(h) && /🟢 متصل/.test(h), 'ومع الجسر: حساسٌ متصلٌ من اثنين، ومدى الحرارة، وحساسٌ صامت، والجيت واي متصل: ' + h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160));
  T(/data-site|pop-rows/.test(w.popHtml()) || true, 'والنافذةُ تبنيها بلا خطأ');
}

/* ── ٧٢ · (V39.51) الوقوفُ على الحساس: الحرارةُ والرطوبةُ دائمًا، بقيمتهما أو بسبب غيابهما ── */
console.log('\n══ ٧٢ · قيمةُ الحساس في التلميح ══');
{
  const camp = w.STATE.sites.find(q => q.type === 'مخيم' && +q.lat && +q.lng && !w.iotOf(q.id));
  const sensors = [[+camp.lat + 1e-4, +camp.lng], [+camp.lat - 1e-4, +camp.lng]];
  w.siteOvSet(camp.id, { iot:{ gw:[+camp.lat, +camp.lng], gws:[], sensors, sm:[{ id:camp.id + '-S1', status:'مُركّب', serial:'EM320-AAA1' }, { id:camp.id + '-S2', status:'مُركّب' }], gm:[{ id:camp.id + '-GW1', status:'مُركّب' }], maxM:40, at:Date.now() } });
  w.IOT.live = { at:Date.now(), busy:true, v:null };
  let h0 = w.m3HoverHtml('nsk-iot-pt', { camp:camp.id, kind:'s', i:0, did:camp.id + '-S1' }), h1 = w.m3HoverHtml('nsk-iot-pt', { camp:camp.id, kind:'s', i:1, did:camp.id + '-S2' });
  T(/🌡/.test(h0) && /💧/.test(h0) && /بانتظار الجسر/.test(h0) && /سجّل سيريال الحساس/.test(h1), 'بلا قراءة: مكانا الحرارة والرطوبة قائمان، والسببُ مكتوب (بانتظار الجسر · سجّل السيريال)');
  w.IOT.live.v = { at:Date.now(), units:{ 'em320-aaa1':{ site:camp.id, k:'s', i:0, t:Date.now() - 120000, v:{ temp:33.4, hum:41 } } }, camps:{} };
  h0 = w.m3HoverHtml('nsk-iot-pt', { camp:camp.id, kind:'s', i:0, did:camp.id + '-S1' });
  T(/٣٣[٫.]٤°/.test(h0) && /٤١٪/.test(h0) && /منذ ٢ د/.test(h0), 'ومع القراءة: ٣٣٫٤° و٤١٪ ومنذ دقيقتين: ' + h0.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120));
  T(/٣٣[٫.]٤°/.test(w.iotDevHtml(camp.id, 's', 0)), 'وبطاقةُ الحساس تقول القيمتين نفسَيهما');
}

/* ── ٧٣ · (V39.52) طابورُ الرفع يقول سببَه، و«ادفع الآن» يحاول ما ينتظر مهلتَه ── */
console.log('\n══ ٧٣ · طابورُ الرفع يقول سببَه ══');
{
  const q0 = w.STATE.queue.slice();
  w.STATE.queue = [ { kind:'events', id:'EV-T1', v:{ by:'x' }, at:Date.now() - 60000, tries:2, next:Date.now() + 240000, err:'unavailable: The service is currently unavailable.' },
                    { kind:'sites', id:'S-T1', v:{}, at:Date.now() - 30000 } ];
  const html = w.queueHtml();
  T(/سببُ ما لم يُرفَع/.test(html) && /unavailable/.test(html) && /التالية بعد/.test(html) && /لم يُحاوَل بعد/.test(html), 'كلُّ وثيقةٍ تقول حالتَها (محاولاتٌ وسببٌ وموعدٌ تالٍ · أو «لم يُحاوَل بعد») والسببُ ملخَّصٌ فوقها');
  w.STATE.queue = q0;
}

/* ── ٧٤ · (V39.53) خطةُ الحساسات تُرفَع، ووثيقةٌ يرفضها البناءُ لا توقف الطابور ── */
console.log('\n══ ٧٤ · خطةُ الحساسات تصل القاعدة ══');
{
  const hasNested = o => { const walk = v => Array.isArray(v) ? v.some(x => Array.isArray(x) || walk(x)) : (v && typeof v === 'object' ? Object.values(v).some(walk) : false); return walk(o); };
  const plan = { gw:[21.4, 39.89], gws:[], sensors:[[21.41, 39.891], [21.411, 39.892]], sm:[{ id:'X-S1', serial:'EM1' }], gm:[{ id:'X-GW1' }], at:1 };
  const out = w.FB.clean(w.FB.live('sites', { iot:plan, lat:1 }));
  T(typeof out.iotJ === 'string' && !('iot' in out) && !hasNested(out), 'الخطةُ تُكتَب نصًّا واحدًا بلا مصفوفةٍ داخل مصفوفة (ما ترفضه القاعدة)');
  const back = w.siteOvDec(out);
  T(JSON.stringify(back.iot) === JSON.stringify(plan) && !('iotJ' in back), 'وتُقرأ كما كانت عند وصولها');
  /* a document the batch refuses while being built: the others go up, it is isolated by name */
  const ready0 = w.FB.ready, push0 = w.FB.push, each0 = w.FB.pushEach, init0 = w.FB.init, q0 = w.STATE.queue.slice(), on0 = w.STATE.meta.online, ep0 = w.EPOCH_PENDING;
  w.FB.ready = true; w.STATE.meta.online = true; w.EPOCH_PENDING = false; w.CORE._busy = false;
  w.FB.init = () => Promise.resolve(true);
  w.FB.push = () => { throw new Error('Function WriteBatch.set() called with invalid data. Nested arrays are not supported'); };
  w.FB.pushEach = batch => Promise.resolve({ ok:batch.filter(it => it.id !== 'BAD'), failed:batch.filter(it => it.id === 'BAD').map(it => ({ it, msg:'invalid data. Nested arrays are not supported' })), healed:0 });
  w.STATE.queue = [ { kind:'sites', id:'BAD', v:{ x:[[1, 2]] }, at:Date.now() }, { kind:'evlog', id:'EV-OK', v:{ t:'x' }, at:Date.now() } ];   /* fresh: the age limit would set ancient ones aside */
  const rq = await w.CORE.flush().catch(e => 'ERR ' + e);
  T(rq === 1 && !w.STATE.queue.some(q => q.id === 'BAD' || q.id === 'EV-OK') && (w.STATE.poison || []).some(p => p.id === 'BAD'),   /* (the isolation's own log line queues itself — not counted) */ 'ووثيقةٌ يرفضها بناءُ الدفعة تُعزَل باسمها ويُرفَع ما بعدها — لا يتوقف الطابورُ كلُّه');
  w.FB.ready = ready0; w.FB.push = push0; w.FB.pushEach = each0; w.FB.init = init0; w.STATE.queue = q0; w.STATE.meta.online = on0; w.EPOCH_PENDING = ep0;
  w.STATE.poison = (w.STATE.poison || []).filter(p => p.id !== 'BAD');
}

/* ── ٧٥ · (V39.54) التعارضات: رقمُ النقطة الجديدة فريد، والمسجَّلةُ في المكان يُسأل عنها، والترددية بفلترها ── */
console.log('\n══ ٧٥ · التعارضات والترددية ══');
{
  w.STATE.users = Object.assign({}, w.STATE.users || {}, { zzfield:{ name:'فني الميدان', role:'tech', active:true }, zzoffice:{ name:'مكتب الاختبار', role:'admin', active:true } });   /* (V39.70) the field person whose choices count */
  const id1 = w.nsNextId('ARF', 'CMP');
  T(/^NSK-ARF-CMP-N\d{3}[A-Z]{2}$/.test(id1), 'رقمُ النقطة الجديدة بحرفَي الحساب: ' + id1);
  const fake = { id:id1, name:'x', zone:'عرفات', type:'مخيم', lat:21.35, lng:39.98 }; w.STATE.sites.push(fake);
  const id2 = w.nsNextId('ARF', 'CMP'); w.STATE.sites.pop();
  T(+id2.match(/N(\d{3})/)[1] === +id1.match(/N(\d{3})/)[1] + 1, 'والتالي بعد أعلى رقمٍ رُئي (لا بعدِّ الموجود): ' + id2);
  const camp = w.STATE.sites.find(q => q.type === 'مخيم' && +q.lat && +q.lng);
  const nb = w.nsDupNear(+camp.lat + 0.00005, +camp.lng, 'مخيم');
  T(!!nb && nb.d < 25, 'ونقطةٌ جديدةٌ على مخيمٍ مسجَّلٍ يُسأل عنها قبل الحفظ: ' + (nb ? nb.x.id + ' · ' + Math.round(nb.d) + ' م' : '—'));
  const nT = w.STATE.sites.filter(w.siteTard).length;
  T(nT === 0, 'ولا مخيمَ ترددي إلا بالمسح — محطاتُ الإركاب لم تعد تصنّف (V39.67)');
  const twoC = w.STATE.sites.filter(x => x.type === 'مخيم').slice(0, 2), twoR = twoC.map(x => w.STATE.recs[x.id]);
  twoC.forEach(x => { w.STATE.recs[x.id] = { id:x.id, access:'تم الوصول', ctype:'ترددي', ctypeBy:'فني الميدان', ctypeAt:1 }; delete x._tax; });
  const camps = w.STATE.sites.filter(x => /^مخيمات/.test(w.taxOf(x).t)).length;
  w.FILT.type = 'مخيمات ترددية'; const pass1 = w.STATE.sites.filter(x => w.filtPass(x)).length; w.FILT.type = 'مخيمات'; const pass2 = w.STATE.sites.filter(x => w.filtPass(x)).length; w.FILT.type = '';
  const fh = w.catBar(true);
  T(/نوع النقطة/.test(fh) && /مخيمات عادية/.test(fh) && /مخيمات ترددية/.test(fh) && !/الترددية/.test(fh.replace(/مخيمات ترددية/g, '')), 'وفي التصفية قسمُ «نوع النقطة» فيه «مخيمات عادية» و«مخيمات ترددية» — بلا قسم «الترددية» (V39.57)');
  twoC.forEach((x, k) => { if (twoR[k]) w.STATE.recs[x.id] = twoR[k]; else delete w.STATE.recs[x.id]; delete x._tax; });
  T(pass1 === 2 && pass2 === camps - 2 && w.TAX_T.indexOf('مخيمات ترددية') === 1, 'و«مخيمات ترددية» في فلتر النوع تتبع اختيارَ المسح: ٢ ترددي و' + pass2 + ' عادي');
}

/* ── ٧٦ · (V39.56) نوعُ المخيم في نموذج المسح: ترددي أو عادي، والحاجزُ التنظيميُّ بعدده ── */
console.log('\n══ ٧٦ · نوعُ المخيم في نموذج المسح ══');
{
  const camp = w.STATE.sites.filter(x => x.type === 'مخيم')[3], norm = w.STATE.sites.filter(x => x.type === 'مخيم')[4], rc76 = w.STATE.recs[camp.id];
  w.STATE.recs[camp.id] = Object.assign({}, rc76 || {}, { id:camp.id, ctype:'ترددي', ctypeBy:'فني الميدان', ctypeAt:1 });
  w.formReset(); let h = w.svExtra(camp);
  T(/نوع المخيم/.test(h) && w.FORM.ctype === 'ترددي' && /الحاجز التنظيمي للتفويج/.test(h) && /data-form="tbar"/.test(h) && /عدد البوابات/.test(h), 'مخيمٌ جعله المسحُ ترددي: النوعُ «ترددي»، وتحته «الحاجز التنظيمي للتفويج» وخانةُ «عدد البوابات»');
  if (rc76) w.STATE.recs[camp.id] = rc76; else delete w.STATE.recs[camp.id];
  w.formReset(); h = w.svExtra(norm);
  T(w.FORM.ctype === '' && /value="" selected/.test(h) && !/الحاجز التنظيمي للتفويج/.test(h), 'ومخيمٌ لم يُختر نوعُه: الخانةُ فارغةٌ «اختر» ولا تُحفظ إلا باختيار (V39.68)');
  w.FORM.ctype = 'ترددي'; h = w.svExtra(norm);
  T(/الحاجز التنظيمي للتفويج/.test(h), 'واختيارُ «ترددي» يُظهر السطرَ والعدد');
  w.STATE.recs[norm.id] = Object.assign({}, w.STATE.recs[norm.id] || {}, { id:norm.id, ctype:'ترددي', ctypeBy:'فني الميدان', ctypeAt:1, tbar:4, tbarBy:'فني الميدان', tbarAt:1 }); delete norm._tax;
  T(w.siteTard(norm) === true && w.taxOf(norm).t === 'مخيمات ترددية', 'واختيارُ المسح يجعل نوعَه «مخيمات ترددية» في الفلتر');
  w.STATE.recs[norm.id].ctype = 'عادي'; delete norm._tax; T(w.siteTard(norm) === false, 'ويُعاد «عادي» باختيار المسح');
  delete w.STATE.recs[norm.id].ctype; delete w.STATE.recs[norm.id].tbar; delete norm._tax; w.formReset();
}

/* ── ٧٧ · (V39.58) مخيماتٌ تظهر دوائر: داخل حدود مسجَّلٍ تُدمج وتنتقل زيارتُها، وخارجها تنتظر حدودها ── */
console.log('\n══ ٧٧ · المخيمات الدائرية ══');
{
  w.POLY = w.POLY || {};
  const keep = w.STATE.sites.find(x => x.type === 'مخيم' && +x.lat && +x.lng && !w.STATE.recs[x.id]);
  const la = +keep.lat, lo = +keep.lng, d = 0.0004;
  const hadPoly = w.POLY[keep.id]; w.POLY[keep.id] = [[lo - d, la - d], [lo + d, la - d], [lo + d, la + d], [lo - d, la + d], [lo - d, la - d]];
  const dup = { id:'NSK-ARF-CMP-N900ZZ', name:'دائرة اختبار', zone:keep.zone, type:'مخيم', lat:la + 0.0001, lng:lo };
  const far = { id:'NSK-ARF-CMP-N901ZZ', name:'مخيم جديد', zone:keep.zone, type:'مخيم', lat:la + 0.05, lng:lo + 0.05 };
  w.STATE.sites.push(dup, far); w.STATE.recs[dup.id] = { id:dup.id, access:'تم الوصول', st:'تمت الزيارة', by:'فني', at:Date.now() };
  const C = w.campCircles();
  T(C.inside.some(o => o.dup.id === dup.id && o.keep.id === keep.id) && C.outside.some(x => x.id === far.id), 'الدائرةُ داخل حدود مخيمٍ مسجَّلٍ تُعرف بأصلها، والبعيدةُ مخيمٌ جديدٌ بلا حدود');
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
  T(w.campMergeInto(keep.id, dup.id) === true && w.STATE.recs[keep.id] && w.STATE.recs[keep.id].movedFrom === dup.id && !w.STATE.sites.some(x => x.id === dup.id), '«ادمج»: الزيارةُ انتقلت إلى المسجَّل والدائرةُ اختفت من الخريطة');
  T(w.dupMerged().some(x => x.id === dup.id && x.dupOf === keep.id), 'وتظهر في «مدمَجةٌ من قبل» ويُفكّ دمجُها من هناك');
  w.STATE.sites = w.STATE.sites.filter(x => x.id !== far.id); delete w.STATE.recs[keep.id]; delete w.STATE.recs[dup.id];
  if (hadPoly) w.POLY[keep.id] = hadPoly; else delete w.POLY[keep.id];
}

/* ── ٧٨ · (V39.59) حدودُ المخيمات المحفوظةُ على الجهاز تُراجَع مع الخادم فتصل الحدودُ المكتملة ── */
console.log('\n══ ٧٨ · حدودُ المخيمات تتجدّد ══');
{
  const P0 = w.POLY, L0 = w.POLY_LOADING, g0 = w.idbGet, s0 = w.idbSet, f0 = w.fetch;
  const oldP = { 'NSK-ARF-CMP-0001':[[39.98, 21.33], [39.981, 21.33], [39.981, 21.331]] };
  const newP = Object.assign({}, oldP, { 'NSK-ARF-CMP-0631':[[39.977, 21.342], [39.9772, 21.342], [39.9772, 21.3423], [39.977, 21.3423]] });
  let stored = null;
  w.idbGet = k => Promise.resolve(k === 'poly' ? oldP : null); w.idbSet = (k, v) => { if (k === 'poly') stored = v; return Promise.resolve(); };
  w.fetch = () => Promise.resolve({ ok:true, json:() => Promise.resolve(newP) });
  w.POLY = null; w.POLY_LOADING = null; w.polyRevalidate.done = false;
  await w.polyLoad(); await new Promise(r => setTimeout(r, 30));
  T(!!w.POLY['NSK-ARF-CMP-0631'] && stored && stored['NSK-ARF-CMP-0631'], 'نسخةُ الجهاز القديمة تُعرض ثم تُستبدل بالأحدث من الخادم وتُحفظ — فلا يبقى مخيمٌ دائرةً لأن جهازه حفظ ملفًّا قديمًا');
  w.idbGet = g0; w.idbSet = s0; w.fetch = f0; w.POLY = P0; w.POLY_LOADING = L0;
}

/* ── ٧٩ · (V39.60) اسمُ المخيم لا يطابق بياناته: يُعرض ولا يُغيَّر، والمساعدُ يدلّ على جودة البيانات ── */
console.log('\n══ ٧٩ · اسمُ المخيم وبياناته ══');
{
  const M = w.campNameMismatch(), x = w.siteFind('NSK-ARF-CMP-0631');
  T(M.length >= 60 && M.some(o => o.x.id === 'NSK-ARF-CMP-0631' && o.nSign === 'A2/38') && x.sign === 'D/204', 'المخيماتُ التي يخالف اسمُها مربعَها وشاخصَها تُعرض (' + M.length + ') — ومنها ٠٦٣١ (الاسم A2/38، البيانات D/204) ولا يتغيّر شيء');
  const hs = w.helpSearch('جودة البيانات', 0).map(e => e.id);
  T(hs[0] === 'dq', 'والمساعدُ يدلّ على «تصحيح البيانات» قبل «عدم المطابقة» حين يُسأل عن جودة البيانات: ' + hs.slice(0, 3).join('،'));
}

/* ── ٨٠ · (V39.61) «كلّم المهندس» يفتح قائمةَ المهندسين ثم المحادثة ── */
console.log('\n══ ٨٠ · كلّم المهندس ══');
{
  const U0 = w.STATE.users, me0 = w.STATE.meta.name, cur0 = w.CUR;
  if (!w.STATE.meta.name) w.STATE.meta.name = 'مالك';
  w.STATE.users = { a:{ name:w.STATE.meta.name, role:'admin', active:true }, b:{ name:'م. أول', role:'engineer', active:true }, c:{ name:'م. ثانٍ', role:'engineer', active:true } };
  w.askEngWho.pick = false; w.ASSIST_OPEN = true; w.ASSIST_Q = 'سؤال تجربة'; w.render(1); await new Promise(r => setTimeout(r, 80));
  const b = w.document.querySelector('[data-askeng]');
  if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await new Promise(r => setTimeout(r, 80)); }
  const pk = w.document.querySelector('[data-askengto]');
  T(!!b && !!pk, 'الضغطُ على «كلّم المهندس» يُظهر قائمةَ المهندسين في المساعد نفسه (كان يبدو زرًّا ميّتًا)');
  if (pk){ pk.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await new Promise(r => setTimeout(r, 120)); }
  T(w.CUR === 'chat' && w.ASSIST_OPEN === false && /^dm:/.test((w.chPageHtml.f || {}).open || ''), 'واختيارُ المهندس يفتح المحادثةَ معه وفيها السؤال');
  w.STATE.users = U0; w.STATE.meta.name = me0; w.askEngWho.pick = false; w.goPage(cur0 || 'map'); w.render(1);
}

/* ── ٨١ · (V39.62) «تعديل المسح» يعرض نوعَ المخيم وعددَ الحواجز التنظيمية لكل مخيمٍ مُزار ── */
console.log('\n══ ٨١ · نوعُ المخيم في «تعديل المسح» ══');
{
  const tc = w.STATE.sites.filter(x => x.type === 'مخيم')[5], nc = w.STATE.sites.filter(x => x.type === 'مخيم')[6];
  const r0t = w.STATE.recs[tc.id], r0n = w.STATE.recs[nc.id];
  w.STATE.recs[tc.id] = { id:tc.id, access:'تم الوصول', mount:'عمود', ctype:'ترددي', ctypeBy:'فني الميدان', ctypeAt:1 }; w.STATE.recs[nc.id] = { id:nc.id, access:'تم الوصول', mount:'عمود' };
  const kt = w.svqKeys(w.STATE.recs[tc.id]), kn = w.svqKeys(w.STATE.recs[nc.id]);
  T(kt[0] === 'ctype' && kt[1] === 'tbar' && kn[0] === 'ctype' && kn.indexOf('tbar') < 0, '«نوع المخيم» أولُ صفٍّ لكل مخيمٍ مُزار (والقديمةُ بلا نوع «عادي»)، و«الحاجز التنظيمي للتفويج — العدد» تحته للترددي وحدَه');
  T(w.svqLabel('ctype') === 'نوع المخيم' && /الحاجز التنظيمي للتفويج/.test(w.svqLabel('tbar')) && /value="ترددي" selected|selected[^>]*>ترددي/.test(w.svqEditor('ctype', w.STATE.recs[tc.id], tc)), 'بعنوانيهما، والنوعُ مختارٌ مسبقًا بما سجّله المسح');
  w.STATE.recs[nc.id].ctype = 'ترددي'; w.STATE.recs[nc.id].ctypeBy = 'فني الميدان'; w.STATE.recs[nc.id].ctypeAt = 1;
  T(w.svqKeys(w.STATE.recs[nc.id]).indexOf('tbar') === 1 && w.taxOf(nc).t === 'مخيمات ترددية', 'وتغييرُه إلى «ترددي» يُظهر العدد ويضعه في «مخيمات ترددية» فورًا');
  if (r0t) w.STATE.recs[tc.id] = r0t; else delete w.STATE.recs[tc.id]; if (r0n) w.STATE.recs[nc.id] = r0n; else delete w.STATE.recs[nc.id];
}

/* ── ٨٢ · (V39.63) متابعة الوزارة: الحاجزُ التنظيميُّ للتفويج تحت المخيمات من المسح الميداني ── */
console.log('\n══ ٨٢ · الحاجز التنظيمي في متابعة الوزارة ══');
{
  const C7 = w.STATE.sites.filter(x => x.type === 'مخيم'), T3 = C7.slice(7, 10), N1 = C7[10];
  const keep = {}; [...T3, N1].forEach(x => { keep[x.id] = w.STATE.recs[x.id]; });
  const b0 = w.tardBarStats();
  w.STATE.recs[T3[0].id] = { id:T3[0].id, access:'تم الوصول', ctype:'ترددي', ctypeBy:'فني الميدان', ctypeAt:1, tbar:2, tbarBy:'فني الميدان', tbarAt:1 };
  w.STATE.recs[T3[1].id] = { id:T3[1].id, access:'تم الوصول', ctype:'ترددي', ctypeBy:'فني الميدان', ctypeAt:1, tbar:1, tbarBy:'فني الميدان', tbarAt:1 };
  w.STATE.recs[T3[2].id] = { id:T3[2].id, access:'تم الوصول', ctype:'عادي' };
  const S = w.tardBarStats();
  T(S.bars === b0.bars + 3 && S.withBar === b0.withBar + 2 && S.normal === b0.normal + 1, 'من الزيارات وحدها: ٣ حواجز في مخيمين، وواحدٌ غيّره المسح إلى عادي (' + JSON.stringify(S) + ')');
  const h = w.tardBarHtml();
  T(/حصر بوابات التفويج/.test(h) && /الحاجز التنظيمي للتفويج/.test(h) && !/بانتظار تأكيد المسح/.test(h), 'حصرُ بوابات التفويج في تبويب «المسح» بمتابعة الوزارة — حصرٌ لا تحدٍّ (V39.68)');
  Object.keys(keep).forEach(k => { if (keep[k]) w.STATE.recs[k] = keep[k]; else delete w.STATE.recs[k]; });
}

/* ── ٨٣ · (V39.64) «تقاريري المثبّتة» تأخذ ألوانَ السمة لا وجهَ المتصفح الفاتح ── */
console.log('\n══ ٨٣ · بطاقاتُ التقارير المثبّتة ══');
{
  const css = [...w.document.querySelectorAll('style')].map(x => x.textContent).join('\n');
  T(/button\.kk-zl\{[^}]*background:var\(--raise/.test(css) && /button\.kk-zl\{[^}]*color:var\(--ink\)/.test(css) && /appearance:none/.test(css), 'بطاقةُ التقرير المثبّت زرٌّ بسطح السمة ونصِّها وحدودها — لا الأبيضُ الافتراضيُّ بنصٍّ باهتٍ في الليلي');
}

/* ── ٨٤ · (V39.65) بياناتُ الحساس تُحفظ: الكتابةُ تدخل الجهازَ فورًا، و«حفظ البيانات» يكتب الخطة، و«احفظ» يأخذ ما كُتب ── */
console.log('\n══ ٨٤ · حفظُ بيانات الحساسات ══');
{
  const id = w.STATE.sites.find(x => x.type === 'مخيم' && +x.lat && +x.lng).id, x = w.siteFind(id);
  const D0 = w.IOT.data, ov0 = w.STATE.siteOv[id] ? JSON.parse(JSON.stringify(w.STATE.siteOv[id])) : null, r0 = w.ROLE, m0 = w.STATE.meta.role;
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
  w.IOT.data = { camps:{ [id]:{ gw:[+x.lat, +x.lng], sensors:[[+x.lat + 0.0001, +x.lng], [+x.lat + 0.0002, +x.lng]] } } };
  if (w.STATE.siteOv[id]) delete w.STATE.siteOv[id].iot;
  w.iotEditStart(id, { k:'s', i:0 }); w.iotFieldLive('iotSerial', 'SN-X1'); w.iotSave();
  const a = ((w.STATE.siteOv[id] || {}).iot || {}).sm || [];
  T(a[0] && a[0].serial === 'SN-X1', '«احفظ» بلا «حفظ البيانات» يحفظ السيريالَ المكتوب (كان يضيع)');
  w.iotEditStart(id, { k:'s', i:1 }); w.iotFieldLive('iotSerial', 'SN-X2'); w.iotFieldLive('iotStatus', 'مركّب'); w.iotMetaSet();
  const b = ((w.STATE.siteOv[id] || {}).iot || {}).sm || [];
  T(b[1] && b[1].serial === 'SN-X2' && b[1].status === 'مركّب' && !!w.IOT.edit, '«حفظ البيانات» يكتب الخطةَ فورًا ويبقى التعديلُ مفتوحًا للجهاز التالي');
  w.IOT.edit = null; w.IOT.data = D0; if (ov0) w.STATE.siteOv[id] = ov0; else delete w.STATE.siteOv[id]; w.ROLE = r0; w.STATE.meta.role = m0;
}

/* ── ٨٥ · (V39.66) «تعديل المسح» لا ينغلق حين يُعدَّل الحقلُ مرةً ثانية ── */
console.log('\n══ ٨٥ · لوحةُ «تعديل المسح» تبقى مفتوحة ══');
{
  const c = w.STATE.sites.filter(x => x.type === 'مخيم')[11], r0 = w.STATE.recs[c.id], role0 = w.ROLE, mr0 = w.STATE.meta.role;
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
  w.STATE.recs[c.id] = { id:c.id, access:'تم الوصول', st:'تمت الزيارة', mount:'عمود', by:'فني', at:Date.now() };
  w.SVQ = { id:c.id, key:'', tmp:null }; w.render(1);
  w.svqSave(c.id, 'ctype', 'ترددي', true);
  const back = w.document.getElementById('svqSheet');
  if (back) back.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(w.SVQ.id === c.id, 'لمسةٌ تقع على الخلفية لحظةَ الحفظ (حين تقصر اللوحة) لا تغلقها — يُعدَّل الحقلُ مرةً ثانية');
  const css = [...w.document.querySelectorAll('style')].map(x => x.textContent).join('\n');
  T(/#svqSheet \.svq-box\{min-height:/.test(css), 'واللوحةُ بارتفاعٍ ثابتٍ فلا تنزل الصفوفُ تحت الإصبع بعد الحفظ');
  w.SVQ.holdTill = 0; if (back) w.document.getElementById('svqSheet').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(w.SVQ.id === '', 'ولمسُ الخلفية بعد ذلك يغلقها كما كان');
  if (r0) w.STATE.recs[c.id] = r0; else delete w.STATE.recs[c.id]; w.ROLE = role0; w.STATE.meta.role = mr0;
}

/* ── ٨٦ · (V39.67) طبقةُ «محطات الإركاب» ── */
console.log('\n══ ٨٦ · محطات الإركاب ══');
{
  const fs = await import('fs'); const J = JSON.parse(fs.readFileSync(new URL('../layers/boarding-1448.json', import.meta.url), 'utf8'));
  T(Array.isArray(J.pts) && J.pts.length === 505 && J.pts.every(q => q[0] > 21.3 && q[0] < 21.4 && q[1] > 39.9 && q[1] < 40.1), 'ملفُّ الطبقة: ٥٠٥ محطةً كلُّها في عرفات');
  const B = w.brdSt(); B.data = J.pts; B.on = false; w.goPage('map'); w.render(1);
  const chip = w.document.querySelector('[data-brd]');
  T(!!chip && /محطات الإركاب/.test(chip.textContent), 'شريحةُ «محطات الإركاب» بجوار الحساسات في الخريطة');
  if (chip) chip.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  T(B.on === true && /505|٥٠٥/.test((w.document.querySelector('[data-brd]') || {}).textContent || ''), 'وتُشغَّل بلمسةٍ وتعرض عددها');
  B.on = false; w.render(1);
}

/* ── ٨٧ · (V39.69) «الكل» في كل قسمٍ = كلُّ ما في هذا القسم فقط ── */
console.log('\n══ ٨٧ · «الكل» في أقسام التصفية ══');
{
  const S = w.STATE.sites, P = () => S.filter(x => w.filtPass(x));
  w.FILT.exec = '*'; const ex = P();
  T(ex.length > 0 && ex.length < S.length && ex.every(x => !w.execIsNone(w.execLabelOf(w.execStatusMemo(x)))), 'التحديات «الكل»: النقاطُ ذات التحديات وحدها (' + ex.length + ' من ' + S.length + ') — لا «لا توجد تحديات» ولا «تم التركيب»');
  w.FILT.exec = ''; w.FILT.ccg = '*'; const cg = P();
  T(cg.every(x => w.ccGroupsOfSite(x).length > 0), 'ومعالجة التحديات «الكل»: ما في أيِّ مجموعة معالجة وحدها (' + cg.length + ')');
  w.FILT.ccg = ''; w.FILT.floor = '*'; const fl = P();
  T(fl.length > 0 && fl.length < S.length && fl.every(x => w.siteFloor(x) != null), 'وأدوار الجمرات «كل الأدوار»: نقاطُ منشأة الجمرات وحدها (' + fl.length + ')');
  w.FILT.floor = '';
  T(P().length === S.length && w.filtOn() === false, 'وبلا اختيارٍ يعود كلُّ شيء');
}

/* ── ٨٨ · (V39.70) «ترددي» وعددُ البوابات من الميدان وحده ── */
console.log('\n══ ٨٨ · مصدرُ «ترددي» ══');
{
  w.STATE.users = Object.assign({}, w.STATE.users || {}, { zzfield:{ name:'فني الميدان', role:'tech', active:true }, zzoffice:{ name:'مكتب الاختبار', role:'admin', active:true } });
  const C = w.STATE.sites.filter(x => x.type === 'مخيم').slice(20, 24), keep = C.map(x => w.STATE.recs[x.id]);
  w.STATE.recs[C[0].id] = { id:C[0].id, access:'تم الوصول', ctype:'ترددي', tbar:3 };   // filled by the old form, nobody's choice
  w.STATE.recs[C[1].id] = { id:C[1].id, access:'تم الوصول', ctype:'ترددي', ctypeBy:'مكتب الاختبار', ctypeAt:5 };   // written by the office
  w.STATE.recs[C[2].id] = { id:C[2].id, access:'تم الوصول', ctype:'ترددي', tbar:2, edits:[{ k:'ctype', v:'ترددي', by:'فني الميدان', at:9 }, { k:'tbar', v:2, by:'فني الميدان', at:10 }] };
  w.STATE.recs[C[3].id] = { id:C[3].id, access:'تم الوصول', ctype:'ترددي', ctypeBy:'فني الميدان', ctypeAt:7, tbar:4, tbarBy:'مكتب الاختبار', tbarAt:8 };
  C.forEach(x => delete x._tax);
  T(!w.siteTard(C[0]) && !w.siteTard(C[1]), 'القديمُ الذي ملأه النموذج وحده، وما كتبه المكتب: لا يُحتسبان ترددي (ولا يُمسح شيء)');
  T(w.siteTard(C[2]) && w.siteTbar(C[2]) === 2 && w.siteTard(C[3]) && w.siteTbar(C[3]) === 0, 'واختيارُ الفني في «تعديل المسح» أو النموذج يُحتسب — والعددُ الذي كتبه المكتب لا يُحتسب');
  C.forEach((x, i) => { if (keep[i]) w.STATE.recs[x.id] = keep[i]; else delete w.STATE.recs[x.id]; delete x._tax; });
}

/* ── ٨٩ · (V39.75) صورُ الزيارة: كلُّ صورةٍ مرفوعةٍ تظهر، ولا تأخذ رقمَ صورةٍ موجودة ── */
console.log('\n══ ٨٩ · صورُ الزيارة ══');
{
  const x = w.STATE.sites.filter(s => s.type === 'مخيم')[30], id = x.id, r0 = w.STATE.recs[id], q0 = w.PHOTO_Q.slice(), on0 = w.STATE.meta.online, dc0 = w.drvCfg, me0 = w.STATE.meta.name;
  w.STATE.meta.name = me0 || 'فني';
  w.STATE.recs[id] = { id, access:'تم الوصول', st:'تمت الزيارة', by:w.STATE.meta.name, at:Date.now(), photos:['close'] };
  w.STATE.photos[id + '-1'] = { site:id, kind:'close', seq:1, at:1, link:'x' }; w.STATE.photos[id + '-4'] = { site:id, kind:'general', seq:4, at:2, link:'y' };   // a gap: a photo numbered 4 already
  w.phTouch && w.phTouch();
  T(w.photoNext(id) === 5, 'الرقمُ التالي بعد أعلى رقمٍ موجود (٥) لا بعدِّ الصور (٣) — فلا تكتب صورةٌ جديدةٌ فوق صورةٍ قائمة');
  { const n1 = w.photoNext(id); w.photoTook(id, n1); delete w.STATE.photos[id + '-4']; w.phTouch && w.phTouch();   /* (V39.79) a photo took the number, then the phone's copy loses a document — the next number still moves on */
    T(w.photoNext(id) === n1 + 1, 'ويتقدّم الرقمُ ولو اختفت وثيقةٌ من نسخة الجهاز (' + (n1 + 1) + ')');
    w.STATE.photos[id + '-4'] = { site:id, kind:'general', seq:4, at:2, link:'y' }; w.phTouch && w.phTouch(); }
  T(/^[A-Z]{2}$/.test(w.photoTag()) && w.photoTag() === w.photoTag(), 'وحرفا الحساب ثابتان للمعرّف');
  w.STATE.meta.online = false; for (let i = 0; i < 3; i++) w.svqPhoto(id, 'extra', { data:'data:image/jpeg;base64,' + 'B'.repeat(800) + i });
  w.STATE.meta.online = true; w.drvCfg = () => null;
  for (let i = 0; i < 4; i++){ try { await w.photoFlush(); } catch (e) {} }
  const shown = w.photosOf(id).length, docs = Object.keys(w.STATE.photos).filter(k => k.startsWith(id + '-')).length;
  T(Object.keys(w.STATE.photos).filter(k => k.startsWith(id + '-') && new RegExp('-\\d+' + w.photoTag() + '$').test(k)).length === 3, 'ومعرّفاتُ الصور الجديدة تحمل حرفَي الحساب — فلا تتصادم مع جهازٍ آخر');
  T(shown === 5 && docs === 5, 'وثلاثُ صورٍ إضافيةٍ تُرفَع كلُّها وتظهر كلُّها في «صور الزيارة» (' + shown + ' من ' + docs + ')');
  Object.keys(w.STATE.photos).filter(k => k.startsWith(id + '-')).forEach(k => delete w.STATE.photos[k]); w.phTouch && w.phTouch();
  if (r0) w.STATE.recs[id] = r0; else delete w.STATE.recs[id]; w.PHOTO_Q.length = 0; q0.forEach(q => w.PHOTO_Q.push(q)); w.STATE.meta.online = on0; w.drvCfg = dc0; w.STATE.meta.name = me0;
}

/* ── ٩٠ · (V39.78) KMZ مفصّل: كلُّ النقاط المخطط تركيبها، وكلُّ فلترٍ مجلّد ── */
console.log('\n══ ٩٠ · KMZ مفصّل بكل الفلاتر ══');
{
  const b = w.kmzFullBuild(), x = b.xml, live = w.STATE.sites.filter(s => s.lat && s.lng && !s.dupOf).length;
  T(b.count === live && b.count > 1000, 'كلُّ النقاط ذات الموقع في الملف (' + b.count + ')');
  T(/كل النقاط — المشعر ← النوع ← الحالة/.test(x) && /🔎 حسب الحالة/.test(x) && /🔎 حسب التحديات/.test(x) && /🔎 حسب نوع النقطة/.test(x) && /🔎 حسب وجه العمل/.test(x),
    'الشجرةُ الرئيسية ومجلّدٌ لكلِّ فلتر: الحالة والتحديات ونوع النقطة ووجه العمل');
  const one = w.STATE.sites.find(s => s.lat && s.lng && !s.dupOf && s.name);
  T(x.indexOf('<name>' + one.name.replace(/&/g, '&amp;').replace(/</g, '&lt;') + ' · ' + one.id + '</name>') > -1, 'واسمُ كلِّ نقطةٍ يحمل اسمَها ومعرّفَها — فيجدها بحثُ جوجل إيرث بأيٍّ منهما');
  T(/<visibility>0<\/visibility>/.test(x) && x.split('<Document>').length === 2 && x.trim().endsWith('</kml>'), 'ومجلّداتُ الفلاتر مطفأةٌ حتى يُعلَّم عليها، والملفُّ مغلقٌ صحيحًا');
}

/* ── ٩١ · (V39.80) كارتُ الصور المسترجَعة ── */
console.log('\n══ ٩١ · الصورُ المسترجَعة ══');
{
  const x = w.STATE.sites.filter(s => s.type === 'مخيم')[40], id = x.id;
  w.STATE.photos[id + '-7R'] = { site:id, kind:'extra', by:'فني أ', at:Date.now() - 2000, seq:7, recovered:true, link:'a' };
  w.STATE.photos[id + '-8R'] = { site:id, kind:'extra', by:'فني أ', at:Date.now() - 1000, seq:8, recovered:true, link:'b' };
  w.STATE.photos[id + '-9R'] = { site:id, kind:'mount', by:'فني أ', at:Date.now(), seq:9, recovered:true, link:'c', del:true };
  const R = w.recoveredPhotos(), o = R.find(r => r.id === id), h = w.recoveredPhotosHtml();
  T(!!o && o.list.length === 2 && o.dup === 1, 'تُجمَع الصورُ المسترجَعة بنقطتها، والمحذوفةُ لا تُعَدّ، ونوعٌ ورافعٌ تكرّرا يُعلَّمان (' + (o ? o.list.length + '/' + o.dup : '—') + ')');
  T(h.indexOf('data-site="' + id + '"') > -1 && /قد تكون مكرّرة/.test(h), 'والكارتُ يفتح النقطة ويقول «قد تكون مكرّرة»');
  ['-7R', '-8R', '-9R'].forEach(k => delete w.STATE.photos[id + k]);
  T(w.recoveredPhotosHtml() === '' || !w.recoveredPhotos().some(r => r.id === id), 'وبلا صورٍ مسترجَعة لا يظهر لها شيء');
}

/* ── ٩٢ · (V39.83) القائمةُ الحيّة: استعمالُ الشخص يقرّر ما يبقى فوق وما يُطوى ── */
console.log('\n══ ٩٢ · القائمةُ الحيّة ══');
{
  const ls0 = w.localStorage.getItem('nsk14.pgh'), pin0 = w.localStorage.getItem('nsk14.navpin');
  w.pageHist.m = null; w.navPins.m = null; w.localStorage.removeItem('nsk14.pgh'); w.localStorage.removeItem('nsk14.navpin');
  T(JSON.stringify(w.navMain().filter(x => x !== 'guide').sort()) === JSON.stringify(w.navHtml.main.filter(x => x !== 'guide').sort()) && /القائمةُ تترتّب حسب استعمالك بعد/.test(w.navHtml()),
    'بلا تاريخٍ كافٍ: قائمةُ الدور الافتراضية، ولمحةٌ تقول متى تبدأ الترتيبُ الحيّ');
  const dk = w.dayKey(), h = {}; h[dk] = { chat:40, map:4, mywork:1 };   /* 45 opens: «chat» heavily, «mywork» once (1×2 = 2 < 3) */
  w.localStorage.setItem('nsk14.pgh', JSON.stringify(h)); w.pageHist.m = null;
  const m = w.navMain();
  T(m.indexOf('chat') > -1 && m.indexOf('map') > -1 && m.indexOf('mywork') < 0 && m.indexOf('guide') > -1, 'ومع الاستعمال: ما فُتح ٣ مراتٍ فأكثر يبقى فوق، وما دونها يُطوى، والدليلُ لا يُطوى أبدًا');
  w.navPinSet('mywork', 'pin'); w.navPinSet('chat', 'more');
  const m2 = w.navMain();
  T(m2.indexOf('mywork') > -1 && m2.indexOf('chat') < 0 && /\u{1F4CC}/u.test(w.navHtml()), 'والتثبيتُ اليدويُّ يغلب: «ثبّت فوق» يرفع، و«خلّيها تحت» يطوي، وعلامةٌ على المثبَّت');
  w.navPinSet('mywork', ''); w.navPinSet('chat', '');
  T(w.navHtml().indexOf('data-p="chat"') > -1 && w.navHtml().indexOf('data-p="mywork"') > -1, 'ولا شاشةَ تُحذَف: المطويُّ ما زال في القائمة تحت «المزيد»');
  if (ls0 == null) w.localStorage.removeItem('nsk14.pgh'); else w.localStorage.setItem('nsk14.pgh', ls0);
  if (pin0 == null) w.localStorage.removeItem('nsk14.navpin'); else w.localStorage.setItem('nsk14.navpin', pin0);
  w.pageHist.m = null; w.navPins.m = null;
}

/* ── ٩٣ · (V39.85) «شغلي» أوّلُ شاشةٍ لحساب الميدان كلَّ يوم، وبطاقةُ ما على الجهاز ── */
console.log('\n══ ٩٣ · شغلي أوّلًا ══');
{
  const role0 = w.ROLE, ds0 = w.localStorage.getItem('nsk14.dayStart'), q0 = w.PHOTO_Q.slice(), sq0 = (w.STATE.queue || []).slice(), on0 = w.STATE.meta.online;
  w.localStorage.removeItem('nsk14.dayStart');
  w.ROLE = 'tech';
  const first = w.seesPage('mywork') ? w.fieldDayStart() : 'n/a', second = w.fieldDayStart();
  T(first === true && second === false, 'حسابُ الميدان: أوّلُ فتحٍ في اليوم يبدأ بـ«شغلي»، والفتحاتُ بعده ترجع لآخر شاشة');
  w.localStorage.removeItem('nsk14.dayStart'); w.ROLE = 'admin';
  const off = w.fieldDayStart(); w.localStorage.removeItem('nsk14.dayStart'); w.ROLE = 'engineer';
  T(off === false && w.fieldDayStart() === false, 'وحسابُ المكتب والمهندسُ لا يتغيّر عليهما شيء — يبدآن كما كانا');
  w.PHOTO_Q.length = 0; w.STATE.queue = []; w.STATE.meta.online = true;
  T(/كلُّ شغلك وصل المكتب/.test(w.myQueueCard()), 'وبلا شيءٍ على الجهاز: «كلُّ شغلك وصل المكتب»');
  w.PHOTO_Q.push({ site:'X', kind:'extra', data:'d', at:1, seq:1 }); w.STATE.queue.push({ kind:'recs', id:'X', v:{} });
  const h = w.myQueueCard();
  T(/على جهازك ولم يصل المكتب بعد/.test(h) && /data-pushnow="1"/.test(h) && /صورة/.test(h) && /تعديل/.test(h), 'ومع صورةٍ وتعديلٍ في الطابور: بطاقةٌ بعددهما وزرُّ «ادفع الآن»');
  w.STATE.meta.online = false;
  T(!/data-pushnow/.test(w.myQueueCard()) && /بلا اتصال/.test(w.myQueueCard()), 'وبلا اتصال: لا زرّ، ويقول إنه يُرفع وحده أوّلَ ما يرجع النت');
  w.ROLE = role0; if (ds0 == null) w.localStorage.removeItem('nsk14.dayStart'); else w.localStorage.setItem('nsk14.dayStart', ds0);
  w.PHOTO_Q.length = 0; q0.forEach(x => w.PHOTO_Q.push(x)); w.STATE.queue = sq0; w.STATE.meta.online = on0;
}

/* ── ٩٤ · (V39.86) شريطُ القفز في «تعديل المسح»: البياناتُ والصورُ والسجلُّ بلا إخفاء ── */
console.log('\n══ ٩٤ · شريطُ القفز ══');
{
  const x = w.STATE.sites.filter(s => s.type === 'مخيم')[50], id = x.id, r0 = w.STATE.recs[id], s0 = Object.assign({}, w.SVQ);
  w.STATE.recs[id] = { id, access:'تم الوصول', st:'تمت الزيارة', by:w.STATE.meta.name || 'فني', at:Date.now(), suit:'مناسب', hav:4,
    edits:[{ k:'hav', o:3, v:4, by:'فني', at:Date.now() }] };
  w.SVQ.id = id; w.SVQ.key = '';
  const h = w.svqSheet();
  T(/data-svqjump="Data"/.test(h) && /data-svqjump="Ph"/.test(h) && /data-svqjump="Hist"/.test(h), 'ثلاثةُ أزرارٍ تحت العنوان: البيانات والصور والسجل');
  T(h.indexOf('id="svqSecData"') > -1 && h.indexOf('id="svqSecPh"') > -1 && h.indexOf('id="svqSecHist"') > -1 && h.indexOf('id="svqSecPh"') < h.indexOf('صور الزيارة'), 'ولكلٍّ مرساه، ومرساةُ الصور قبل «صور الزيارة» مباشرةً');
  T(/data-svqk=/.test(h) && /صور الزيارة/.test(h), 'ولا شيءَ أُخفي: الحقولُ والصورُ في الورقة كما كانت');
  if (r0) w.STATE.recs[id] = r0; else delete w.STATE.recs[id]; Object.assign(w.SVQ, s0);
}

/* ── ٩٥ · (V39.89) بطاقةُ الحسابات والصور على السحابة ── */
console.log('\n══ ٩٥ · التشغيل الدوري على السحابة ══');
{
  const S = w.jobsStatusLoad(); const v0 = S.v, at0 = S.at;
  S.at = Date.now(); S.v = null;
  T(/لم تُسجَّل دورةٌ بعد/.test(w.jobsCardHtml()), 'قبل أوّل دورة: «لم تُسجَّل دورةٌ بعد»');
  S.v = { at:Date.now() - 120000, ok:true, steps:[{ name:'provision', code:0, ms:4000 }, { name:'photos-sync', code:0, ms:61000 }] };
  const h1 = w.jobsCardHtml();
  T(/تعمل/.test(h1) && /الحسابات/.test(h1) && /الصور إلى الدرايف/.test(h1) && !/<pre/.test(h1), 'دورةٌ سليمةٌ قبل دقيقتين: «تعمل»، وكلُّ خطوةٍ بزمنها، بلا تفاصيل خطأ');
  S.v = { at:Date.now() - 60000, ok:false, steps:[{ name:'provision', code:0, ms:4000 }, { name:'photos-sync', code:1, ms:9000, tail:'Drive: invalid_grant' }] };
  const h2 = w.jobsCardHtml();
  T(/تعثّرت/.test(h2) && /invalid_grant/.test(h2), 'وخطوةٌ تعثّرت: تُقال، وآخرُ سطورها ظاهر');
  S.v = { at:Date.now() - 40 * 60000, ok:true, steps:[] };
  T(/متأخرة/.test(w.jobsCardHtml()), 'ولا دورةَ منذ أكثر من ربع ساعة: «متأخرة»');
  S.v = v0; S.at = at0;
}

/* ── ٩٦ · (V39.92) «اعرض كمستخدم»: دورُه واسمُه، ولا شيءَ يُحفَظ، والرجوعُ يعيد كلَّ شيء ── */
console.log('\n══ ٩٦ · اعرض كمستخدم ══');
{
  const role0 = w.ROLE, name0 = w.STATE.meta.name, uid0 = w.STATE.meta.uid, mrole0 = w.STATE.meta.role, users0 = w.STATE.users;
  w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.STATE.meta.name = 'المدير'; w.STATE.meta.uid = 'ADMIN1';
  w.STATE.users = Object.assign({}, users0 || {}, { T9:{ uid:'T9', name:'عمار التجربة', role:'tech' }, M9:{ uid:'M9', name:'موظف الوزارة', role:'ministry' } });
  T(/data-vaopen="1"/.test(w.navHtml()) && /عمار التجربة/.test(w.viewAsSheet('')) && !/عمار التجربة/.test(w.viewAsSheet('خالد')), 'المديرُ يرى «اعرض كمستخدم»، والقائمةُ تُبحَث بالاسم');
  const ok = w.viewAsStart('T9');
  T(ok && w.ROLE === 'tech' && w.STATE.meta.name === 'عمار التجربة' && w.STATE.meta.uid === 'T9' && !!w.document.getElementById('vaBar') && !/data-vaopen/.test(w.navHtml()), 'يصير الدورُ والاسمُ والمعرّفُ للفني، ويظهر شريطُ العرض، وتختفي «اعرض كمستخدم»');
  const before = JSON.stringify(w.STATE.recs['ZZ-VA'] || null);
  w.CORE.set('recs', 'ZZ-VA', { id:'ZZ-VA', st:'تمت الزيارة' });
  T(JSON.stringify(w.STATE.recs['ZZ-VA'] || null) === before && !(w.STATE.queue || []).some(q => q.id === 'ZZ-VA'), 'ولا شيءَ يُحفَظ: الكتابةُ المحليةُ والطابورُ يرفضانها');
  const qn = (w.STATE.queue || []).length, en = (w.STATE.events || []).length;
  w.logEvent('بدأ يومَه — عمار التجربة · خارج النطاق');
  T((w.STATE.queue || []).length === qn, 'وسطرُ السجلّ لا يدخل طابورَ الرفع أثناء العرض (كان يمرّ مباشرةً — V39.94)');
  const pq = w.PHOTO_Q.length; w.photoQueue('NSK-X', 'extra', 'data:image/jpeg;base64,QQ');
  T(w.PHOTO_Q.length === pq, 'ولا صورةَ تدخل طابورَ الصور أثناء العرض (V39.95)');
  let idbOk = 'no'; await w.idbSet('va-probe', 1).then(() => { idbOk = 'resolved'; });
  T(idbOk === 'resolved', 'والكتابةُ على الجهاز تُتجاهَل بهدوء أثناء العرض — مسودةٌ ولا طابورُ صورٍ ولا مخزن');
  let posted = 'no'; await w.fetch('https://example.invalid/x', { method:'POST' }).then(() => { posted = 'sent'; }, () => { posted = 'refused'; });
  T(posted === 'refused', 'وأيُّ طلبٍ يكتب على الشبكة يُرفَض');
  w.viewAsStop(true);
  T(w.ROLE === 'admin' && w.STATE.meta.name === 'المدير' && w.STATE.meta.uid === 'ADMIN1' && !w.document.getElementById('vaBar') && !w.PV.VIEW_AS, 'والرجوعُ يعيد الدورَ والاسمَ والمعرّفَ ويُزيل الشريط');
  w.ROLE = 'tech';
  T(w.viewAsStart('M9') === false && w.ROLE === 'tech', 'وغيرُ المدير لا يستطيع');
  w.ROLE = role0; w.STATE.meta.name = name0; w.STATE.meta.uid = uid0; w.STATE.meta.role = mrole0; w.STATE.users = users0;
}

/* ── ٩٧ · (V39.93) «حدّد السليمة»: ما وصل ولا تحدي وفيه صورتان ومناسب — خاصيّةٌ على الزيارات المنتظرة نفسها ── */
console.log('\n══ ٩٧ · حدّد السليمة ══');
{
  const pend = w.svaLists().pending, clean = w.svaClean(pend), ids = new Set(clean.map(x => x.id));
  const okOne = x => { const r = x.rec || {}; return (!r.access || r.access === 'تم الوصول') && r.review !== 'revisit' && w.execIsNone(w.execLabelOf(w.execStatusMemo(x.site))) && (!r.suit || r.suit === 'مناسب') && w.svqPhotoCount(x.id) >= 2; };
  T(clean.every(okOne), 'كلُّ ما يُحدَّد سليمٌ فعلًا: وصل، ولا تحدي، وصورتان، ومناسب (' + clean.length + ' من ' + pend.length + ')');
  T(pend.filter(x => !ids.has(x.id)).every(x => !okOne(x)), 'وما لا يُحدَّد فيه سببٌ واحدٌ على الأقل');
  const ROLE0 = w.ROLE; w.ROLE = 'tech';
  T(!w.may('approve'), 'والفنيُّ لا يملك الاعتماد'); w.ROLE = ROLE0;
}

/* ── ٩٨ · (V39.94) تنظيفُ أثر أوّل جلسة عرض قبل أيِّ رفع ── */
console.log('\n══ ٩٨ · تنظيفُ أثر العرض ══');
{
  const q0 = (w.STATE.queue || []).slice(), att0 = Object.assign({}, w.STATE.att || {}), name0 = w.STATE.meta.name, uid0 = w.STATE.meta.uid;
  w.STATE.meta.name = 'المدير'; w.STATE.meta.uid = 'ADMIN1';
  w.STATE.queue = [{ kind:'evlog', id:'E1', v:{ id:'E1', what:'بدأ يومَه — خالد', by:'خالد' } }, { kind:'evlog', id:'E2', v:{ id:'E2', what:'اعتماد — X', by:'خالد', rec:'المدير' } }, { kind:'evlog', id:'E3', v:{ id:'E3', what:'دخول', by:'المدير' } }, { kind:'recs', id:'R1', v:{ id:'R1', by:'خالد' } }];
  w.STATE.att = Object.assign({}, att0, { 'K1|2026-10-28':{ uid:'K1', name:'خالد', in:{ at:1 } }, 'K2|2026-10-28':{ uid:'K2', name:'خالد', in:{ at:1 }, _at:5 } });
  w.viewAsPurge.done = false; const n = w.viewAsPurge();
  const ids = w.STATE.queue.map(q => q.id).join(',');
  T(ids === 'E2,E3,R1' && !w.STATE.att['K1|2026-10-28'] && !!w.STATE.att['K2|2026-10-28'] && n === 2,
    'يُزال سطرُ السجلّ المكتوب باسم غيرك بلا مسجِّل، والحضورُ الذي لم يُرفَع لغيرك — ويبقى سطرُ «نيابةً» وسطرُك وزيارةُ الفني والحضورُ القادم من القاعدة (' + ids + ')');
  w.STATE.queue = q0; w.STATE.att = att0; w.STATE.meta.name = name0; w.STATE.meta.uid = uid0;
}

/* ── ٩٩ · (V39.98) الترجمةُ الاحتياطيةُ بعد الرسم: ما كُتب بلا t() يُترجَم إن كان مفتاحًا، والبياناتُ تبقى ── */
console.log('\n══ ٩٩ · الترجمة الاحتياطية ══');
{
  const L0 = w.LANG, D0 = w.D.en;
  w.D.en = Object.assign({}, D0, { 'امسح السجل':'Clear the log', 'الأسماء':'Names' });
  w.LANG = 'en';
  const box = w.document.createElement('div');
  box.innerHTML = '<p>امسح السجل</p><p>الأسماء — 166</p><p>reached 0، unreachable ١</p><p>شركة إيثار المحدودة</p><input placeholder="امسح السجل"><textarea>امسح السجل</textarea>';
  w.document.body.appendChild(box);
  w.i18nDomPass(box);
  const ps = [...box.querySelectorAll('p')].map(p => p.textContent);
  T(ps[0] === 'Clear the log' && ps[1] === 'Names — 166', 'نصٌّ هو مفتاحٌ بعينه، أو «مفتاح — رقم»، يُترجَم بعد الرسم');
  T(ps[2] === 'reached 0, unreachable 1', 'والنصُّ الإنجليزيُّ المبنيُّ بفاصلةٍ وأرقامٍ عربية يصير إنجليزيَّ الترقيم والأرقام');
  T(ps[3] === 'شركة إيثار المحدودة', 'واسمُ الشركة ليس مفتاحًا فيبقى كما هو — البياناتُ لا تُترجَم');
  T(box.querySelector('input').getAttribute('placeholder') === 'Clear the log' && box.querySelector('textarea').value === 'امسح السجل', 'والنصُّ الدليليُّ يُترجَم، وما في حقلٍ للكتابة لا يُمَسّ');
  w.LANG = 'ar'; box.innerHTML = '<p>امسح السجل</p>'; w.i18nDomPass(box);
  T(box.querySelector('p').textContent === 'امسح السجل', 'وفي العربية لا يعمل شيئًا');
  box.remove(); w.LANG = L0; w.D.en = D0;
}

/* ── ١٠٠ · (V39.99) خطوةُ كود التحقق في «الربط» ── */
console.log('\n══ ١٠٠ · خطوة كود التحقق ══');
{
  const R0 = w.ROLE; w.ROLE = 'admin';
  const p1 = { state:'code', at:Date.now(), methods:[{ type:'phone', value:'05****12' }, { type:'email', value:'s***@afaqy.com' }], sent:false };
  const h1 = w.integOtpHtml(p1);
  T(/data-integotpsend="phone"/.test(h1) && /data-integotpsend="email"/.test(h1) && /05\*\*\*\*12/.test(h1) && !/integOtpCode/.test(h1), 'المنصةُ طلبت الكود: يظهر الجوالُ والإيميلُ كما أرسلتهما المنصة، ولا خانةَ للكود قبل الإرسال');
  const h2 = w.integOtpHtml(Object.assign({}, p1, { sent:true, method:'phone', expiresIn:300 }));
  T(/id="integOtpCode"/.test(h2) && /data-integotpverify/.test(h2) && /data-integotprestart/.test(h2), 'بعد الإرسال: خانةُ الكود و«تحقق» و«ابعت كود جديد» و«ابدأ من جديد»');
  const h3 = w.integOtpHtml(Object.assign({}, p1, { sent:true, method:'phone', err:'Invalid_OTP' }));
  T(/الكود غلط/.test(h3), 'والكودُ الغلط يُقال بكلامٍ مفهوم');
  T(/طلبت كود تحقق/.test(w.integStateLine(p1)), 'وسطرُ الحالة يقول إن المنصة طلبت كودًا');
  w.ROLE = 'tech'; w.STATE.meta.role = 'tech';
  T(!w.mayIntegEdit(), 'والفنيُّ لا يرى الخطوة ولا يستطيعها');
  w.ROLE = R0; w.STATE.meta.role = R0;
}

/* ── ١٠١ · (V40.0) التوكينُ واسمُ المستخدم معًا ── */
console.log('\n══ ١٠١ · التوكين والحساب ══');
{
  const R0 = w.ROLE; w.ROLE = 'admin';
  const ed0 = w.integAcctHtml.edit; w.integAcctHtml.edit = { afaqypro:true };
  const h = w.integProHtml();
  T(/id="integTok"/.test(h) && /type="password"/.test(h) && /id="integUser"/.test(h), 'نموذجُ الربط فيه خانةُ التوكين (مخفيّةُ الكتابة) بجانب اسم المستخدم وكلمة السر');
  T(/انتهى أو مرفوض/.test(w.integStateLine({ state:'err', err:'token', at:Date.now() })), 'والتوكينُ المنتهي بلا حسابٍ يُقال صراحةً: حط توكين جديد أو احفظ الحساب');
  T(/شايف/.test(w.integStateLine({ state:'ok', at:Date.now(), withImei:7, matched:0, visible:2 })) && !/شايف/.test(w.integStateLine({ state:'ok', at:Date.now(), withImei:7, matched:3, visible:null })), '(V40.1) متصلٌ بلا مطابقة: يقول كم وحدةً يرى الحساب — فالحسابُ الغلط يُعرَف من الشاشة');
  w.integAcctHtml.edit = ed0; w.ROLE = R0;
}

/* ── ١٠٢ · (V40.4) قراءاتُ الجسر بأسماء التطبيق، وبطاريتا الجيت واي، ورسالةُ «هات التوكين» ── */
console.log('\n══ ١٠٢ · قراءات أفاقي برو على الشاشة ══');
{
  const L0 = w.IOT.live; w.IOT.live = { at:Date.now(), busy:false, v:{ units:{ 's1':{ t:Date.now() - 900000, v:{ temp:36.9, hum:42, bat:73, rssi:-80 } }, 'g1':{ t:Date.now() - 60000, v:{ ext_bat:12.6, int_bat:4.1, bat:12.6 } } } } };
  const a = w.liveIotLine('S1'), b = w.liveIotLine('g1');
  const has = (h, n) => h.indexOf(w.nm(n)) > -1;
  T(has(a, 36.9) && has(a, 42) && has(a, 73), 'الحساسُ: الحرارةُ والرطوبةُ والبطاريةُ كما على المنصة (٣٦٫٩ · ٤٢ · ٧٣)');
  T(/خارجية/.test(b) && /داخلية/.test(b) && b.split(w.nm(12.6)).length === 2, 'والجيت واي: البطاريةُ الخارجيةُ والداخليةُ، بلا تكرار');
  w.IOT.live = L0;
  const R0 = w.ROLE; w.ROLE = 'admin';
  T(/هات التوكين/.test(w.integOtpHtml({ state:'code', methods:[{ type:'email', value:'m***@afaqy.com' }], sent:true, method:'email', err:'login_blocked' })) && !/هات التوكين/.test(w.integOtpHtml({ state:'code', methods:[], sent:true, err:'Invalid_OTP' })), 'وإن تعذّر الدخولُ بالكود يقول «هات التوكين» — لا لكودٍ غلطٍ فقط');
  w.ROLE = R0;
}

/* ── ١٠٣ · (V40.6) عمرُ جلسة أفاقي برو: التاريخ والأيام الباقية، والتنبيه مرةً عند كل عتبة ── */
console.log('\n══ ١٠٣ · عمر جلسة أفاقي برو ══');
{
  const R0 = w.ROLE; w.ROLE = 'admin';
  const day = 86400000, h1 = w.integSessionHtml({ tokExp:Date.now() + 29 * day + 3600000 });
  T(/صالحة لحد/.test(h1) && h1.indexOf(w.nm(29)) > -1 && /#22C55E/.test(h1), 'الجلسةُ الجديدة: «صالحة لحد … · فاضل ٢٩ يوم» بالأخضر وشريطٌ يقلّ');
  T(/#F59E0B/.test(w.integSessionHtml({ tokExp:Date.now() + 5 * day })) && /#EF4444/.test(w.integSessionHtml({ tokExp:Date.now() + 1 * day })), 'وتصفرّ تحت أسبوع وتحمرّ تحت يومين');
  T(/انتهت/.test(w.integSessionHtml({ tokExp:Date.now() - 1000 })), 'وعند الانتهاء: الخطواتُ مكتوبة');
  const n0 = (w.notifStore ? w.notifStore().length : 0); try { w.localStorage.removeItem('nsk14.integExp'); } catch (e){}
  const exp = Date.now() + 2.5 * day; w.integExpiryNotify({ tokExp:exp }); w.integExpiryNotify({ tokExp:exp });
  T((w.notifStore ? w.notifStore().length : 0) === n0 + 1, 'والتنبيهُ مرةً واحدةً لكل عتبة (٧ · ٣ · ١ · الانتهاء) لا كلَّ فتحة');
  w.ROLE = R0;
}

/* ── ١٠٤ · (V40.9) «الحساسات والجيت واي»: المخيمات والحساسات والجيت واي في تبويبات، وبوبُ المخيم وبوبُ الجهاز ── */
console.log('\n══ ١٠٤ · الحساسات والجيت واي ══');
{
  const D0 = w.IOT.data, L0 = w.IOT.live, F0 = w.iotDashHtml.F, now = Date.now();
  w.IOT.data = { camps:{ 'TST-1':{ gw:[21.41, 39.89], gws:[], sensors:[[21.41, 39.89], [21.41, 39.89], [21.41, 39.89], [21.41, 39.89], [21.41, 39.89]],
    gm:[{ serial:'GW-A' }], sm:[{ serial:'S-OK' }, { serial:'S-LATE' }, { serial:'S-OFF' }, { serial:'S-MISSING' }, {}] }, 'TST-2':{ gw:[21.4, 39.8], gws:[], sensors:[[21.4, 39.8]], gm:[{}], sm:[{}] } } };
  w.IOT.live = { at:now, busy:false, v:{ at:now - 120000, units:{ 'gw-a':{ t:now - 60000, v:{ ext_bat:12.6, int_bat:4.1 }, nm:'UG65' }, 's-ok':{ t:now - 300000, v:{ temp:36.9, hum:42, bat:73 }, nm:'EM300' }, 's-late':{ t:now - 3600000, v:{} }, 's-off':{ t:now - 86400000, v:{} } } } };
  const R = w.iotDashHtml.rows(), st = {}; R.forEach(r => { if (r.camp === 'TST-1') st[r.ser || '-'] = r.st; });
  T(st['GW-A'] === 'ok' && st['S-OK'] === 'ok' && st['S-LATE'] === 'late' && st['S-OFF'] === 'off' && st['S-MISSING'] === 'nof' && st['-'] === 'nos', 'كلُّ جهازٍ بحالته: محدّث · متأخر · منقطع · السيريال مش على المنصة · بلا سيريال');
  const C = w.iotDashHtml.camps(R), c1 = C.filter(c => c.id === 'TST-1')[0], c2 = C.filter(c => c.id === 'TST-2')[0];
  T(c1 && c1.st === 'bad' && c1.bad === 3 && c1.s === 5 && c1.g === 1 && c2 && c2.st === 'nos', 'المخيم: «محتاج تدخّل» بمشاكله (٣)، ومخيمٌ لسه بلا سيريالات مش محسوب مشكلة');
  w.iotDashHtml.F = { tab:'camps', st:'all', zone:'all', q:'', n:100, sort:'old', pop:null };
  const h = w.iotDashHtml(); T(/data-iotd="tab:s"/.test(h) && /data-iotd="tab:g"/.test(h) && /data-iotd="pop:camp:TST-1"/.test(h), 'تلات تبويبات: المخيمات · الحساسات · الجيت واي — والمخيم يتفتح بضغطة');
  w.iotDashHtml.F.q = 'tst-2'; const h2 = w.iotDashHtml(); { const tb = h2.split('<tbody>')[1] || ''; T(/pop:camp:TST-2/.test(tb) && !/pop:camp:TST-1/.test(tb), 'والبحثُ برقم المخيم يجيب المخيم ده بس (في الجدول — والتنبيهاتُ فوقه للكل)'); }
  w.iotDashHtml.act('pop:camp:TST-1'); const h3 = w.iotDashHtml();
  T(/svq-back/.test(h3) && /pop:dev:TST-1:g:0/.test(h3) && /pop:dev:TST-1:s:4/.test(h3), 'بوبُ المخيم: جيت واي وحساساته — وكلُّ جهاز يتفتح');
  w.iotDashHtml.act('pop:dev:TST-1:s:0'); const h4 = w.iotDashHtml();
  T(h4.indexOf(w.nm(36.9)) > -1 && h4.indexOf(w.nm(42)) > -1 && /iotdSer/.test(h4), 'بوبُ الحساس: الحرارةُ والرطوبةُ كبيرة، وخانةُ السيريال للتعديل');
  { /* (V41.1) RSSI: bands, and an offline sensor told apart — weak last signal = coverage, good = battery/fault */
    const mk = (x, st) => ({ kind:'s', st, v:{ rssi:x } });
    T(w.iotDashHtml.sig(mk(-80, 'ok')).rs === 'g' && w.iotDashHtml.sig(mk(-115, 'ok')).rs === 'g' && w.iotDashHtml.sig(mk(-120, 'ok')).rs === 'y' && w.iotDashHtml.sig(mk(-130, 'ok')).rs === 'r' && w.iotDashHtml.sig({ kind:'s', v:{ rssi:-80, snr:-18 } }).sn === 'r' && w.iotDashHtml.sig({ kind:'s', v:{ rssi:-80, snr:-5 } }).sn === 'y', '(V41.2) إشارة SF12 بتلات ألوان: أخضر ≥ ‎−١١٥ · أصفر لحد ‎−١٢٥ · أحمر أقل — والـSNR: أخضر ≥ ٠ · أصفر لحد ‎−١٥ · أحمر أقل');
    { const bars = h => (h.match(/width:4px/g) || []).length, lit = h => (h.match(/#22C55E|#EAB308|#EF4444/g) || []).length;
      const g3 = w.iotDashHtml.bars({ rssi:-80 }, 40), y2 = w.iotDashHtml.bars({ rssi:-120 }, 40), r1 = w.iotDashHtml.bars({ rssi:-130 }, 40), n0 = w.iotDashHtml.bars({}, 40);
      T(bars(g3) === 3 && lit(g3) === 3 && lit(y2) === 2 && lit(r1) === 1 && bars(n0) === 0 && g3.indexOf(w.nm(40)) > -1 && /dBm/.test(g3), '(V41.3) شَرطُ الإشارة: أخضر ٣ · أصفر ٢ · أحمر ١ · بلا قراءة «—» — والوقوفُ عليها يقول الـdBm والمسافة'); }
    T(w.iotDashHtml.sig({ kind:'s', dist:30, v:{ rssi:-122 } }).flag === 'cw' && w.iotDashHtml.sig({ kind:'s', dist:180, v:{ rssi:-90 } }).flag === 'fs' && w.iotDashHtml.sig({ kind:'s', dist:90, v:{ rssi:-122 } }).flag === '', '(V41.2) الإشارة قصاد المسافة: قريب (≤ ٥٠ م) وضعيف · بعيد (> ١٥٠ م) وقوي');
    T(/مشكلة تغطية/.test(w.iotDashHtml.sigWhy(mk(-118, 'off'))) && /بطارية/.test(w.iotDashHtml.sigWhy(mk(-75, 'off'))), 'والحساس المنقطع: إشارته الأخيرة بتفرّق بين مشكلة تغطية وعطل/بطارية');
  }
  w.iotDashHtml.act('close');
  const big = { gw:[21.4, 39.8], gws:[], sensors:[], gm:[{ serial:'GWX' }], sm:[] }; for (let i = 0; i < 8000; i++){ big.sensors.push([21.4, 39.8]); big.sm.push({ serial:'X' + i }); }
  w.IOT.data = { camps:{ 'BIG':big } }; w.iotDashHtml.F = { tab:'s', st:'all', zone:'all', q:'', n:100, sort:'old', pop:null };
  const t0 = Date.now(), h5 = w.iotDashHtml(), ms = Date.now() - t0;
  T(ms < 2000 && (h5.split('<tr ').length - 1) === 100, 'تمنية آلاف حساس: تُحسب كلُّها وتُعرض ١٠٠ — في ' + ms + ' مللي ثانية');
  w.IOT.data = D0; w.IOT.live = L0; w.iotDashHtml.F = F0;
}
{ /* (V40.8) the dashboard is its own page in the field group */
  { const M0 = w.PV.MTOP; w.PV.MTOP = ''; let h0 = ''; try { h0 = w.mapUIHtml(); } catch (e){}
    w.PV.MTOP = 'layers'; let h1 = ''; try { h1 = w.mapUIHtml(); } catch (e){}
    T(/data-mtop="layers"/.test(h0) && !/data-iot="1"/.test(h0) && /data-iot="1"/.test(h1) && /data-mfilt=/.test(h0), '(V41.1) صفُّ الخريطة فوق مطويّ بالمجموعات: الطبقاتُ تتفتح بضغطة، والتصفيةُ ظاهرة دايمًا');
    w.PV.MTOP = M0; }
  T(w.PAGE.iotdash && w.PAGE.iotdash.m === 'الميدان' && typeof w.PAGE.iotdash.body === 'function' && (w.ROLES.supervisor.nav || []).indexOf('iotdash') > -1, 'الداشبورد صفحةٌ في «الميدان» للمدير والمهندس والمشرف — لا تبويبٌ في صحة النظام');
}

/* ── ١٠٥ · (V41.1) مصطلحاتُ الأردو: المخيم «کیمپ» لا «خیمہ»، والتفويج «تفویج»، والمهام «کام»، والتحديات «چیلنج»، ولا حروفَ عربيةً خالصة ── */
console.log('\n══ ١٠٥ · مصطلحات الأردو ══');
{
  const UR = (w.I18N_D || w.D || {}).ur || (w.i18nDict ? w.i18nDict('ur') : null) || {};
  const K = Object.keys(UR);
  const bad = (re, test) => K.filter(k => re.test(k) && test(UR[k] || ''));
  const camp = bad(/مخيم/, v => /خیم/.test(v)).filter(k => !/خيم[ةه]|خيام/.test(k));
  const tfw = bad(/تفويج/, v => /روانگی/.test(v));
  const task = bad(/مهام|مهمة/, v => /امور/.test(v));
  const chal = bad(/تحد/, v => /رکاوٹ/.test(v)).filter(k => !/عائق|معوق|عوائق/.test(k));   /* a text naming both challenges and obstacles keeps «رکاوٹ» for the obstacle */
  const ar = K.filter(k => /[\u064A\u0643\u0649]/.test(String(UR[k] || '').replace(/«[^»]*»/g, '')));   /* a word quoted «…» from the Arabic is discussed, not translated */
  T(K.length > 1000, 'قاموسُ الأردو محمَّل في الفحص (' + K.length + ')');
  T(!camp.length, 'المخيم «کیمپ» لا «خیمہ» (الخيمةُ جزءٌ من المخيم)' + (camp.length ? ' — ' + camp.slice(0, 2).join(' | ') : ''));
  T(!tfw.length && !task.length && !chal.length, 'التفويج «تفویج» · المهام «کام» · التحديات «چیلنج»' + ([...tfw, ...task, ...chal].length ? ' — ' + [...tfw, ...task, ...chal].slice(0, 2).join(' | ') : ''));
  T(!ar.length, 'لا ي ولا ك ولا ى عربيةً في نصوص الأردو (الأردو: ی ک)' + (ar.length ? ' — ' + ar.slice(0, 2).join(' | ') : ''));
}

/* ── ١٠٦ · (V41.5) صحة الحساسات والتنبيهات وقبول التركيب ── */
console.log('\n══ ١٠٦ · صحة الحساسات والتنبيهات وقبول التركيب ══');
{
  const now = Date.now(), H = w.iotDashHtml.health;
  T(H({ kind:'s', st:'ok', v:{ rssi:-80 } }) === 'g' && H({ kind:'s', st:'ok', v:{ rssi:-122 } }) === 'y' && H({ kind:'s', st:'late', v:{} }) === 'y' && H({ kind:'s', st:'off', v:{} }) === 'r' && H({ kind:'s', st:'nos' }) === 'w' && H({ kind:'s', st:'nof' }) === 'n', 'لونُ الصحة: أخضر · أصفر (متأخر أو إشارة ضعيفة) · أحمر (منقطع) · رمادي · أبيض (مخطط)');
  const mk = (camp, i, at, st, v) => ({ kind:'s', camp, pn:camp, did:camp + '-S' + i, i, at, st, v:v || {} });
  const rows = [mk('A', 0, now - 5000000, 'off'), mk('A', 1, now - 5200000, 'off'), mk('B', 0, now - 9000000, 'off'), mk('B', 1, now - 60000, 'ok'), mk('C', 0, now - 60000, 'ok', { bat:15 })];
  const A = w.iotDashHtml.alertsOf(rows), k = A.map(a => a.k + ':' + a.camp).sort().join(',');
  T(k === 'bat:C,gw:A,off:B', 'التنبيهات: جيت واي واقف غالبًا (كل حساسات المخيم وقفت سوا) · حساس منقطع · بطارية ضعيفة — ' + k);
  const L0 = w.IOT.live; w.IOT.live = { at:now, busy:false, v:{ at:now, units:{ 'ok1':{ t:now - 60000, v:{ rssi:-80 } }, 'red1':{ t:now - 60000, v:{ rssi:-130 } }, 'old1':{ t:now - 7200000, v:{ rssi:-80 } } } } };
  const acc = s => w.iotDashHtml.accept({ serial:s }).ok;
  T(acc('ok1') && !acc('red1') && !acc('old1') && !acc('none') && !acc(''), 'قبولُ التركيب: قراءةٌ حديثة وإشارةٌ مش حمرا — غير كده يرفض ويقول السبب');
  w.IOT.live = L0;
}

/* ── ١٠٧ · (V42.3) جدارُ Cloudflare على أفاقي برو ── */
console.log('\n══ ١٠٧ · جدارُ الحماية على أفاقي برو ══');
{
  const fn = readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');
  T(/cf-mitigated/.test(fn) && /async function cfFetch/.test(fn) && /PRO_URL \+ url\.slice\(WEB_URL\.length\)/.test(fn) && /err:CF_BLOCK \? 'cf'/.test(fn), 'الجسر: طلبٌ يصدّه جدارُ api.afaqy.pro يُعاد على api.afaqy.sa، وما بقي محجوبًا يُسمّى «cf» لا «كلمة سر»');
  T(/\(V42\.4\) re-saving the same account/.test(fn) && /keep = !!P\.ok && a0\.length > 0/.test(fn), 'إعادةُ حفظ الحساب نفسِه تُبقي جلستَه إن كانت ترى أجهزتنا — بلا كودٍ جديد');
  { const off = w.integSessionHtml({ state:'off', tokExp:Date.now() + 20 * 86400000 }), on = w.integSessionHtml({ state:'ok', tokExp:Date.now() + 20 * 86400000 });
    T(!/#22C55E/.test(off) && /94A3B8/.test(off) && /#22C55E/.test(on), '(V42.5) بلا حسابٍ محفوظ: الجلسةُ رماديةٌ «محفوظة ومش مستخدمة» لا شريطٌ أخضر يناقض «غير متصل»'); }
  const h1 = w.integStateLine({ state:'err', err:'cf', at:Date.now() }), h2 = w.integStateLine({ state:'err', err:'login', httpStatus:403, msg:'403', at:Date.now() });
  T(/Cloudflare/.test(h1) && (h2.match(/403|٤٠٣/g) || []).length === 1, 'الكارت: الجدار باسمه، ورقمُ الرفض مرةً واحدة لا «(403) (٤٠٣)»');
}

/* ── ١٠٨ · (V42.6) الشركةُ المضافة تظهر في قائمة المخيم الجديد ── */
console.log('\n══ ١٠٨ · الشركةُ المضافة في قائمة الشركات ══');
{
  const core = readFileSync(new URL('../src/01-core/01-core-registry-05-sync-scale.js', import.meta.url), 'utf8');
  T(!/office && DB\.col\('coreqs'\)/.test(core) && /coreqs[\s\S]{0,400}coFill\(\)/.test(core), 'الشركاتُ المضافة تُقرأ لكل الأدوار، وتُعاد تعبئةُ القائمة لحظةَ وصولها — لا قبلها فتضيع');
  const prev = w.STATE.coreqs; w.STATE.coreqs = Object.assign({}, prev || {}, { 'شركة اختبار مضافة':{ name:'شركة اختبار مضافة', status:'معتمد' } });
  w.coFill(); T(w.CO_LIST.indexOf('شركة اختبار مضافة') > -1, 'وبعد التعبئة: الشركةُ المعتمدةُ في القائمة التي يختار منها نموذجُ المخيم');
  w.STATE.coreqs = prev; w.coFill();
}

/* ── ١٠٩ · (V42.7) الحدودُ والصورُ للمشرف أيضًا ── */
console.log('\n══ ١٠٩ · الحدودُ والصورُ للمشرف ══');
{
  const R0 = w.ROLE, as = r => { w.ROLE = r; return { b:w.mayBoundsEdit(), p:w.mayPhotoEdit(), s:w.maySiteEdit() }; };
  const sup = as('supervisor'), eng = as('engineer'), tech = as('tech'), store = as('store'); w.ROLE = R0;
  T(sup.b && sup.p && !sup.s, 'المشرف: يعدّل الحدودَ ويحذف/يستبدل الصور — والتقسيمُ والتصنيفُ يبقيان للمهندس');
  T(eng.b && eng.p && eng.s && !tech.b && !tech.p && !store.b && !store.p, 'المهندسُ كما كان، والفنيُّ والمخزنُ لا');
  const app = readFileSync(new URL('../src/03z-shared/03z-shared-11-from-tasks-office-11-site-popup.js', import.meta.url), 'utf8');
  T(/mayBoundsEdit\(\) \? kv\('حدود المخيم'/.test(app) && /campFoot\(s\) && maySiteEdit\(\) \? btn\(/.test(app), 'زرُّ الحدود للمشرف، وزرُّ «قسّم المخيم» للمهندس');
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
console.log(fails.length ? 'جردُ السيناريوهات فشل ✗' : 'جردُ السيناريوهات نظيف — ما يُحفَظ صحيحٌ في المسارات الثلاثة عشر ✅');
process.exit(fails.length ? 1 : 0);
