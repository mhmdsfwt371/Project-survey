/* (V38.90) moved by scripts/split-late.mjs from src/02-catalog/02-edit-09-edit-requests.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function gedSave(){
  if (!GED) return false; var R = GED_REG[GED.k], F = gedFind(GED.k, GED.id);
  if (!R || !F) return false;
  if (!gedPerm(R)){ toast(t('التعديلُ لمن يملك هذه القائمة')); return false; }
  var vals = R.f.map(function(f, n){ var el = document.getElementById('gedF' + n), v = el ? String(el.value || '').trim() : ''; return f[2] === 'n' ? (v === '' ? 0 : +v) : v; });
  if (R.req !== false && !vals[0] && vals[0] !== 0){ toast(t('الحقلُ الأوّلُ مطلوب')); return false; }
  var L = R.list(), chg = [];
  if (R.key === '='){ if (vals[0] !== F.x && L.indexOf(vals[0]) > -1){ toast(t('موجودٌ بالفعل')); return false; } L[F.i] = vals[0]; chg.push(R.f[0][1]); }
  else R.f.forEach(function(f, n){ if (String(F.x[f[0]] == null ? '' : F.x[f[0]]) !== String(vals[n])){ F.x[f[0]] = vals[n]; chg.push(f[1]); } });
  if (!chg.length){ GED = null; toast(t('لا تغيير')); return true; }
  if (F.x && typeof F.x === 'object'){ F.x.edAt = Date.now(); F.x.edBy = (STATE.meta && STATE.meta.name) || ''; }
  R.save(GED.id, F.x);
  logEvent('تعديل ' + R.t + ' — ' + GED.id + ' \u00b7 ' + chg.join('، '));
  toast(t('حُفظ التعديل'));
  GED = null; return true;
}

function gdelRun(k, id){
  var R = GDEL_REG[k]; if (!R) return false;
  if (!(typeof may === 'function' && (may(R.may) || may('settings')))){ toast(t('الحذفُ لمن يملك هذه القائمة')); return false; }
  var what = R.run(id); if (!what){ toast(t('لا يُحذَف في حالته الحالية')); return false; }
  logEvent('حذف ' + R.t + ' — ' + what); toast(t('حُذف')); statBump(); return true;
}

/* (V38.16) كلُّ أسئلة الأيام الأربعة عشر في ملفٍّ يُرسَل للمطوِّر — منه تُضاف أنواعُ الأسئلة التي لم يفهمها المساعد */
function assistQXls(){
  var R = AQ.rows || []; if (!R.length){ toast(t('لا أسئلة بعد')); return; }
  var rows = [[t('السؤال'), t('مرات'), t('أشخاص'), t('آخر مرة'), t('الحالة')]];
  R.forEach(function(r){
    var st = knownHits(r.q).length ? t('له حلّ الآن') : (typeof aqAnswer === 'function' && aqAnswer(r.q)) ? t('يُجاب الآن من البيانات') : r.no ? t('بلا جواب') : t('أجاب');
    rows.push([r.q, r.n, r.who, r.last ? new Date(r.last).toISOString().slice(0, 16).replace('T', ' ') : '', st]);
  });
  xlsSheets([[t('أسئلة المساعد'), rows]], 'assistant-questions.xlsx');
}

function catsSave(){
  if (!(typeof may === 'function' && may('settings'))){ toast(t('التصنيفاتُ للمهندس فما فوق')); return false; }
  var out = { why:[], cc:[] }, val = function(a, id){ var e = document.querySelector('[' + a + '="' + id + '"]'); return e ? (e.type === 'checkbox' ? e.checked : String(e.value || '').trim()) : null; };
  document.querySelectorAll('[data-vcn]').forEach(function(inp){
    var id = inp.getAttribute('data-vcn'), p = id.split('|'), kind = p[0], k = p.slice(1).join('|'), n = String(inp.value || '').trim();
    var isNew = CAT_NEW[kind].indexOf(k) > -1; if (isNew && !n) return;
    var supL = String(val('data-vcw', id) || '').split(/\n+/).map(function(l){ l = l.trim(); if (!l) return null; var m = /^(.+?)\s*(?::|：| — | - )\s*(.+)$/.exec(l); return m ? { p:m[1].trim(), s:m[2].trim() } : { p:l, s:'' }; }).filter(Boolean);   /* (V37.14) سطرٌ لكلِّ جهة */
    var o = { k:k, n:n, sup:supL, who:supL.length === 1 && supL[0].s ? supL[0].p + ' — ' + supL[0].s : supL.map(function(x){ return x.p; }).join('، '), off:val('data-vco', id) === false };
    if (kind === 'why') o.photo = val('data-vcp', id) === true;
    out[kind].push(o);
  });
  CFG.cats = out; CAT_NEW = { why:[], cc:[] }; CAT_DRAFT = {}; catCached.why = catCached.cc = null;
  cfgPushSoon('cats'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
  logEvent('تعديل تصنيفات الزيارة والمسح — ' + out.why.length + ' سببًا · ' + out.cc.length + ' تحدّيًا');
  toast(t('حُفظت التصنيفات — تصل كلَّ الأجهزة مع المزامنة')); statBump(); return true;
}
