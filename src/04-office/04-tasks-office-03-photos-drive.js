/* ============================================================================
   FILE    : src/04-office/04-tasks-office-03-photos-drive.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Photos: Google Drive bridge, naming, upload to the database then server move to Drive, who uploaded/viewed/deleted, open/download in app, and plain-language transfer failures.
   DEFINES : photoSeen, photoCount, drvSave, drvTest
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
PV.SEEN_TODAY = {};
function photoSeen(id){
  var day = dayKey();
  var k = day + '|' + (STATE.meta.uid || STATE.meta.name || '?') + '|' + id;
  if (PV.SEEN_TODAY[k]) return;
  PV.SEEN_TODAY[k] = 1;
  logEvent('اطّلاع على صورة — ' + id, id);
}

/* صورُ موقعٍ بعينه — تُعرَض حيث يُقرَّر: في تفصيل النقطة وفي التدقيق */

/* ═══ صورُ النقطة — أين هي الآن ═══
   «رفعت نقاطًا وصورًا — فين الصور؟». الصورةُ تمرُّ بثلاث محطات: طابورُ الجهاز
   (لم تُرفَع بعد)، ثم وثيقتُها في القاعدة بصورتها (ينقلها الخادمُ)، ثم الدرايفُ
   برابطٍ والصورةُ تُمحى من القاعدة. المعرضُ يعرض كلَّ صورةٍ حيث هي بشارتها —
   فيُرى أنها سُجّلت على الدرايف أو أين وقفت. */

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

