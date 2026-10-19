/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-15-from-ext-camps-03-nusuk-card-system.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ext-camps-03-nusuk-card-system.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : ex47Net, ex47Date, ex47Plan, ex47Import, extArabicDigits, extTsParse, extFilePlan, extFileImport, extOvSheet
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V37.88) بياناتُ موسم ١٤٤٧ — تُستورَد من ملف «تسليمات الممرات» كما هو ═══
   تُركَّب النقاطُ هذا الموسمَ بأجهزة ١٤٤٧ نفسِها. وقارئُ ١٤٤٧ ما زال مسجَّلًا في نظام البطاقات،
   فسيريالُه يكشف اسمَ موقعه هناك — اقتراحُ ربطٍ لكلِّ نقطةٍ قبل تركيبها.
   يُقرأ في المتصفح وحدَه، ويُحفَظ لكلِّ نقطةٍ: سيريالُ القارئ والراوتر والكاميرا، وشبكتُها
   (أولُ ثلاثة أجزاء)، واسمُها في الملف، والمهندسُ والتاريخ. لا تُقرأ أعمدةُ المستخدم وكلمات
   المرور والواي فاي والشرائح والعناوين الفيزيائية أصلًا. المخيمُ برقمه («Camp4-547» = شاخص 4/547 في منى)،
   والممرُّ باسمه («SH 56-24» = Path-SH56-24، و«SH1-L» في الممر المظلل = Shaded-1L) ثم بالقرب ٦٠ مترًا. */
function ex47Net(ip){ var m = /^(\d+\.\d+\.\d+)\.\d+$/.exec(String(ip || '').trim()); return m ? m[1] : ''; }

function ex47Date(v){ return (v && typeof v.getTime === 'function' && !isNaN(v.getTime())) ? v.toISOString().slice(0, 10) : (/\d{4}-\d{2}-\d{2}/.exec(String(v || '')) || [''])[0]; }

