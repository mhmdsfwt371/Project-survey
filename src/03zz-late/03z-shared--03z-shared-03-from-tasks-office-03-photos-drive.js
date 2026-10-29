/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-03-from-tasks-office-03-photos-drive.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-03-from-tasks-office-03-photos-drive.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : photoDelete, phErr, photoGalleryHtml, phRestore
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* الحذفُ للمهندس وحده، وأثرُه يبقى: الوثيقةُ تُوسَم محذوفةً ولا تُمحى،
   فيبقى مكتوبًا أن صورةً كانت هنا ومن أزالها ولماذا. وملفُّ درايف يُحذَف
   فعلًا — فالصورةُ الخاطئةُ لا تُترَك تُرى. */
function photoDelete(id, why){
  if (!mayPhotoEdit()){ toast(t('حذفُ الصور للمشرف فما فوق')); return; }
  var p = (STATE.photos || {})[id];
  if (!p){ toast(t('لا صورةَ بهذا المعرّف')); return; }
  if (p.del){ toast(t('محذوفةٌ سلفًا')); return; }
  var done = function(){
    var rec = { site:p.site, kind:p.kind, at:p.at, by:p._by || '',
                del:{ by:STATE.meta.name || '', at:Date.now(), why:String(why || '').trim() } };
    STATE.photos[id] = rec;  phTouch();   /* (V37.22) */
    CORE.set('photos', id, rec);
    logEvent('حذف صورة — ' + id + (why ? ' · ' + why : ''), id);
    toast(t('حُذفت الصورة'));
    render(1);
  };
  /* (V42.7) a supervisor's deletion marks the photo deleted — the record and its reason stay — while removing the file from
     Drive stays with the engineer's Drive access (a supervisor's device holds none, and the call would only fail) */
  if (!p.driveId || !may('delete')){ done(); return; }
  drvAuth()
    .then(function(tok){
      return fetch('https://www.googleapis.com/drive/v3/files/' + p.driveId,
        { method:'DELETE', headers:{ Authorization:'Bearer ' + tok } });
    })
    .then(done)
    .catch(function(){
      /* تعذّر حذفُ الملف — يُوسَم السجلُّ ويُقال، ولا يُدَّعى ما لم يقع */
      logEvent('تعذّر حذفُ ملفِّ الصورة من درايف — ' + id, id);
      toast(t('عُلِّمت محذوفةً — وتعذّر حذفُ الملف من درايف'));
      done();
    });
}

function phErr(why){
  var w = String(why || '');
  for (var i = 0; i < PV.PH_ERR.length; i++) if (PV.PH_ERR[i].re.test(w)) return PV.PH_ERR[i];
  return { s:w.slice(0, 60) || 'تعذّر النقل', fix:'' };
}

