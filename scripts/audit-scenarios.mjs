/* ═══ (V37.97) جردُ السيناريوهات — المعنى لا الشكل ═══
   الجرودُ تتحقّق أن الشاشةَ تُفتح وأن الزرَّ موصول، لا أن ما يُحفَظ صحيح. فعاش نموذجُ التركيب
   مكسورًا من V14.27 إلى V37.90 (أسماءٌ فارغة وكلُّ القطع بمفتاح «undefined») ولم يرصده جرد.
   هنا خمسةُ مساراتٍ كاملة، تُحرَّك بدوالِّ التطبيق نفسِها ويُتحقَّق مما كُتب في الحالة والطابور:
   ١ التركيب · ٢ تجهيزةُ الديمو · ٣ المسح والاعتماد · ٤ بياناتُ ١٤٤٧ ← نموذجُ التركيب · ٥ جسرُ نظام البطاقات والتحقق ·
   (V37.99) ٦ المخزن · ٧ أرقامُ المسح للوزارة · ٨ الفكّ · (V38.16) ٩ مساعدُ البيانات: كلُّ رقمٍ يجيب به = عدٌّ مستقلٌّ من الحالة. */
import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('index.html', 'utf8');
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
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
console.log(fails.length ? 'جردُ السيناريوهات فشل ✗' : 'جردُ السيناريوهات نظيف — ما يُحفَظ صحيحٌ في المسارات التسعة ✅');
process.exit(fails.length ? 1 : 0);
