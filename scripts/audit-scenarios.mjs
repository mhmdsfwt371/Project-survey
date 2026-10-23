/* ═══ (V37.97) جردُ السيناريوهات — المعنى لا الشكل ═══
   الجرودُ تتحقّق أن الشاشةَ تُفتح وأن الزرَّ موصول، لا أن ما يُحفَظ صحيح. فعاش نموذجُ التركيب
   مكسورًا من V14.27 إلى V37.90 (أسماءٌ فارغة وكلُّ القطع بمفتاح «undefined») ولم يرصده جرد.
   هنا خمسةُ مساراتٍ كاملة، تُحرَّك بدوالِّ التطبيق نفسِها ويُتحقَّق مما كُتب في الحالة والطابور:
   ١ التركيب · ٢ تجهيزةُ الديمو · ٣ المسح والاعتماد · ٤ بياناتُ ١٤٤٧ ← نموذجُ التركيب · ٥ جسرُ نظام البطاقات والتحقق ·
   (V37.99) ٦ المخزن · ٧ أرقامُ المسح للوزارة · ٨ الفكّ · (V38.16) ٩ مساعدُ البيانات: كلُّ رقمٍ يجيب به = عدٌّ مستقلٌّ من الحالة. */
import { readFileSync } from 'fs';
import { appHtml } from './lib/src.mjs';   /* (V38.39) the whole app in production order — index.html is now the core only */
import { JSDOM, VirtualConsole } from 'jsdom';

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
      ['survey','install','brief'].forEach(m => { w.FIELD_MODE = m; tryIt(role + ' نافذة ' + m + ' ' + x.id, () => String(w.popHtml()).length > 300); });
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

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
console.log(fails.length ? 'جردُ السيناريوهات فشل ✗' : 'جردُ السيناريوهات نظيف — ما يُحفَظ صحيحٌ في المسارات الثلاثة عشر ✅');
process.exit(fails.length ? 1 : 0);