function photoGalleryHtml(siteId){
  var L = photosOf(siteId), Q = PHOTO_Q.filter(function(q){ return q.site === siteId; }), Fq = PV.PHOTO_FAIL.filter(function(q){ return q.site === siteId; });
  if (!L.length && !Q.length && !Fq.length) return '<p class="hint" style="margin:8px 0 0">' + esc(t('لا صورَ لهذه النقطة على هذا الجهاز ولا في القاعدة.')) + '</p>';
  /* رابطُ العرض على الدرايف يطلب إذنًا ممن لم يُشارَك معه — والتنزيلُ المباشرُ
     (uc?export=download) يعمل لكلِّ من عنده الرابطُ متى شورك الملفُ برابط. وما زال
     في القاعدة يُنزَّل من صورته مباشرةً. */
  var tile = function(img, badge, kind, foot, key){
    return '<div class="field" style="margin:0">'
      + (img ? '<img src="' + esc(img.src) + '" alt="" data-phview="' + esc(key || '') + '" style="width:100%;border-radius:10px;display:block;max-height:260px;object-fit:cover;cursor:zoom-in" loading="lazy">' : '')
      + '<div style="margin-top:6px">' + badge + ' <span class="hint" style="margin:0">' + esc(t(kind || '')) + '</span></div>'
      + (key ? btn('\u2B07 ' + t('تنزيل'),'btn-primary btn-sm',' data-phdl="' + esc(key) + '" style="margin-top:6px"') + ' ' : '')
      + (foot || '') + '</div>';
  };
  var fixes = {};
  var html = '';
  /* لكلِّ نقطةٍ مجلدُها على الدرايف (V16.78) — يفتحه صاحبُ الدرايف ومن شاركه معه؛
     الرابطُ يُعرَض لمن رتبتُه مديرُ المشروع فما فوق فلا يُرسَل الفنيُّ إلى بابٍ مغلق */
  var fold = null; L.forEach(function(x){ if (!fold && x[1] && x[1].folderId) fold = x[1].folderId; });
  if (fold && rankOf(ROLE) >= rankOf('admin'))
    html += '<a class="btn btn-secondary btn-sm" style="margin-top:8px" target="_blank" rel="noopener" href="https://drive.google.com/drive/folders/' + esc(fold) + '">\uD83D\uDCC1 ' + esc(t('مجلد النقطة على الدرايف')) + '</a>';
  html += '<div class="grid cols-2" style="margin-top:8px">';
  L.forEach(function(x){
    var id = x[0], p = x[1];
    if (p.del){ html += tile(null, pill('حُذفت', 'off'), p.kind, '<p class="hint" style="margin:4px 0 0">' + esc(p.del.by || '') + (p.del.why ? ' · ' + esc(p.del.why) : '') + '</p>'); return; }
    if (p.status === 'done' || p.link){
      var th = p.driveId ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(p.driveId) + '&sz=w600' : '';
      html += tile(th ? { src:th } : null, pill('على الدرايف ✓', 'ok'), p.kind,
        '<a class="btn btn-secondary btn-sm" style="margin-top:6px" target="_blank" rel="noopener" href="' + esc(p.link || '#') + '" data-pview="' + esc(id) + '">' + esc(t('افتح على الدرايف')) + '</a>'
        + (((typeof mayDeleteFinal === 'function' && mayDeleteFinal()) || (p.by && p.by === STATE.meta.name)) ? ' ' + btn('\u{1F5D1} ' + t('احذف الصورة'), 'btn-quiet btn-sm', ' data-phdel="' + esc(id) + '" style="color:#E05252;margin-top:6px"') : ''), id);   /* (V37.17) طلبُ المالك: حذفُ صورةٍ رُفعت خطأً */
    } else if (p.status === 'error'){
      var e1 = phErr(p.why); if (e1.fix) fixes[e1.s] = e1.fix;
      html += tile(p.data ? { src:p.data } : null, pill('خطأ في النقل', 'bad'), p.kind, '<p class="hint" style="margin:4px 0 0">' + esc(t(e1.s)) + '</p>', p.data ? id : '');
    } else {
      html += tile(p.data ? { src:p.data } : null, pill('في القاعدة — ينقلها الخادم إلى الدرايف', 'wrn'), p.kind, '', p.data ? id : '');
    }
  });
  Q.forEach(function(q, qi){ html += tile(q.data ? { src:q.data } : null, pill('في طابور هذا الجهاز — لم تُرفَع بعد', 'wrn'), q.kind, '', q.data ? ('q' + PHOTO_Q.indexOf(q)) : ''); });
  Fq.forEach(function(q){
    var e2 = phErr(q.why); if (e2.fix) fixes[e2.s] = e2.fix;
    html += tile(q.data ? { src:q.data } : null, pill('تعذّر رفعُها', 'bad'), q.kind, '<p class="hint" style="margin:4px 0 0">' + esc(t(e2.s)) + '</p>', q.data ? ('f' + PV.PHOTO_FAIL.indexOf(q)) : '');
  });
  html += '</div>';
  /* لافتةٌ واحدةٌ فوق المعرض: السببُ وما يُفعَل — بدل تكرارِ نصِّ جوجل تحت كلِّ صورة */
  var ks = Object.keys(fixes);
  if (ks.length) html = ks.map(function(k){
    return '<div class="alert warn" style="margin:8px 0 0"><span><b>' + esc(t(k)) + '</b><br>'
      + esc(t(fixes[k])).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</span></div>';
  }).join('') + html;
  return html;
}

/* (V38.74) a deleted photo comes back — by the project's management (admin and above). The deletion stays in the record
   («was»), del becomes null so every phone's merged copy loses it. Mina 0449's two visit photos were deleted on 21 Oct
   together with old installation photos; this is how such a slip is undone without a developer. */
function phRestore(id){
  if (rankOf(effRole(ROLE)) < rankOf('admin')){ toast(t('استرجاعُ الصور لإدارة المشروع')); return false; }
  var p = (STATE.photos || {})[id]; if (!p || !p.del) return false;
  var np = Object.assign({}, p, { del:null, restored:{ by:STATE.meta.name || '', at:Date.now(), was:p.del } }); delete np.data;
  STATE.photos[id] = np; CORE.set('photos', id, np); phTouch();
  logEvent('استرجاع صورة — ' + id + ' · حذفها ' + ((p.del || {}).by || '') + ' ' + fmtDT((p.del || {}).at), p.site);
  toast(t('استُرجعت الصورة')); return true;
}
