/* ============================================================================
   FILE    : src/03z-shared/03z-shared-03-from-tasks-office-03-photos-drive.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-03-photos-drive.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : DRV, drvCfg, drvLoad, drvAuth, dataToBlob, drvUpload, PHOTO_Q, PHOTO_FAIL, photoNext, photoQueue, photoFlush, photoFlushCloud, photoDelete, PH_IDX … (+9 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ جسرُ Google Drive — الصورُ في مساحتك لا في Firestore ═══
   خمسةُ تيرا في درايفك تكفي المشروعَ كلَّه، ووثيقةُ Firestore لا تتجاوز
   ميغابايتًا — فتُرفَع الصورُ هناك ويُحفَظ معرّفُها هنا. */

var DRV = {
  /* يُملأ من الإعدادات — يُنشَأ في Google Cloud Console */
  clientId: '',
  folderId: '',                 /* مجلّدُ المشروع في درايفك */
  scope: 'https://www.googleapis.com/auth/drive.file',
  token: '', exp: 0, ready: false, lib: false
};

function drvCfg(){
  try{
    DRV.clientId = localStorage.getItem('nsk14.drv.client') || '';
    DRV.folderId = lsGet('nsk14.drv.folder') || '';
  }catch(e){ LS_ERR = e; }
  return !!DRV.clientId;
}

/* تُحمَّل مكتبةُ جوجل كسولًا — لا تُطلَب قبل أول رفع */
function drvLoad(){
  if (DRV.lib) return Promise.resolve(true);
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise(function(res){
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload  = function(){ DRV.lib = true; res(true); };
    s.onerror = function(){ res(false); };
    document.head.appendChild(s);
    setTimeout(function(){ if (!DRV.lib) res(false); }, 9000);
  });
}

/* الإذنُ يُطلَب مرةً ويُجدَّد قبل انتهائه بدقيقة */
function drvAuth(){
  if (DRV.token && Date.now() < DRV.exp - 60000) return Promise.resolve(DRV.token);
  if (!drvCfg()) return Promise.reject(new Error('no-client'));
  return drvLoad().then(function(ok){
    if (!ok || !window.google || !google.accounts) throw new Error('no-lib');
    return new Promise(function(res, rej){
      var tc = google.accounts.oauth2.initTokenClient({
        client_id: DRV.clientId,
        scope: DRV.scope,
        callback: function(r){
          if (r && r.access_token){
            DRV.token = r.access_token;
            DRV.exp = Date.now() + (r.expires_in || 3600) * 1000;
            DRV.ready = true;
            res(DRV.token);
          } else rej(new Error('denied'));
        }
      });
      tc.requestAccessToken({ prompt: DRV.token ? '' : 'consent' });
    });
  });
}

/* dataURL إلى Blob — الصورُ مضغوطةٌ أصلًا على الجهاز */
function dataToBlob(d){
  var i = d.indexOf(','), meta = d.slice(0, i);
  var mime = (meta.match(/data:([^;]+)/) || [,'image/jpeg'])[1];
  var bin = atob(d.slice(i + 1));
  var arr = new Uint8Array(bin.length);
  for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
  return new Blob([arr], { type: mime });
}

/* الرفع: وصفٌ ثم محتوى، في طلبٍ واحدٍ متعدّد الأجزاء */
function drvUpload(name, dataUrl){
  return drvAuth().then(function(tok){
    var blob = dataToBlob(dataUrl);
    var meta = { name: name, mimeType: blob.type };
    if (DRV.folderId) meta.parents = [DRV.folderId];
    var fd = new FormData();
    fd.append('metadata', new Blob([JSON.stringify(meta)], { type:'application/json' }));
    fd.append('file', blob);
    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      { method:'POST', headers:{ Authorization:'Bearer ' + tok }, body: fd })
      .then(function(r){ return r.ok ? r.json() : r.json().then(function(e){ throw new Error(e.error && e.error.message || 'upload'); }); })
      .then(function(j){
        /* الملفُ يُولَد خاصًّا بمن رفعه: يراه هو ولا يراه المكتبُ ولا الفنيُّ
           الذي يزور بعده. والفنيُّ لا حسابَ جوجل له أصلًا — فالمشاركةُ
           بالرابط هي السبيلُ الوحيدُ ليُفتَح من داخل التطبيق. */
        return fetch('https://www.googleapis.com/drive/v3/files/' + j.id + '/permissions',
          { method:'POST',
            headers:{ Authorization:'Bearer ' + tok, 'Content-Type':'application/json' },
            body: JSON.stringify({ role:'reader', type:'anyone' }) })
          .then(function(){ return j; })
          .catch(function(){ return j; });   /* رُفعت وإن تعذّرت المشاركة */
      });
  });
}