function ex47Plan(wb){
  /* (V37.91) الأعمدةُ تُقرأ بعناوينها لا بمواضعها — ملفُّ التسليمات تغيّر ترتيبُه بين نسختين
     (أُضيف «Provider Name» و«Camera Name» فانزاح القارئُ والكاميرا)، فالموضعُ الثابتُ كان سيقرأ عمودًا آخر */
  var find = function(re){ var n = wb.SheetNames.filter(function(k){ return re.test(k); })[0]; return n ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header:1, raw:true, defval:'' }) : null; };
  var C = find(/camps/i), Pt = find(/paths/i), plan = { set:{}, campsN:0, pathsN:0, miss:[], out:[], dup:0, orph:[] };
  if (!C && !Pt) return null;
  var S = function(v){ return String(v == null ? '' : v).replace(/\u00a0/g, ' ').trim(); };
  var col = function(row, re, from, to){ for (var i = from || 0; i < Math.min(to == null ? row.length : to, row.length); i++){ if (re.test(S(row[i]))) return i; } return -1; };
  var signKey = function(v){ return String(v || '').replace(/\s+/g, '').toUpperCase(); };
  var mina = {}, others = [];
  (STATE.sites || []).forEach(function(x){
    if (x.type === 'مخيم'){ if (x.zone === 'منى' && x.sign){ var k0 = signKey(x.sign); if (!mina[k0]) mina[k0] = x; } return; }
    var m = /Path-([A-Za-z0-9_\-.]+)/i.exec(String(x.name || '')) || /([A-Za-z][A-Za-z0-9_\-. ]{3,})/.exec(String(x.name || ''));
    others.push({ x:x, k:m ? extNameKey(m[1]) : '' });
  });
  var put = function(id, v, nm0){
    if (plan.set[id]){ plan.dup++; (plan.set[id].more = plan.set[id].more || []).push({ nm:nm0, rdr:v.rdr, rtr:v.rtr, cam:v.cam }); return; }
    plan.set[id] = v;
  };
  /* ── المخيمات ── */
  if (C){
    var h = -1; for (var i0 = 0; i0 < Math.min(6, C.length); i0++){ if (col(C[i0], /^router$/i) > -1){ h = i0; break; } }
    if (h > -1){
      var H = C[h], Sub = C[h + 1] || [];
      var g = { rtr:col(H, /^router$/i), rdr:col(H, /^reader$/i), cam:col(H, /^camera$/i), eng:col(H, /engineer/i), at:col(H, /config\s*date/i) };
      var gl = col(H, /latitude/i), gn = col(H, /longitude/i);
      var starts = [g.rtr, g.rdr, g.cam, g.eng].filter(function(z){ return z > -1; }).sort(function(p, q){ return p - q; });
      var end = function(st){ var n = starts.filter(function(z){ return z > st; })[0]; return n == null ? H.length : n; };
      var ix = function(gs, re){ return gs > -1 ? col(Sub, re, gs, end(gs)) : -1; };
      var c = { rtrIp:ix(g.rtr, /^ip$/i), rtr:ix(g.rtr, /^serial$/i), rdrIp:ix(g.rdr, /^ip$/i), rdr:ix(g.rdr, /^serial$/i), camIp:ix(g.cam, /^ip$/i), cam:ix(g.cam, /^serial$/i) };
      var V = function(r, k){ return c[k] > -1 ? S(r[c[k]]) : ''; };
      C.slice(h + 2).forEach(function(r){
        var nm0 = S(r[0]); if (!nm0 || /^column\d*$/i.test(nm0)) return;
        plan.campsN++;
        var m = /^cam(?:p)?\s*[-_ ]?\s*([0-9a-z][0-9a-z\-]*?)\s*[-_\/. ]+\s*(\d+)\s*(?:\(.*\))?\s*(?:up|down)?$/i.exec(nm0);
        var x = m ? mina[signKey(m[1] + '/' + m[2])] : null;
        var rec = { nm:nm0, rtr:V(r, 'rtr'), rdr:V(r, 'rdr'), cam:V(r, 'cam'), net:ex47Net(V(r, 'rtrIp')) || ex47Net(V(r, 'rdrIp')),
                    eng:g.eng > -1 ? S(r[g.eng]) : '', at:g.at > -1 ? ex47Date(r[g.at]) : '' };
        if (!x){
          (m ? plan.miss : plan.out).push(nm0);
          plan.orph.push(Object.assign({ kind:'camp', sign:m ? (m[1] + '/' + m[2]).toUpperCase() : '',
            lat:+(gl > -1 ? r[gl] : 0) || 0, lng:+(gn > -1 ? r[gn] : 0) || 0 }, rec));   /* (V37.92) يُحفَظ بياناتُه لا اسمُه وحدَه */
          return;
        }
        put(x.id, rec, nm0);
      });
    }
  }
  /* ── الممرات والبوابات والطوابق ── */
  if (Pt && Pt.length){
    var P0 = Pt[0], pc = { lat:col(P0, /latitude/i), lng:col(P0, /longitude/i), ip:col(P0, /^ip$/i), ser:col(P0, /^serial$/i), eng:col(P0, /eng/i), at:col(P0, /^date$/i),
                           ready:col(P0, /الجاهزية/), crane:col(P0, /رافعة/), maint:col(P0, /صيانة/) };
    pc.kind = pc.ip > 0 ? pc.ip - 1 : 3;
    var num = function(v){ var f = parseFloat(S(v).replace('°', '')); return isFinite(f) ? f : 0; };
    var cur = null;
    var match = function(nm0, la, ln){
      var k = extNameKey(nm0), k2 = k.replace(/^path/, '');
      var sh = /^(?:path-?)?sh\s*-?\s*([1-7])\s*-?\s*([lr])$/i.exec(nm0.replace(/\s+/g, ''));
      var alias = sh ? extNameKey('shaded' + sh[1] + sh[2]) : '';
      var hit = others.filter(function(o){ return o.k && (o.k === k || o.k === k2 || o.k.replace(/^path/, '') === k2 || (alias && o.k === alias)); })[0];
      if (!hit && k2.length >= 6) hit = others.filter(function(o){ return o.k && o.k.length >= 6 && (o.k.slice(-k2.length) === k2 || k2.slice(-o.k.length) === o.k); })[0];
      if (!hit && la && ln){
        var best = null; others.forEach(function(o){ var d = geoDist([la, ln], [+o.x.lat, +o.x.lng]); if (!best || d < best.d) best = { o:o, d:d }; });
        if (best && best.d <= 60) hit = best.o;
      }
      return hit;
    };
    var flush = function(){
      if (!cur) return; plan.pathsN++;
      var hit = match(cur.nm, cur.lat, cur.lng);
      if (!hit){
        plan.out.push(cur.nm);
        plan.orph.push({ kind:'point', nm:cur.nm, rtr:cur.rtr || '', rdr:cur.rdr || '', cam:cur.cam || '', net:cur.net || '', eng:cur.eng || '', at:cur.at || '',
                         lat:cur.lat || 0, lng:cur.lng || 0, ready:cur.ready || '', crane:cur.crane || '', maint:cur.maint || '' });   /* (V37.92) */
        cur = null; return;
      }
      put(hit.x.id, { nm:cur.nm, rtr:cur.rtr || '', rdr:cur.rdr || '', cam:cur.cam || '', net:cur.net || '', eng:cur.eng || '', at:cur.at || '',
                      ready:cur.ready || '', crane:cur.crane || '', maint:cur.maint || '' }, cur.nm);
      cur = null;
    };
    Pt.slice(1).forEach(function(r){
      var nm0 = S(r[0]);
      if (nm0 && /[A-Za-z]/.test(nm0)){ flush(); cur = { nm:nm0, lat:pc.lat > -1 ? num(r[pc.lat]) : 0, lng:pc.lng > -1 ? num(r[pc.lng]) : 0,
        eng:pc.eng > -1 ? S(r[pc.eng]) : '', at:pc.at > -1 ? ex47Date(r[pc.at]) : '', ready:pc.ready > -1 ? S(r[pc.ready]) : '',
        crane:pc.crane > -1 ? S(r[pc.crane]) : '', maint:pc.maint > -1 ? S(r[pc.maint]) : '' }; }
      else if (nm0){ flush(); return; }   /* سطرُ عنوانٍ عربيّ («الممر المظلل …») لا نقطة */
      if (!cur) return;
      var kind = S(r[pc.kind]).toLowerCase(), sv = pc.ser > -1 ? S(r[pc.ser]) : '';
      if (kind === 'router'){ cur.rtr = sv; cur.net = ex47Net(r[pc.ip]); }
      else if (kind === 'reader') cur.rdr = sv;
      else if (kind === 'camera') cur.cam = sv;
    });
    flush();
  }
  /* (V37.92) حارسٌ أخير: في الملف صفٌّ لُصقت فيه كلمةُ مرورٍ في خانة سيريال (Camp-17-716) — فكلُّ قيمةٍ تشبه
     كلمةَ مرورٍ أو اسمَ دخولٍ تُسقَط قبل أن تُحفَظ، ويُعرَض عددُها */
  plan.scrub = 0;
  var bad = /[@#$%]|pass(word)?|admin|root/i, F = ['rtr', 'rdr', 'cam', 'net', 'eng', 'ready', 'crane', 'maint'];
  var clean = function(o){ F.forEach(function(k){ if (o[k] && bad.test(String(o[k]))){ o[k] = ''; plan.scrub++; } }); (o.more || []).forEach(clean); };
  Object.keys(plan.set).forEach(function(id){ clean(plan.set[id]); });
  plan.orph.forEach(clean);
  return plan;
}

