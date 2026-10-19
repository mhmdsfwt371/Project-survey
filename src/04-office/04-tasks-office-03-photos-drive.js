/* ============================================================================
   FILE    : src/04-office/04-tasks-office-03-photos-drive.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Photos: Google Drive bridge, naming, upload to the database then server move to Drive, who uploaded/viewed/deleted, open/download in app, and plain-language transfer failures.
   DEFINES : drvCfg, drvLoad, drvAuth, dataToBlob, drvUpload, photoNext, photoQueue, photoFlush, photoFlushCloud, photoSeen, photoDelete, phIdx, phTouch, photosOf … (+9 more)
   GLOBALS : DRV, PHOTO_Q, SEEN_TODAY, PH_IDX, PH_VER, PH_ERR
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ الصورُ: من رفع، ومن شاهد، ومن حذف ═══
   الصورةُ حجّةٌ يُعتمَد بها تركيبٌ ويُصرَف بها مال. فمن يحذفها يجب أن يُعرَف،
   ومن يراها يجب أن يُسجَّل — لا مراقبةً للناس بل لأن الوزارةَ تسأل «من اطّلع
   على هذا؟» ولا يصلح جوابًا «لا نعلم». */

/* المشاهدةُ تُسجَّل مرةً لكلِّ صورةٍ لكلِّ مستخدمٍ في اليوم: لو سُجّلت كلَّ
   فتحةٍ لأغرقت الحصةَ في يوم، ولو لم تُسجَّل لضاع الأثر. */
var SEEN_TODAY = {};
function photoSeen(id){
  var day = dayKey();
  var k = day + '|' + (STATE.meta.uid || STATE.meta.name || '?') + '|' + id;
  if (SEEN_TODAY[k]) return;
  SEEN_TODAY[k] = 1;
  logEvent('اطّلاع على صورة — ' + id, id);
}

/* صورُ موقعٍ بعينه — تُعرَض حيث يُقرَّر: في تفصيل النقطة وفي التدقيق */

/* ═══ صورُ النقطة — أين هي الآن ═══
   «رفعت نقاطًا وصورًا — فين الصور؟». الصورةُ تمرُّ بثلاث محطات: طابورُ الجهاز
   (لم تُرفَع بعد)، ثم وثيقتُها في القاعدة بصورتها (ينقلها الخادمُ)، ثم الدرايفُ
   برابطٍ والصورةُ تُمحى من القاعدة. المعرضُ يعرض كلَّ صورةٍ حيث هي بشارتها —
   فيُرى أنها سُجّلت على الدرايف أو أين وقفت. */
/* ═══ الصورةُ تُفتَح وتُنزَّل داخل التطبيق ═══
   كان الرابطُ href="data:image/jpeg;base64,…" — ومتصفّحُ الآيفون يرفض الانتقالَ
   إلى عنوانِ data فيفتح صفحةً بيضاءَ عنوانُها «data:»، ولا يُنزِّل شيئًا مع
   السمة download. فصارت الصورةُ تُفتَح في عارضٍ داخل التطبيق، والتنزيلُ يمرُّ
   بـBlob: مشاركةً إلى «حفظ الصورة» على الجوّال إن أتيحت، وإلا رابطَ تنزيلٍ
   مؤقتًا. وما على الدرايف يُفتَح ويُنزَّل برابطه المعتاد. */
function photoFind(key){
  var p = (STATE.photos || {})[key];
  if (p) return { data:p.data, name:p.name || (key + '.jpg'), driveId:p.driveId, link:p.link };
  var m = /^q(\d+)$/.exec(key);
  if (m){ var q = PHOTO_Q[+m[1]]; if (q) return { data:q.data, name:(q.site + '-' + (q.seq || '') + '.jpg') }; }
  var mf = /^f(\d+)$/.exec(key);
  if (mf){ var qf = PHOTO_FAIL[+mf[1]]; if (qf) return { data:qf.data, name:(qf.site + '-' + (qf.seq || '') + '.jpg') }; }
  return null;
}
function photoDownload(key){
  var p = photoFind(key); if (!p){ toast(t('لا صورة')); return; }
  if (p.data){
    var b = dataToBlob(p.data);
    if (!b){ toast(t('تعذّر تجهيزُ الصورة')); return; }
    var file = null;
    try { file = new File([b], p.name, { type:b.type }); } catch (e){ LS_ERR = e; }
    if (file && navigator.canShare && navigator.canShare({ files:[file] })){
      navigator.share({ files:[file] }).catch(function(e){ if (!/abort/i.test(String(e && e.name))) dl(b, p.name); });
      return;
    }
    if (!dl(b, p.name)) toast(t('تعذّر التنزيل'));
    return;
  }
  if (p.driveId){ window.open('https://drive.google.com/uc?export=download&id=' + encodeURIComponent(p.driveId), '_blank', 'noopener'); return; }
  toast(t('لا صورة'));
}
function photoView(key){
  var p = photoFind(key); if (!p) return;
  var src = p.data || (p.driveId ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(p.driveId) + '&sz=w1600' : '');
  if (!src) return;
  var old = document.getElementById('phView'); if (old) old.remove();
  var box = document.createElement('div'); box.id = 'phView';
  box.style.cssText = 'position:fixed;inset:0;z-index:5000;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:14px';
  box.innerHTML = '<img src="' + esc(src) + '" alt="" style="max-width:100%;max-height:78vh;border-radius:12px;object-fit:contain">'
    + '<div class="actions">'
    + '<button type="button" class="btn btn-primary btn-sm" data-phdl="' + esc(key) + '">\u2B07 ' + esc(t('تنزيل')) + '</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-phclose="1">' + esc(t('إغلاق')) + '</button></div>';
  document.body.appendChild(box);
  box.addEventListener('click', function(ev){ if (ev.target === box) box.remove(); });
}

function photoCount(siteId){
  return photosOf(siteId).filter(function(x){ return !x[1].del; }).length + PHOTO_Q.filter(function(q){ return q.site === siteId; }).length;
}

function drvSave(){
  var c = (document.getElementById('drvClient') || {}).value || '';
  var f = (document.getElementById('drvFolder') || {}).value || '';
  try{
    lsSet('nsk14.drv.client', c.trim());
    lsSet('nsk14.drv.folder', f.trim());
  }catch(e){ LS_ERR = e; }
  DRV.clientId = c.trim(); DRV.folderId = f.trim();
  logEvent('وصل درايف — ' + (c ? 'مُعرَّف' : 'أُفرغ'));
  toast(c ? t('حُفظ — جرّب الإذن') : t('أُفرغ الوصل'));
  render(1);
}

function drvTest(){
  if (!drvCfg()){ toast(t('أدخل Client ID أولًا')); return; }
  toast(t('يُطلَب الإذن…'));
  drvAuth().then(function(){
    toast(t('الإذن ممنوح — الصورُ سترفَع'));
    photoFlush();
    render(1);
  }).catch(function(e){
    toast(t('تعذّر الإذن') + ' · ' + String(e.message || e));
  });
}