/* طابورُ الصور: تُحفَظ محليًّا ثم تُرفَع حين تتاح الشبكةُ والإذن.
   وما تعذّر رفعُه لا يُسقَط: كان يُشطَب بعد خمس محاولاتٍ فيبقى السجلُّ بلا
   صورةٍ والصورةُ على جهازٍ واحدٍ لا يعلم بها أحد. صار يُنقَل إلى قائمةٍ
   تُعرَض في شاشة التخزين بزرِّ إعادة، فالفقدُ المعلَنُ يُعالَج والصامتُ لا. */
var PHOTO_Q = [], PHOTO_FAIL = [];

/* ═══ اسمُ الصورة على الدرايف ═══
   كان الاسمُ يحمل النوعَ والوقتَ بالثانية: «NSK-…-0001__site__2026-09-06-14-30-05»
   — لا يُقرأ، ولا تُعرَف صورةُ نقطةٍ من أختها إلا بفتحها. صار اسمَ النقطة
   ورقمًا يزيد: أوّلُ صورةٍ «NSK-…-0001-1» ثم «-2» ثم «-3». فيُفرَز المجلدُ
   بالاسم فتتجاور صورُ النقطة الواحدة مرتَّبةً كما التُقطت.
     والرقمُ يُحسب مما رُفع فعلًا لهذه النقطة وما ينتظر في الطابور — لا من
   عدّادٍ في الذاكرة يبدأ من واحدٍ كلَّما أُغلق التطبيق. */
function photoNext(siteId){
  var n = 0;
  Object.keys(STATE.photos || {}).forEach(function(k){
    var v = STATE.photos[k];
    if (v && v.site === siteId) n++;
  });
  PHOTO_Q.forEach(function(q){ if (q.site === siteId) n++; });
  return n + 1;
}

function photoQueue(siteId, kind, dataUrl){
  var pq = dataUrl ? PHOTO_Q_IX[String(dataUrl).length + ':' + String(dataUrl).slice(-64)] : null;   /* (V30.6) */
  if (pq && photoDupOf(siteId, pq)) toast('\u26A0 ' + t('هذه الصورة تكاد تطابق صورةً سابقةً لنفس النقطة'));
  PHOTO_Q.push({ site:siteId, kind:kind, data:dataUrl, at:Date.now(), tries:0,
                 seq:photoNext(siteId), q:pq || null });
  CORE.saveSoon();
  photoFlush();
}

/* ═══ الصورةُ تصعد إلى القاعدة والخادمُ ينقلها إلى الدرايف ═══
   كان الرفعُ إلى الدرايف من الهاتف نفسِه، ويحتاج معرِّفَ عميلٍ في كلِّ جهازٍ
   وتسجيلَ دخولٍ إلى جوجل من كلِّ فنيّ — ومئةٌ وخمسون هاتفًا لا يُضبَط
   واحدُها بعد الآخر، فبقيت الصورُ في الطوابير. أما الخادمُ فعنده مفتاحُ
   المشروع والدرايفُ مشارَكٌ معه أصلًا (به تُؤخَذ النسخةُ الاحتياطية).
     فصار الهاتفُ يكتب الصورةَ مضغوطةً في وثيقتها بالقاعدة — بلا إعدادٍ ولا
   دخولٍ — والخادمُ يمرُّ كلَّ عشر دقائق: ينقلها إلى مجلد الدرايف باسم النقطة
   ورقمها، ويكتب رابطَها في الوثيقة ويمحو الصورةَ منها فلا تُثقِل القاعدة.
   ومن كان عنده معرِّفُ العميل القديمُ بقي طريقُه يعمل. */