function ex47Import(file){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true });
        var P = ex47Plan(wb);
        if (!P){ toast(t('لم أجد ورقتَي MINA Camps وMINA paths في الملف')); return; }
        EXT.ex47 = P; render(1);
      } catch (e){ softErr('استيراد ١٤٤٧', e, ''); toast(t('تعذّرت قراءةُ الملف')); }
    };
    fr.readAsArrayBuffer(file);
  });
}

/* ملفُّ تصديرٍ من النظام: أعمدةٌ تُعرَف بعناوينها — قرّاء (رقم القارئ · اسم الموقع · آخر تحديث) أو خيام (الكود · السعة · الإحداثيات) */
function extArabicDigits(v){ return String(v == null ? '' : v).replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }); }

function extTsParse(v){
  if (v && typeof v.getTime === 'function') return isNaN(v.getTime()) ? '' : v.toISOString();
  var s0 = extArabicDigits(v).trim(); if (!s0) return '';
  var m = /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/.exec(s0), tm = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s0);   /* الوقتُ قد يسبق التاريخ في تصدير النظام */
  if (!m){ var d0 = new Date(s0); return isNaN(d0.getTime()) ? '' : d0.toISOString(); }
  var hh = +(tm ? tm[1] : 0); if (/م/.test(s0) && hh < 12) hh += 12; if (/ص/.test(s0) && hh === 12) hh = 0;
  var d = new Date(+m[1], +m[2] - 1, +m[3], hh, +(tm ? tm[2] : 0), +(tm && tm[3] ? tm[3] : 0));
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

