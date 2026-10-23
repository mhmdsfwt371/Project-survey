/* (V38.90) moved by scripts/split-late.mjs from src/03-survey/03-survey-records-07-demo-single-errors.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
/* الاعتمادُ القياسيُّ = نمطُ قطعٍ باسمٍ يظهر في «نمطٌ جاهز» عند حلِّ التركيب لكلِّ نقطة */
function demoStdSave(id){
  if (!may('settings')){ toast(t('حفظُ الأنماط للمهندس وحده')); return; }
  var x = siteFind(id), ins = STATE.inss[id]; if (!x || !ins || !Object.keys(ins.parts || {}).length) return;
  var def = t('قياسي') + ' \u2014 ' + t(x.type || '') ;
  var name = prompt(t('اسمُ النمط القياسيّ'), def); if (name == null) return;
  name = String(name).trim(); if (!name){ toast(t('اكتب اسمًا للنمط')); return; }
  var items = {}; Object.keys(ins.parts).forEach(function(k){ if (cfgN(ins.parts[k]) > 0) items[k] = cfgN(ins.parts[k]); });
  var L = patList().filter(function(p){ return p.n !== name; });
  L.push({ n:name, items:items, by:STATE.meta.name || '', at:Date.now(), from:id, rev:insRevs(ins).length + 1 });
  STATE.patterns = L; CORE.set('cfg', 'patterns', L.slice());
  logEvent('اعتمادُ تجهيزة ديمو قياسيّة — ' + id + ' · تجهيزة ' + (insRevs(ins).length + 1) + ' · ' + name, id);
  toast(t('اعتُمدت قياسيّة — تظهر في «نمطٌ جاهز»') + ' \u00b7 ' + name); render(1);
}

/* (V38.69) one movement, one ledger document — on this phone and in the cloud alike */
function mvWrite(m){
  if (!m || !m.id) m = Object.assign({ id:uid36() }, m || {});
  STATE.moves = STATE.moves || [];
  if (STATE.moves.some(function(x){ return x && x.id === m.id; })) return m;   /* the same settlement written twice is one */
  if (!m.user) m.user = STATE.meta.name || '';
  STATE.moves.push(m); CORE.dirty('moves', m.id, m);
  return m;
}

/* (V38.69) the office brings the ledger level with what is installed: every live installation consumes what it holds — the ones
   saved before V38.69 never reached the cloud ledger. Net and idempotent: run twice, writes once. */
function insLedgerSettle(){
  if (!may('inventory')){ toast(t('تسويةُ دفتر المخزن لصاحب صلاحية المخزون')); return 0; }
  var n = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var r = STATE.inss[id]; if (!r || r.deleted || !r.status || insStatusIs(r.status, 'مسودّة')) return;
    var held = insStatusIs(r.status, 'متعذّر') ? {} : (r.parts || {}), res = insConsume(id, held, r.by || '—');
    n += Object.keys(res.take).length + Object.keys(res.back).length;
  });
  logEvent('تسوية دفتر المخزن مع التركيبات — ' + n + ' حركة');
  toast(t('سُوِّي الدفتر مع التركيبات') + ' — ' + nm(n) + ' ' + t('حركة'));
  return n;
}

function insConsumed(site){
  var c = {};
  movesList().forEach(function(m){
    if (!m || m.site !== site) return; var q = cfgN(m.qty), it = m.item; if (!q || !it) return;
    if (m.kind === 'استهلاك') c[it] = (c[it] || 0) + q;
    else if (m.kind === 'تصحيح استهلاك') c[it] = (c[it] || 0) - q;
    else if ((m.kind === 'إرجاع' || m.kind === 'شطب') && (m.dis || /^فك /.test(m.note || ''))) c[it] = (c[it] || 0) - q;
  });
  return c;
}

function insConsume(site, held, who){
  var had = insConsumed(site), all = {}, take = {}, back = {};
  Object.keys(had).concat(Object.keys(held || {})).forEach(function(k){ all[k] = 1; });
  Object.keys(all).forEach(function(k){ var d = (cfgN((held || {})[k]) || 0) - (had[k] || 0); if (d > 0) take[k] = d; else if (d < 0) back[k] = -d; });
  var ts = Date.now();   /* (V38.63) the instant too — the ledger is read in time order */
  /* (V38.69) each movement is its own ledger document. It was pushed on this phone only and one summary keyed by the point
     ({take,back}) went to the cloud — which the office reads as a movement without a kind and ignores: no installation (and no
     dismantling) ever reached the office ledger, so the warehouse never went down by what was installed. The id is fixed by
     point, item and how many movements that pair already has — two devices settling the same state write the same document. */
  var nOf = function(k){ return movesList().filter(function(m){ return m && m.site === site && itemKey(m.item) === itemKey(k); }).length; };
  Object.keys(take).forEach(function(k){ mvWrite({ id:'ic-' + site + '-' + k + '-' + nOf(k), at:dayKey(), ts:ts, kind:'استهلاك', item:k, qty:take[k], by:who || STATE.meta.name || '—', site:site, cond:'' }); });
  Object.keys(back).forEach(function(k){ mvWrite({ id:'ir-' + site + '-' + k + '-' + nOf(k), at:dayKey(), ts:ts, kind:'تصحيح استهلاك', item:k, qty:back[k], by:who || STATE.meta.name || '—', site:site, cond:'', note:'تعديل تركيب' }); });
  return { take:take, back:back };
}