function photoFlush(){
  if (!PHOTO_Q.length || !STATE.meta.online) return Promise.resolve(0);
  if (!drvCfg()) return photoFlushCloud();
  var it = PHOTO_Q[0];
  /* الرقمُ يُثبَّت عند الإدراج ويُعاد حسابُه إن غاب (طابورٌ من نسخةٍ أقدم) */
  var seq = cfgN(it.seq) || (it.seq = photoNext(it.site));
  var nm2 = it.site + '-' + seq + '.jpg';
  return drvUpload(nm2, it.data).then(function(r){
    PHOTO_Q.shift();
    /* في الوثيقة معرّفُ الملف ورابطُه لا الصورةُ نفسها */
    /* المفتاحُ بالرقم لا بالنوع: كانت صورةٌ ثانيةٌ من النوع نفسِه تكتب فوق
       الأولى في السجل — فيبقى الملفان على الدرايف ولا يُعرَف إلا آخرُهما. */
    CORE.set('photos', it.site + '-' + seq, {
      del:null, site:it.site, kind:it.kind, seq:seq, name:nm2,
      driveId:r.id, link:r.webViewLink, at:it.at, q:it.q || null   /* (V30.6) */
    });
    logEvent('رفع صورة — ' + it.site + ' \u00b7 ' + it.kind + ' \u00b7 ' + nm2, it.site);
    if (PHOTO_Q.length) setTimeout(photoFlush, 400);
    return 1;
  }).catch(function(e){
    it.tries++;
    it.why = String(e && e.message || '').slice(0, 80);
    if (it.tries > 5){
      PHOTO_Q.shift();
      PHOTO_FAIL.push(it);
      CORE.saveSoon();
      logEvent('تعذّر رفع صورة — ' + it.site + ' · ' + it.kind + (it.why ? ' · ' + it.why : ''), it.site);
    }
    return 0;
  });
}

function photoFlushCloud(){
  var it = PHOTO_Q[0];
  var seq = cfgN(it.seq) || (it.seq = photoNext(it.site));
  var nm2 = it.site + '-' + seq + '.jpg';
  var data = String(it.data || '');
  /* سقفُ الوثيقة ميغابايت: ما زاد يُضغَط ثانيةً — وما بقي فوقه يُترَك للدرايف المباشر */
  if (data.length > 900000){
    it.tries++; it.why = 'الصورةُ أكبرُ من سقف القاعدة';
    if (it.tries > 5){ PHOTO_Q.shift(); PHOTO_FAIL.push(it); CORE.saveSoon(); }
    return Promise.resolve(0);
  }
  PHOTO_Q.shift();
  /* (V37.18) الخامُ في مجموعةٍ لا يسحبها أيُّ جهاز (photoblobs)، ووثيقةُ الصورة بياناتٌ وحدَها — كانت الصورُ الخامُ تُسحَب إلى كلِّ موبايل (٣٤ صورة = ٨٫٧ م.ب) فتقتل الصفحةَ على آيفون */
  CORE.set('photoblobs', it.site + '-' + seq, { site:it.site, name:nm2, at:it.at, by:STATE.meta.name || '', data:data });
  CORE.set('photos', it.site + '-' + seq, {
    del:null, site:it.site, kind:it.kind, seq:seq, name:nm2, at:it.at, by:STATE.meta.name || '',
    status:'pending', blob:true, q:it.q || null   /* (V30.6) مقاييسُ الجودة */
  });
  CORE.saveSoon();
  logEvent('رفع صورة — ' + it.site + ' \u00b7 ' + it.kind + ' \u00b7 ' + nm2 + ' — ينقلها الخادمُ إلى الدرايف', it.site);
  if (PHOTO_Q.length) setTimeout(photoFlush, 300);
  return Promise.resolve(1);
}

/* الحذفُ للمهندس وحده، وأثرُه يبقى: الوثيقةُ تُوسَم محذوفةً ولا تُمحى،
   فيبقى مكتوبًا أن صورةً كانت هنا ومن أزالها ولماذا. وملفُّ درايف يُحذَف
   فعلًا — فالصورةُ الخاطئةُ لا تُترَك تُرى. */