function extFilePlan(wb){
  var S = function(v){ return String(v == null ? '' : v).replace(/\u00a0/g, ' ').trim(); };
  var rd = [], tn = [];
  wb.SheetNames.forEach(function(sn){
    var A = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header:1, raw:true, defval:'' }), h = -1, H = null;
    for (var i = 0; i < Math.min(10, A.length); i++){ if ((A[i] || []).some(function(c){ return /رقم القارئ|reader\s*id|readerid|serial|كود|code|اسم الخيمة|tent/i.test(S(c)); })){ h = i; H = A[i]; break; } }
    if (h < 0) return;
    var col = function(re){ for (var k = 0; k < H.length; k++) if (re.test(S(H[k]))) return k; return -1; };
    var cId = col(/رقم القارئ|reader\s*id|readerid|^serial$|السيريال/i), cLoc = col(/اسم الموقع|location|الموقع/i), cTs = col(/آخر تحديث|updated|timestamp|last/i);
    var cCode = col(/^(كود|code|الكود|رقم الخيمة|اسم الخيمة|tent code|tent)$/i), cCap = col(/السعة|capacity/i), cLat = col(/latitude|خط العرض/i), cLng = col(/longitude|خط الطول/i), cGrp = col(/المجموعة|group/i);
    if (cId > -1 && cLoc > -1){
      A.slice(h + 1).forEach(function(r){ var id = extArabicDigits(S(r[cId])); if (!/^\d{4,}$/.test(id)) return; rd.push([id, S(r[cLoc]), cTs > -1 ? extTsParse(r[cTs]) : '']); });
    } else if (cCode > -1){
      A.slice(h + 1).forEach(function(r){ var c = S(r[cCode]); if (!c) return; tn.push(['', c, cLat > -1 ? S(r[cLat]) : '', cLng > -1 ? S(r[cLng]) : '', cGrp > -1 ? S(r[cGrp]) : '', cCap > -1 ? +extArabicDigits(r[cCap]) || 0 : 0]); });
    }
  });
  if (!rd.length && !tn.length) return null;
  /* يُدمَج مع آخر جسر: ما لم يأتِ في الملف يبقى */
  var cur = EXT.bridge ? { rd:Object.keys(EXT.readers || {}).map(function(k){ var r = EXT.readers[k]; return [r.readerId, r.locationName, r.timestamp]; }),
                          tn:Object.keys(EXT.tents || {}).map(function(k){ var x = EXT.tents[k]; return [x.id, x.code, x.latitude, x.longitude, x.tentGroup, x.capacity]; }) } : { rd:[], tn:[] };
  return { v:1, at:Date.now(), rd:rd.length ? rd : cur.rd, tn:tn.length ? tn : cur.tn, ov:[], src:'file', nRd:rd.length, nTn:tn.length };
}

function extFileImport(file){
  if (!may('settings')){ toast(t('الجسرُ للمهندس فما فوق')); return; }
  /* (V38.5) ملفُّ الجسر (nusuk-bridge-….json) يُعتمَد كما هو */
  if (/\.json$/i.test(String(file && file.name || ''))){
    var fj = new FileReader();
    fj.onload = function(){
      var o = null; try { o = JSON.parse(String(fj.result || '')); } catch (e){ o = null; }
      if (!o || !extBridgeApply(o, true)){ toast(t('هذا ليس ملفَّ الجسر')); return; }
      toast(t('اعتُمد الجسر') + ' \u00b7 ' + nm(o.rd.length) + ' ' + t('قارئ') + ' \u00b7 ' + nm(o.tn.length) + ' ' + t('خيمة')); render(1);
    };
    fj.readAsText(file); return;
  }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true }), o = extFilePlan(wb);
        if (!o){ toast(t('لم أجد في الملف أعمدةَ القرّاء (رقم القارئ · اسم الموقع) ولا الخيام (الكود)')); return; }
        extBridgeApply(o, true);
        toast(t('اعتُمد ملفُّ النظام') + ' \u00b7 ' + nm(o.nRd) + ' ' + t('قارئ') + ' \u00b7 ' + nm(o.nTn) + ' ' + t('خيمة')); render(1);
      } catch (e){ softErr('ملف النظام', e, ''); toast(t('تعذّرت قراءةُ الملف')); }
    };
    fr.readAsArrayBuffer(file);
  });
}

