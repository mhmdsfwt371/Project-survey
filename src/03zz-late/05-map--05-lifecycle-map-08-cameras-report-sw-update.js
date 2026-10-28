/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-08-cameras-report-sw-update.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-08-cameras-report-sw-update.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : impApply, syncAllNow
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function impApply(){
  var p = PV.IMP_PREVIEW;
  if (!p || !p.ok.length) return 0;
  var n = 0;
  p.ok.forEach(function(r){
    if (p.kind === 'mohu'){ siteOvSet(r.id, { camx:r.camx }); var sx = siteFind(r.id); if (sx) sx.camx = r.camx; n++; return; }   /* (V22.5) */
    if (p.kind === 'items'){
      var id = 'imp_' + (++n);
      cfgSet('itPts', id, r[2]); cfgSet('itPrep', id, r[3]);
      cfgSet('itAsm', id, r[4]); cfgSet('itPrice', id, r[5]);
      itemsList().push({ z:String(r[0]).trim()==='ممر'?'cor':'camp', code:id,
                         name:String(r[1]), pts:0, price:0, prep:0, asm:0 });
    } else if (p.kind === 'sites'){
      var s = siteFind(String(r[0]).trim());
      if (s){ if (r[3]) s.sign = String(r[3]); if (r[4]) s.sq = String(r[4]);
              if (r[5]) s.co = String(r[5]); n++; }
    } else if (p.kind === 'fleet'){
      /* اللوحةُ مفتاحٌ: ما وُجد يُعدَّل وما لم يوجد يُنشَأ */
      var pl = String(r[0] || '').trim();
      if (pl){
        var ex = vehList().filter(function(v){ return v.plate === pl; })[0];
        var kd = vehKinds().filter(function(k){ return k.n === String(r[1] || '').trim(); })[0];
        var vv = ex || { id:'vh' + Date.now().toString(36) + n, plate:pl, st:'متاحة',
                         at:Date.now(), by:STATE.meta.name || '' };
        if (kd) vv.kind = kd.id; else if (!vv.kind) vv.kind = 'sedan';
        if (r[2]) vv.model  = String(r[2]).trim();
        if (r[3]) vv.licExp = String(r[3]).trim();
        if (r[4]) vv.own    = String(r[4]).trim();
        if (r[5]) vv.cost   = +r[5] || 0;
        if (!vv.start) vv.start = todayISO();
        vehSave(vv);
        n++;
      }
    } else if (p.kind === 'users'){
      /* الاستيرادُ يعدّل الموجودَ ولا يُنشئ حسابًا: إنشاءُ الحساب في المصادقة
         لا في القاعدة، والدورُ والحالةُ هما ما تقرؤه القواعد. */
      var uid0 = String(r[0] || '').trim();
      var cur  = (STATE.users || {})[uid0];
      if (uid0 && cur){
        var pt = {};
        if (r[1]) pt.name = String(r[1]).trim();
        if (r[2]){
          var rk = Object.keys(ROLES).filter(function(k){
            return k === String(r[2]).trim() || ROLES[k].n === String(r[2]).trim(); })[0];
          if (rk) pt.role = rk;
        }
        if (r[3]) pt.active = String(r[3]).trim() !== 'معطل';
        if (Object.keys(pt).length){
          STATE.users[uid0] = Object.assign({}, cur, pt);
          CORE.set('users', uid0, STATE.users[uid0]);
          n++;
        }
      }
    } else if (p.kind === 'ips'){
      /* كان يقول «صفًّا حُفظ» ولا يكتب حرفًا — العرضُ بلا كتابةٍ كذب */
      /* الأعمدةُ الأربعةُ كلُّها تُحفَظ: كان يُقرأ العمودُ الثاني وحدَه
         وتُهمَل ثلاثةٌ في الملف، فيُظنُّ أنها حُفظت. */
      var t2 = siteFind(String(r[0]).trim());
      if (t2 && r[1]){
        t2.net = String(r[1]).trim().replace(/\.+$/, '');
        if (r[2]) t2.ipRtr = String(r[2]).trim();
        if (r[3]) t2.ipRdr = String(r[3]).trim();
        if (r[4]) t2.ipCam = String(r[4]).trim();
        n++;
      }
    } else { n++; }
  });
  CORE.dirty(p.kind, 'import', { at:Date.now(), n:n });
  PV.IMP_PREVIEW = null;
  return n;
}

function syncAllNow(){
  if (!may('roles')){ toast(t('لمدير المشروع وحدَه')); return false; }
  if (!FB.ready || !FB.db){ toast(t('يحتاج شبكة')); return false; }
  var n = Date.now();
  CORE.set('cfg', 'app', { syncAll:n, syncAllBy:STATE.meta.name || '', syncAllAt:n });
  PV.SYNC_ALL_SEEN = n;
  logEvent('مزامنةٌ فوريةٌ للجميع');
  toast(t('أُرسل الأمرُ — كلُّ جهازٍ مفتوحٍ يسحب الآن، والمغلقُ حين يُفتَح'));
  SYNC.pullAsk = true; syncCycle();
  return true;
}
