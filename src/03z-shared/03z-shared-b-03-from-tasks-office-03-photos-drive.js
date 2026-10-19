/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-03-from-tasks-office-03-photos-drive.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-03-photos-drive.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : photoFind, photoDownload, photoView
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
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