/* النظرةُ العامة — بترتيب نافذة «عرض النظرة العامة» في نظام البطاقات */
function extOvSheet(){
  var id = EXT.ovOpen; if (!id) return '';
  var x = siteFind(id); if (!x){ EXT.ovOpen = ''; return ''; }
  var L = extLink(x), tn = L.tent || (L.reader ? extTentByCode(L.reader.locationName) : null);
  var ov = tn && EXT.ov[tn.id] && EXT.ov[tn.id].data, c = (ov && ov.occupancyStatus) || {}, a = (ov && ov.averageTime) || {};
  var tot = (+c.currentlyOccupied || 0) + (+c.withoutBracelet || 0) + (+c.fromOtherCamps || 0), cap = +c.totalCapacity || 0;
  var pct = cap ? Math.round(tot / cap * 100) : 0;
  var row = function(k, v){ return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0"><span class="hint" style="margin:0">' + esc(t(k)) + '</span><b class="num">' + v + '</b></div>'; };
  var pillB = function(k, v){ return '<div style="text-align:center"><div class="hint" style="margin:0 0 6px">' + esc(t(k)) + '</div><span class="pill" style="padding:8px 18px">' + esc(v || t('غير محدد')) + '</span></div>'; };
  var code = (tn && tn.code) || x.nk || x.sign || x.id;
  var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:8px 0 12px;border-bottom:1px solid var(--line,#333)">'
      + pillB('مشغل مخيم', (tn && tn.tentGroup) || '') + pillB('مزود خدمة', x.co || '') + '</div>';
  if (!ov){
    body += alertBox('info', t('لا إشغالَ لهذا المخيم في آخر جسر — يدخل في الجسر التالي ما دام مربوطًا'));
  } else {
    body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;padding-top:12px">'
      + '<div><h4 style="margin:0 0 6px">' + esc(t('حالة الإشغال المباشر')) + '</h4>'
      + row('السعة المخصصة', nm(cap)) + row('حاملو بطاقات', nm(+c.currentlyOccupied || 0)) + row('بدون بطاقات', nm(+c.withoutBracelet || 0)) + row('من خيمات أخرى', nm(+c.fromOtherCamps || 0))
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0"><span class="hint" style="margin:0">' + esc(t('نسبة الإشغال')) + '</span><span class="pill ' + (pct >= 100 ? 'bad' : pct >= 75 ? 'warn' : 'ok') + '">' + nm(pct) + '%</span></div>'
      + '<div style="height:8px;border-radius:6px;background:var(--line,#333);overflow:hidden"><div style="height:8px;width:' + Math.min(100, pct) + '%;background:var(--acc,#2bb3c0)"></div></div></div>'
      + '<div><h4 style="margin:0 0 6px">' + esc(t('متوسط الوقت')) + '</h4>' + row('داخل المخيم', esc(a.insideCamp || '\u2014')) + row('وقت العبور', esc(a.transitTime || '\u2014')) + '</div>'
      + '</div>';
  }
  body += '<div class="pop-rows" style="margin:12px 0 0">'
    + '<div><span class="k">' + esc(t('القارئ')) + '</span><span>' + esc((L.reader && L.reader.readerId) || L.ser || '\u2014') + ' \u00b7 ' + esc(extRdStateText(L.reader)) + '</span></div>'
    + '<div><span class="k">' + esc(t('آخر جسر')) + '</span><span>' + (EXT.bridge ? esc(pilotAgo(EXT.bridge.at)) : esc(t('لا جسرَ بعد'))) + '</span></div></div>';
  return '<div class="wt-back" data-ovclose="1"></div>'
    + '<div class="pop wt-sheet" role="dialog" aria-label="' + esc(t('عرض النظرة العامة')) + '">'
    + '<div class="pop-head"><div><h3 style="margin:0">' + esc(t('عرض النظرة العامة')) + ' - <bdi>' + esc(code) + '</bdi></h3><div class="hint" style="margin:2px 0 0">' + esc(x.name || x.id) + '</div></div>'
    + '<button type="button" class="btn btn-quiet btn-sm pop-x" data-ovclose="1" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">' + body + '</div></div>';
}