function photoDelete(id, why){
  if (!may('delete')){ toast(t('الحذفُ للمهندس وحده')); return; }
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
  if (!p.driveId){ done(); return; }
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

/* (V37.22) بلاغُ المالك «صفحة المتابعة بتاخد أكتر من ٥ ثواني»: كانت كلُّ نداءٍ يمسح الصورَ كلَّها (٣٬٩٠٠)، وبطاقةُ «صور ليست على الدرايف»
   تنادي لكلِّ نقطة (١٬٩٤٥) — سبعةُ ملايين دورةٍ في الرسمة الواحدة. صار فهرسًا بالنقطة يُبنى مرةً ويُعاد حين تتغيّر الصور. */
var PH_IDX = null, PH_IDX_KEY = '';

function phIdx(){
  var P = STATE.photos || {}, key = (typeof PH_VER === 'number' ? PH_VER : 0);   /* لا عدَّ للمفاتيح في المسار الساخن — التغييرُ يُعلَن بـphTouch أو بكائنٍ جديد */
  if (PH_IDX && PH_IDX_KEY === key && phIdx.ref === STATE.photos) return PH_IDX;
  var M = {}; Object.keys(P).forEach(function(k){ var p = P[k]; if (p && p.site){ (M[p.site] = M[p.site] || []).push([k, p]); } });
  Object.keys(M).forEach(function(s){ M[s].sort(function(a, b){ return (b[1].at || 0) - (a[1].at || 0); }); });
  phIdx.ref = STATE.photos; phIdx.len = Object.keys(P).length; PH_IDX = M; PH_IDX_KEY = key; return M;
}

var PH_VER = 0;

function phTouch(){ PH_VER++; PH_IDX = null; }

function photosOf(siteId){ var L = phIdx()[siteId]; return L ? L.slice() : []; }

/* ═══ سببُ تعثّرِ النقل يُقال بجملةٍ لا برسالةِ جوجل ═══
   كان نصُّ جوجل الطويلُ يُطبَع تحت كلِّ صورة — سطران إنجليزيّان ورابطُ وثائقٍ
   مقطوع، يتكرّران ثلاثين مرةً في صفحةٍ واحدة، فلا يُقرأ منهما شيءٌ ولا يُعرَف
   ما العمل. صار الخطأُ يُترجَم إلى جملةٍ واحدة، ويُرفَع سببُه إلى **لافتةٍ
   واحدةٍ** فوق المعرض فيها ما يُفعَل — لا تحت كلِّ صورة. */
var PH_ERR = [
  { re:/storage quota|shared drives|storageQuotaExceeded/i,
    s:'حسابُ الخدمة بلا سعةٍ على الدرايف',
    fix:'الحلُّ خطوةٌ واحدةٌ من مديرِ المشروع: يُنشَأ **درايفٌ مشترَك** (Shared drive) ويُضاف إليه حسابُ الخدمة بصلاحية «مدير محتوى»، ثم يوضَع معرِّفُه في GDRIVE_FOLDER. الصورُ محفوظةٌ الآن على الأجهزة وفي القاعدة ولن تضيع — تُرفَع كلُّها تلقائيًّا بعد الضبط.' },
  { re:/permission|insufficient|403/i, s:'لا إذنَ لحساب الخدمة على المجلد',
    fix:'يُشارَك مجلدُ الدرايف مع حساب الخدمة بصلاحية «محرِّر» — أو يُنقَل إلى درايفٍ مشترَك.' },
  { re:/not found|404/i, s:'مجلدُ الدرايف غيرُ موجود',
    fix:'يُراجَع معرِّفُ المجلد في GDRIVE_FOLDER — لعلّه حُذف أو نُسخ ناقصًا.' },
  { re:/quota|rate|429|503/i, s:'حصةُ الدرايف امتلأت مؤقتًا',
    fix:'يُعاد الرفعُ تلقائيًّا في الدورة التالية — لا فعلَ مطلوب.' }
];

function phErr(why){
  var w = String(why || '');
  for (var i = 0; i < PH_ERR.length; i++) if (PH_ERR[i].re.test(w)) return PH_ERR[i];
  return { s:w.slice(0, 60) || 'تعذّر النقل', fix:'' };
}

function photoGalleryHtml(siteId){
  var L = photosOf(siteId), Q = PHOTO_Q.filter(function(q){ return q.site === siteId; }), Fq = PHOTO_FAIL.filter(function(q){ return q.site === siteId; });
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
    html += tile(q.data ? { src:q.data } : null, pill('تعذّر رفعُها', 'bad'), q.kind, '<p class="hint" style="margin:4px 0 0">' + esc(t(e2.s)) + '</p>', q.data ? ('f' + PHOTO_FAIL.indexOf(q)) : '');
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

function photoStrip(siteId){
  var L = photosOf(siteId);
  if (!L.length) return '';
  return card('صورُ الموقع',
    '<div class="grid cols-2">'
    + L.map(function(x){
        var id = x[0], p = x[1];
        if (p.del){
          return '<div class="field"><label>' + esc(t(p.kind || '')) + '</label>'
            + '<p class="hint">' + esc(t('حُذفت')) + ' — ' + esc(p.del.by || '')
            + (p.del.why ? ' · ' + esc(p.del.why) : '') + '</p></div>';
        }
        return '<div class="field"><label>' + esc(t(p.kind || '')) + '</label>'
          + '<a class="btn btn-secondary" style="width:100%" target="_blank" rel="noopener"'
          + ' href="' + esc(p.link || '#') + '" data-pview="' + esc(id) + '">'
          + esc(t('افتح الصورة')) + '</a>'
          + '<p class="hint">' + esc(t('رفعها')) + ': ' + esc(p._by || p.by || '—') + '</p>'
          + (may('delete')
              ? btn('احذف','btn-quiet btn-sm',' data-pdel="' + esc(id) + '"') : '')
          + '</div>';
      }).join('')
    + '</div>'
    + '<p class="hint">' + esc(t('كلُّ رفعٍ واطّلاعٍ وحذفٍ مسجَّلٌ في سجل الأحداث باسم فاعله.')) + '</p>');
}

/* (V38.62) a photo that reached the cloud but not yet Drive is read once from its raw copy and kept in memory (last 40) —
   so the office sees the installer's photo within seconds, not after the Drive transfer */
function phBlob(id){
  var C = phBlob.c || (phBlob.c = {}), W = phBlob.w || (phBlob.w = {});
  if (C[id]) return C[id];
  /* (V38.64) FB.ready is a flag, not a function — calling it threw on every phone with Firebase up, so a point with a photo
     still travelling to Drive could not open (the owner's «green point does not respond — error»). DB.ready() is the check. */
  if (W[id] || typeof DB === 'undefined' || typeof DB.ready !== 'function' || !DB.ready()) return '';
  W[id] = 1;
  DB.col('photoblobs').doc(id).get().then(function(d){
    FB.readCount = (FB.readCount || 0) + 1;
    var v = d && d.exists ? (d.data() || {}).data : '';
    if (!v){
      /* (V38.67) no raw copy: the server moved it to Drive and deleted the copy — read the photo's document once for its Drive id */
      return DB.col('photos').doc(id).get().then(function(pd){
        FB.readCount = (FB.readCount || 0) + 1;
        var pv = pd && pd.exists ? pd.data() : null; if (!pv || !pv.driveId) return;
        STATE.photos = STATE.photos || {}; STATE.photos[id] = Object.assign({}, STATE.photos[id] || {}, pv); if (typeof phTouch === 'function') phTouch(); else PH_IDX = null;
        try { if (!document.querySelector('#content textarea:focus, #content input:focus')) render(1); } catch (e3){ LS_ERR = e3; }
      });
    }
    C[id] = v; var ks = Object.keys(C); if (ks.length > 40) delete C[ks[0]];
    try { if (!document.querySelector('#content textarea:focus, #content input:focus')) render(1); } catch (e){ LS_ERR = e; }
  }).catch(function(e){ LS_ERR = e; });
  return '';
}
/* the best source of a photo for a thumbnail: its own data, the raw copy while it travels, or the Drive thumbnail */
function phSrc(id, p, sz){
  p = p || {}; if (p.data) return p.data;
  if (p.driveId) return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(p.driveId) + '&sz=w' + (sz || 400);
  /* (V38.64) a thumbnail never breaks the screen that shows it */
  if (p.blob || p.status === 'pending'){ try { return phBlob(id); } catch (e){ LS_ERR = e; return ''; } }
  return '';
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
/* the deleted photos of one kind on a point, for the restore list */
function phDeletedHtml(site, ins){
  if (rankOf(effRole(ROLE)) < rankOf('admin')) return '';
  var L = (typeof photosOf === 'function' ? photosOf(site) : []).filter(function(x){ var p = x[1] || {}; return p.del && (/^ins/.test(String(p.kind || '')) === !!ins); });
  if (!L.length) return '';
  return '<details style="margin-top:8px"><summary class="hint" style="cursor:pointer">\u{1F5D1} ' + esc(t('صورٌ محذوفة')) + ' \u00b7 ' + nm(L.length) + '</summary>'
    + L.map(function(x){ var p = x[1], d0 = p.del || {}; return '<div class="svq-row"><div class="svq-k" style="flex:1 1 60%"><b style="color:var(--ink)">' + esc(x[0]) + '</b><div class="hint" style="margin:0;font-size:11.5px">' + esc(t('حذفها')) + ' ' + esc(dispName(d0.by) || d0.by || '—') + ' \u00b7 ' + esc(fmtDT(d0.at)) + (d0.why ? ' \u00b7 ' + esc(d0.why) : '') + '</div></div>' + btn('\u21A9 ' + t('استرجع'), 'btn-quiet btn-sm', ' data-phrestore="' + esc(x[0]) + '"') + '</div>'; }).join('')
    + '</details>';
}