function insSave(draft){
  var s = formSite();
  if (!s){ toast(t('اختر النقطةَ أوّلًا — لا يُحفَظ تركيبٌ بلا نقطته')); return; }   /* (V38.68) */
  if (!draft && !FORM.status){ toast(t('حدّد حالة التركيب أولًا')); return; }
  /* (V37.80) مسودّةٌ على نقطة ديمو مركَّبة كانت تمحو التجهيزةَ الحالية وتُخرجها من «المركَّب» — تُمنَع بصراحة */
  if (draft && s.pilot && STATE.inss[s.id] && STATE.inss[s.id].status && STATE.inss[s.id].status !== 'مسودّة'){ toast(t('نقطةُ ديمو مركَّبة: سجّل التجهيزة الجديدة مباشرةً — المسودّةُ تمحو الحالية')); return; }
  if (!draft && (!FORM.photos.before || !FORM.photos.after)){
    toast(t('صورتا قبل وبعد مطلوبتان'));
    return;
  }
  /* الرقمُ التسلسليُّ يعرّف الجهازَ بعينه: تكرارُه داخل النقطة الواحدة يعني
     أن جهازًا سُجّل مرتين أو أن رقمًا نُسخ خطأً — وكلاهما يُفسد العُهدة. */
  var sn = {}, dup = '';
  Object.keys(FORM.serials || {}).forEach(function(k){
    var v = String(FORM.serials[k] || '').trim();
    if (!v) return;
    if (sn[v]) dup = v; else sn[v] = 1;
  });
  if (dup){ toast(t('رقم تسلسليٌّ مكرّر داخل النقطة') + ': ' + dup); return; }
  /* (V38.56) the same serial on another site that was not dismantled is the same device recorded twice — custody breaks.
     Typing it only warned; now the save stops (the engineer may override after confirming, and it is logged) */
  var elsewhere = '';
  Object.keys(sn).forEach(function(v){ if (elsewhere) return; var o = serialOwner(v, s.id); if (o && !disDone(o)) elsewhere = v + ' \u2192 ' + o; });
  if (elsewhere){
    if (!(may('approve') && typeof confirm === 'function' && confirm(t('هذا الرقمُ مسجَّلٌ على نقطةٍ أخرى') + ': ' + elsewhere + ' — ' + t('سجّله هنا على أيِّ حال؟')))){
      toast(t('رقمٌ تسلسليٌّ مسجَّلٌ على نقطةٍ أخرى لم تُفَكّ') + ': ' + elsewhere + ' — ' + t('صحّحه، أو يفكّه المهندسُ من هناك أوّلًا')); return;
    }
    logEvent('سيريالٌ مكرَّرٌ بموافقة المهندس — ' + elsewhere + ' \u2192 ' + s.id, s.id);
  }
  var used = {}, n = 0;
  Object.keys(FORM.parts).forEach(function(k){
    var q = cfgN(FORM.parts[k]);
    if (q > 0){ used[k] = q; n += q; }
  });
  if (!draft && !n && !insStatusIs(FORM.status, 'متعذّر')){ toast(t('سجّل القطع المستهلكة أولًا')); return; }   /* (V38.62) «متعذّر» installs nothing */

  /* (V37.78) نقطةُ الديمو: ما رُكِّب قبلُ يُحفَظ تجهيزةً سابقة، ويُستهلَك الفرقُ الزائدُ وحدَه */
  var prevIns = STATE.inss[s.id], keepRev = !!(s.pilot && prevIns && !prevIns.deleted && prevIns.status && prevIns.status !== 'مسودّة' && !draft);
  var nIns = {
    id:s.id, status: draft ? 'مسودّة' : FORM.status,
    by:STATE.meta.name || '', at:Date.now(),
    parts:used, serials:FORM.serials, prefix:FORM.prefix, pts:formPts(),
    approved:false, photos:Object.keys(FORM.photos)
  };
  if (s.pilot && prevIns && insRevs(prevIns).length) nIns.revs = insRevs(prevIns).slice(-30);
  if (keepRev) nIns.revs = insRevs(prevIns).concat([insRevSnap(prevIns)]).slice(-30);
  CORE.set('inss', s.id, nIns);
  /* (V38.57) the upload merges into the cloud document (which keeps the approved solution); the local copy keeps it too —
     it was dropped on the installer's device, so the site looked «without an approved solution» there after saving */
  if (prevIns && (prevIns.solution || prevIns.hand)) STATE.inss[s.id] = Object.assign({}, nIns, prevIns.solution ? { solution:prevIns.solution } : {}, prevIns.hand ? { hand:prevIns.hand } : {});
  Object.keys(FORM.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(s.id, (s.pilot ? 'ins_r' + (insRevs(nIns).length + 1) + '_' + k : 'ins_' + k), FORM.photos[k].data);   /* (V37.79) */
  });
  /* استهلاكُ القطع يدخل دفتر الحركة — فلا يُخصَم المخزونُ مرتين */
  if (!draft) insConsume(s.id, insStatusIs(FORM.status, 'متعذّر') ? {} : used, STATE.meta.name || '—');   /* (V38.62) net, per point */
  logEvent((draft ? 'مسودّة تركيب' : (keepRev ? 'تجهيزةُ ديمو ' + (insRevs(nIns).length + 1) : 'تركيب')) + ' — ' + s.id + ' · ' + nm(formPts()) + ' نقطة');
  /* (V38.60) the record goes into the point's chat: the office reads what was installed and the serials as they are saved */
  if (!draft && typeof chSystem === 'function') chSystem(s.id, (keepRev ? 'تجهيزةٌ جديدة' : insStatusIs(FORM.status, 'قيد التركيب') ? 'بدأ التركيب' : insStatusIs(FORM.status, 'متعذّر') ? 'تعذّر التركيب' : 'اكتمل التركيب') + ' — ' + (STATE.meta.name || '') + ' \u00b7 ' + Object.keys(used).map(function(k){ var sn2 = (FORM.serials || {})[k]; return itemName(k) + ' \u00d7' + nm(used[k]) + (sn2 ? ' (' + sn2 + ')' : ''); }).join('، ') + ' \u00b7 ' + nm(Object.keys(FORM.photos).length) + ' ' + t('صورة'), '');
  if (!draft) stepDone('install', s.id, nm(n) + ' ' + t('قطعة'), formPts());
  toast(draft ? t('حُفظت مسودّة') : (t('تركيبٌ حُفظ — بانتظار التدقيق')));
  formReset();
  render();
}

