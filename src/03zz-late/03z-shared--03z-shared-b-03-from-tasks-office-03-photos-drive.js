/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-b-03-from-tasks-office-03-photos-drive.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-b-03-from-tasks-office-03-photos-drive.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : photoFind, photoDownload, photoView
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
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
  if (mf){ var qf = PV.PHOTO_FAIL[+mf[1]]; if (qf) return { data:qf.data, name:(qf.site + '-' + (qf.seq || '') + '.jpg') }; }
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
  /* (V38.77) still on its way to Drive: the raw copy opens in a new tab so it can be saved from there */
  if (!p.driveId){ var raw = phSrc(key, (STATE.photos || {})[key] || p, 1600); if (raw){ window.open(raw, '_blank'); return; } }
  if (p.driveId){ window.open('https://drive.google.com/uc?export=download&id=' + encodeURIComponent(p.driveId), '_blank', 'noopener'); return; }
  toast(t('لا صورة'));
}

function photoView(key){
  var p = photoFind(key); if (!p) return;
  /* (V38.77) owner: «مش عارف أفتح الصور» — a photo still on its way to Drive has no data and no drive id; the thumbnail
     showed it (phSrc reads the raw copy) but the viewer refused it. The viewer reads the same source. */
  var src = phSrc(key, (STATE.photos || {})[key] || p, 1600);   /* the record itself: photoFind trims the status away */
  if (!src){ toast(t('الصورة وصلت وتُنقَل إلى الدرايف — تظهر خلال دقائق')); return; }
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
