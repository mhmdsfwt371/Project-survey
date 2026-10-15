/* ═══ (V37.97) جردُ السيناريوهات — المعنى لا الشكل ═══
   الجرودُ تتحقّق أن الشاشةَ تُفتح وأن الزرَّ موصول، لا أن ما يُحفَظ صحيح. فعاش نموذجُ التركيب
   مكسورًا من V14.27 إلى V37.90 (أسماءٌ فارغة وكلُّ القطع بمفتاح «undefined») ولم يرصده جرد.
   هنا خمسةُ مساراتٍ كاملة، تُحرَّك بدوالِّ التطبيق نفسِها ويُتحقَّق مما كُتب في الحالة والطابور:
   ١ التركيب · ٢ تجهيزةُ الديمو · ٣ المسح والاعتماد · ٤ بياناتُ ١٤٤٧ ← نموذجُ التركيب · ٥ جسرُ نظام البطاقات والتحقق. */
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

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
console.log(fails.length ? 'جردُ السيناريوهات فشل ✗' : 'جردُ السيناريوهات نظيف — ما يُحفَظ صحيحٌ في المسارات الخمسة ✅');
process.exit(fails.length ? 1 : 0);