/* ═══ نموذجٌ لنقطةٍ واحدة (V17.22) ═══
   النموذجُ كائنٌ واحدٌ يُعاد استعمالُه لكلِّ نقطة، وصورُه فيه. وتبديلُ النقطة
   كان يكتب FORM.site ولا يمسح ما قبلَه — فمن فتح نقطةً وصوّرها ولم يحفظ، ثم
   فتح غيرَها وحفظ، ذهبت صورُ الأولى إلى الثانية. هكذا صعدت صورُ ممرات منى
   إلى مخيمٍ في عرفات. فصار تبديلُ النقطة يمسح ما لم يُحفَظ، ويُقال ذلك. */
function formGo(id, why){
  id = String(id || '');
  if (FORM.site && FORM.site !== id){
    var n = Object.keys(FORM.photos || {}).length;
    if (typeof svDraftClear === 'function') svDraftClear();   /* (V25.9) تبديلُ النقطة يُسقط مسودةَ الأولى */
    formReset();
    if (n) toast(nm(n) + ' ' + t('صورةً لم تُحفَظ — أُلغيت مع تبديل النقطة'));
  }
  FORM.site = id;
  /* لحظةُ الفتح: ما وصل بعدها من غيري على النقطة نفسِها يُسأل عنه قبل الحفظ (V17.79) */
  FORM.openedAt = Date.now(); FORM.overwrite = false;
  if (why === 'new') formReset();
}

function svCopyFrom(id){
  var r = STATE.recs[id]; if (!r){ toast(t('لا زيارة')); return; }
  var n = 0; SV_COPY_KEYS.forEach(function(k){ if (r[k] != null && r[k] !== '' && (FORM[k] == null || FORM[k] === '')){ FORM[k] = r[k]; n++; } });
  if (typeof SVD === 'object' && SVD) SVD.dirty = true; try { svDraftSoon(); } catch (e){ LS_ERR = e; }
  toast(n ? t('نُسخ') + ' ' + nm(n) + ' ' + t('حقلًا من') + ' ' + id + ' \u2014 ' + t('راجعها قبل الحفظ') : t('لا حقولَ فارغةً تُنسَخ'));
}

function formReset(){
  FORM.mount = FORM.power = FORM.height = FORM.cable = FORM.note = FORM.prefix = '';
  FORM.chals = []; FORM.photos = {}; FORM.parts = {}; FORM.serials = {};
  FORM.status = ''; FORM.access = 'تم الوصول'; FORM._pre47 = ''; FORM._pre47msg = '';   /* (V37.90) */
  SV_EXTRA_KEYS.forEach(function(k){ FORM[k] = ''; });
}
