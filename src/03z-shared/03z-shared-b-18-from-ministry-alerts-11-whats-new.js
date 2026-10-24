/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-18-from-ministry-alerts-11-whats-new.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : What's-new sheet and the survey-edit panel wrapper: whatsNewMaybe decides once per update whether to show the release lines (engineer and up); the release-notes log itself ships in app-office.js (V38.51) and the sheet waits for it through nskChunkReady.
   DEFINES : whatsNewMaybe, wnHtml, pwHtml
   GLOBALS : WN
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
var WN = null;


function whatsNewMaybe(){
  var cur = appVer(); if (!cur) return false;
  /* (V28.0) قرارُ المالك: رسالةُ «ما الجديد» للمهندس فما فوق — الوزارةُ والميدانُ لا تُزاحَم بها */
  if (typeof ROLE === 'undefined' || typeof rankOf !== 'function' || rankOf(ROLE) < rankOf('engineer')){ lsSet('nsk14.seenVer', cur); return false; }
  var seen = lsGet('nsk14.seenVer') || '';
  if (!seen){ lsSet('nsk14.seenVer', cur); return false; }     /* أوّلُ تثبيت: لا رسالة */
  if (seen === cur) return false;
  /* (V38.51) the release-notes log lives in app-office.js (107 KB raw): if it has not landed yet, ask again when it does */
  if (typeof releaseNotesSince !== 'function'){ whatsNewMaybe.pending = true; return false; }
  var list = releaseNotesSince(seen, cur);
  /* (V39.11) an English or Urdu screen shows only the notes that have their language — a release without any is left out,
     and a sheet with nothing to say is not shown (the owner: no Arabic on the English screen) */
  if (LANG !== 'ar') list = list.map(function(r){ return Object.assign({}, r, { notes:r.notes.filter(function(x){ return t(x) !== x; }) }); }).filter(function(r){ return r.notes.length; });
  /* لا سطورَ أحدثَ مما رآه: يُسجَّل بلا رسالة */
  if (!list.length){ lsSet('nsk14.seenVer', cur); return false; }
  WN = { v:cur, r:list[0], list:list, seen:seen };
  return true;
}

function wnHtml(){
  if (!WN) return '';
  return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:94">'
    + '<div class="pop" style="width:min(520px,94vw)">'
    + '<div class="pop-head"><div><h3>\u2728 ' + esc(t('ما الجديد في هذا التحديث')) + ' \u2014 ' + esc(typeof verShow === 'function' ? verShow(WN.v) : WN.v) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(WN.r.d) + ' \u00b7 ' + esc(t('تظهر مرةً واحدةً بعد التحديث')) + '</p></div>'
    +   btn('\u2715','btn-quiet btn-sm',' data-wnx="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
    + '<div class="pop-body">'
    +   (WN.list || [WN.r]).map(function(r, i){
          return (i > 0 || (WN.list || []).length > 1 ? '<div class="hint" style="margin:' + (i ? '10px' : '0') + ' 0 4px;font-weight:700">' + esc(typeof verShow === 'function' ? verShow(r.v) : r.v) + ' \u00b7 ' + esc(r.d) + '</div>' : '')
            + '<ul style="margin:0;padding:0 18px 0 0;line-height:1.8">' + r.notes.map(function(x){ return '<li dir="auto">' + esc(t(x)) + '</li>'; }).join('') + '</ul>';   /* (V39.11) in the screen's language */
        }).join('')
    +   '<div class="actions" style="margin:12px 0 0">' + btn('\u2713 ' + t('فهمت'),'btn-primary',' data-wnx="1"') + '</div></div></div></div>';
}

function pwHtml(){
  if (!PW) return '';
  var f = PW.forced;
  return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:center;'
    + 'justify-content:center;background:rgba(0,0,0,.6);z-index:95">'
    + '<div class="pop" style="width:min(440px,94vw)">'
    + '<div class="pop-head"><div><h3>' + esc(t(f ? 'بدّل كلمتَك المؤقتة' : 'تغيير كلمة المرور')) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(t(f
        ? 'الكلمةُ التي على الورقة مؤقتةٌ يعرفها من طبعها — اختر كلمتَك أنت ولا تُغلَق هذه النافذةُ حتى تفعل.'
        : 'عشرةُ أحرفٍ فأكثر — ولا يعرفها أحدٌ سواك.')) + '</p></div>'
    +   (f ? '' : btn('\u2715','btn-quiet btn-sm',' data-pwx="0" aria-label="' + esc(t('إغلاق')) + '"')) + '</div>'
    + '<div class="pop-body">'
    +   ((f && !PW.needOld) ? '' : '<div class="field"><label>' + esc(t(f ? 'الكلمةُ المؤقتة (التي على الورقة)' : 'الكلمةُ الحالية')) + '</label>'
                 + '<input id="pw0" type="password" dir="ltr" autocomplete="current-password"></div>')
    +   '<div class="field"><label>' + esc(t('الكلمةُ الجديدة')) + '</label>'
    +     '<input id="pw1" type="password" dir="ltr" autocomplete="new-password" placeholder="' + esc(t('عشرةُ أحرفٍ فأكثر')) + '"></div>'
    +   '<div class="field"><label>' + esc(t('أعِدْها')) + '</label>'
    +     '<input id="pw2" type="password" dir="ltr" autocomplete="new-password"></div>'
    + '</div>'
    + '<div class="pop-foot">' + btn('\u{1F511} ' + t('بدّل الكلمة'),'btn-primary',' data-pwgo="1"') + '</div>'
    + '</div></div>';
}
