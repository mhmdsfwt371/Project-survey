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
  const P0 = pick('ممر'); w.STATE.recs[P0.id] = Object.assign({ id:P0.id, chals:['المسار تحت كوبري'] }, base);
  const P1 = pick('ممر'); w.STATE.recs[P1.id] = Object.assign({ id:P1.id, chals:['لا يوجد سطح تثبيت — يحتاج هيكلًا أو عمودًا'], chal_note:'عند مخرج النفق — على لوحة استرشادية تحت المظلة' }, base);
  const P2 = pick('ممر'); w.STATE.recs[P2.id] = Object.assign({ id:P2.id, chals:['عائق في الموقع (إنشائي أو درج أو حواجز أو حفر أو نفق أو كوبري)'] }, base);
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
  const card = w.aqRepCard(q2, w.aqRepData(q2));
  T(card.indexOf('data-aqrep="xls"') > -1 && card.indexOf('data-aqrep="pdf"') > -1 && card.indexOf('63') > -1 || card.indexOf('٦٣') > -1, 'ونتيجةُ الحساب بطاقةٌ بالعدد وزرَّي إكسل وPDF');
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
console.log(fails.length ? 'جردُ السيناريوهات فشل ✗' : 'جردُ السيناريوهات نظيف — ما يُحفَظ صحيحٌ في المسارات الثلاثة عشر ✅');
process.exit(fails.length ? 1 : 0);
