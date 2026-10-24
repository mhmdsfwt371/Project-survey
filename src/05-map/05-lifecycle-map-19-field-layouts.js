/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-19-field-layouts.js
   DOMAIN  : Map — the sensors' field layouts (what is really installed, from the team on site)
   PURPOSE : (V39.22) owner, with the R&D team's photos of the demo camp (Mina 74B, signpost 38/56): «دول فعليًّا اللي
             موجودين في المخيم ده — ومحتاج أضيف وأمسح وأعدّل براحتي». A camp's sensors start as the planning layer
             (twelve per camp, V25.7); what the team actually installed lives in layers/iot-field-1448.json, by camp:
             positions, each with its devices (model and the label written on the device). In the camp's sensors
             editor a banner offers «طبّق المواقع الفعلية»: the field devices replace the planned sensors in the
             editor (the gateway stays as it is), then the normal «احفظ» writes them with the event log — the app
             never writes them by itself. After that every device is added, moved, edited or deleted as before.
   DEFINES : iotFieldLoad, iotFieldOf, iotFieldGate, iotFieldEntrances, iotFieldCount, iotFieldApply, iotFieldBanner
   PREFIX  : iotField   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : iotFieldLoad.d (the file once loaded) — on the function, no new global.
   ============================================================================ */

function iotFieldLoad(){
  if (iotFieldLoad.d || iotFieldLoad.busy || typeof fetch !== 'function') return Promise.resolve(iotFieldLoad.d || null);
  iotFieldLoad.busy = true;
  return fetch('layers/iot-field-1448.json').then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){ iotFieldLoad.busy = false; iotFieldLoad.d = d || { camps:{} }; if (typeof tentPaint === 'function'){ tentPaint.cache = {}; tentPaint(); } if (typeof dtwPaint === 'function') dtwPaint(); if (IOT.edit) render(1); return iotFieldLoad.d; })   /* the tents' gates and the box's devices follow the file */
    .catch(function(e){ iotFieldLoad.busy = false; LS_ERR = e; return null; });
}
function iotFieldOf(id){ var d = iotFieldLoad.d; return (d && d.camps && d.camps[id]) || null; }
/* (V39.23) the camp's main entrance (the box with the gateway, router, reader and camera) and all its entrances */
function iotFieldGate(id){ var F = iotFieldOf(id); return F && F.gate && F.gate.at ? [+F.gate.at[0], +F.gate.at[1]] : null; }
function iotFieldEntrances(id){ var F = iotFieldOf(id); return (F && F.entrances || []).filter(function(e){ return e && e.at; }); }
function iotFieldCount(F){ var n = 0; (F && F.spots || []).forEach(function(s){ n += (s.dev || []).length; }); return n; }

/* the field devices replace the editor's sensors — ids by position (S01, S02 … in position order), status installed */
function iotFieldApply(){
  var E = IOT.edit, F = E && iotFieldOf(E.id); if (!F) return false;
  var S = [], M = [], k = 0;
  (F.spots || []).slice().sort(function(a, b){ return a.n - b.n; }).forEach(function(sp){
    (sp.dev || []).forEach(function(dv){
      k++; S.push([+dv.at[0], +dv.at[1]]);
      M.push({ id:E.id + '-S' + iotPad(k), status:'مُركّب', model:dv.model || '', tag:dv.tag || '', note:t('الموقع') + ' ' + sp.n, field:1 });
    });
  });
  if (!S.length) return false;
  E.sensors = S; E.sm = M; E.sel = null; E.fieldAt = Date.now();
  /* (V39.23) owner: «الجيت واي في بداية المخيم في البوكس مع الراوتر والريدر والكاميرا، والمدخل اللي على الشارع» */
  if (F.gate && F.gate.at){ E.gw = [+F.gate.at[0], +F.gate.at[1]]; E.gm[0] = Object.assign({}, E.gm[0] || {}, { status:'مُركّب', note:t(F.gate.box || ''), field:1 }); }
  iotPaint(); render(1);
  toast(t('وُضعت الأجهزةُ الفعلية في المحرّر — راجعها ثم اضغط «احفظ»'));
  return true;
}
/* the banner in the editor while the camp has a field layout its plan does not yet carry */
function iotFieldBanner(E){
  if (!E) return '';
  var F = iotFieldOf(E.id); if (!F){ iotFieldLoad(); return ''; }
  var gwOff = F.gate && F.gate.at && E.gw && iotM(E.gw, F.gate.at) > 1.5;   /* (V39.23) a plan saved before the gate was known */
  if (E.sm.some(function(m){ return m && m.field; }) && !gwOff) return '';
  return '<div class="hint" style="margin:6px 0;padding:8px 10px;border:1px dashed var(--line);border-radius:10px">\u{1F4CD} '
    + esc(t('مواقع الأجهزة الفعلية من الميدان متاحة')) + ': <b class="num">' + nm(iotFieldCount(F)) + '</b> ' + esc(t('جهازًا في')) + ' <b class="num">' + nm((F.spots || []).length) + '</b> ' + esc(t('مواقع'))
    + '<br><span style="opacity:.85">' + esc(t(F.src || '')) + '</span>'
    + '<div class="actions" style="margin-top:6px">' + btn('\u2714 ' + t('طبّق المواقع الفعلية'), 'btn-secondary btn-sm', ' data-iotfield="1"') + '</div></div>';
}
