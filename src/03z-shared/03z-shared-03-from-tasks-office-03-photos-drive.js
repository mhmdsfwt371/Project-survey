/* ============================================================================
   FILE    : src/03z-shared/03z-shared-03-from-tasks-office-03-photos-drive.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-03-photos-drive.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : drvCfg, drvLoad, drvAuth, dataToBlob, drvUpload, photoNext, photoQueue, photoFlush, photoFlushCloud, phIdx, phTouch, photosOf … (+4 more)
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
  /* (V39.75) owner's field report: «عدد الصور 1 رغم الرفع… والصورة الجديدة بتستبدل القديمة». The number was a COUNT of the
     point's photos on this device plus one: a photo this device had not pulled (or a removed entry) made the count fall
     short and the new photo took an existing number — its document then overwrote that photo. Now: the highest number
     seen, stored or queued, plus one. */
  var n = 0, pre = siteId + '-';
  Object.keys(STATE.photos || {}).forEach(function(k){
    var v = STATE.photos[k], q = v && v.site === siteId ? (+v.seq || (k.indexOf(pre) === 0 ? +k.slice(pre.length) : 0) || 0) : 0;
    if (q > n) n = q; else if (v && v.site === siteId && !q) n++;
  });
  PHOTO_Q.forEach(function(q){ if (q.site === siteId){ var s2 = +q.seq || 0; n = s2 > n ? s2 : n + (s2 ? 0 : 1); } });
  var L = photoNext.last || (photoNext.last = {});   /* (V39.79) Drive showed four files named «…-2.jpg» for one camp: the phone's copy of
     the photos can lose the document it just uploaded (scoped pulls), so a count or a max from that copy alone repeats the number.
     What this device handed out is remembered here, and the id carries the account's two letters (see photoTag) so two phones never share one */
  if (L[siteId] > n) n = L[siteId];
  return n + 1;
}
/* the number a queued photo took — so the next asks beyond it even if the phone's copy forgets the document */
function photoTook(siteId, seq){ var L = photoNext.last || (photoNext.last = {}); if (+seq > (L[siteId] || 0)) L[siteId] = +seq; }
/* the account's two letters — the same mark new points carry (nsNextId) */
function photoTag(){
  var u = String(STATE.meta.uid || STATE.meta.name || 'x'), h = 0; for (var i = 0; i < u.length; i++) h = (h * 31 + u.charCodeAt(i)) >>> 0;
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; return A[h % A.length] + A[Math.floor(h / A.length) % A.length];
}

function photoQueue(siteId, kind, dataUrl){
  var pq = dataUrl ? PHOTO_Q_IX[String(dataUrl).length + ':' + String(dataUrl).slice(-64)] : null;   /* (V30.6) */
  if (pq && photoDupOf(siteId, pq)) toast('\u26A0 ' + t('هذه الصورة تكاد تطابق صورةً سابقةً لنفس النقطة'));
  PHOTO_Q.push({ site:siteId, kind:kind, data:dataUrl, at:Date.now(), tries:0,
                 seq:photoNext(siteId), q:pq || null });
  photoTook(siteId, PHOTO_Q[PHOTO_Q.length - 1].seq);   /* (V39.79) */
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
  var seq = cfgN(it.seq) || (it.seq = photoNext(it.site)); photoTook(it.site, seq);
  var pid = it.site + '-' + seq + photoTag(), nm2 = pid + '.jpg';   /* (V39.79) */
  return drvUpload(nm2, it.data).then(function(r){
    PHOTO_Q.shift();
    /* في الوثيقة معرّفُ الملف ورابطُه لا الصورةُ نفسها */
    /* المفتاحُ بالرقم لا بالنوع: كانت صورةٌ ثانيةٌ من النوع نفسِه تكتب فوق
       الأولى في السجل — فيبقى الملفان على الدرايف ولا يُعرَف إلا آخرُهما. */
    CORE.set('photos', pid, {
      del:null, site:it.site, kind:it.kind, seq:seq, name:nm2,
      driveId:r.id, link:r.webViewLink, at:it.at, q:it.q || null   /* (V30.6) */
    }); if (typeof phTouch === 'function') phTouch();   /* (V39.75) the list shows the uploaded photo at once — it kept the old index */
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
  var seq = cfgN(it.seq) || (it.seq = photoNext(it.site)); photoTook(it.site, seq);
  var pid = it.site + '-' + seq + photoTag(), nm2 = pid + '.jpg';   /* (V39.79) */
  var data = String(it.data || '');
  /* سقفُ الوثيقة ميغابايت: ما زاد يُضغَط ثانيةً — وما بقي فوقه يُترَك للدرايف المباشر */
  if (data.length > 900000){
    it.tries++; it.why = 'الصورةُ أكبرُ من سقف القاعدة';
    if (it.tries > 5){ PHOTO_Q.shift(); PHOTO_FAIL.push(it); CORE.saveSoon(); }
    return Promise.resolve(0);
  }
  PHOTO_Q.shift();
  /* (V37.18) الخامُ في مجموعةٍ لا يسحبها أيُّ جهاز (photoblobs)، ووثيقةُ الصورة بياناتٌ وحدَها — كانت الصورُ الخامُ تُسحَب إلى كلِّ موبايل (٣٤ صورة = ٨٫٧ م.ب) فتقتل الصفحةَ على آيفون */
  CORE.set('photoblobs', pid, { site:it.site, name:nm2, at:it.at, by:STATE.meta.name || '', data:data });
  CORE.set('photos', pid, {
    del:null, site:it.site, kind:it.kind, seq:seq, name:nm2, at:it.at, by:STATE.meta.name || '',
    status:'pending', blob:true, q:it.q || null   /* (V30.6) مقاييسُ الجودة */
  }); if (typeof phTouch === 'function') phTouch();   /* (V39.75) the list shows the uploaded photo at once — it kept the old index */
  CORE.saveSoon();
  logEvent('رفع صورة — ' + it.site + ' \u00b7 ' + it.kind + ' \u00b7 ' + nm2 + ' — ينقلها الخادمُ إلى الدرايف', it.site);
  if (PHOTO_Q.length) setTimeout(photoFlush, 300);
  return Promise.resolve(1);
}


/* (V37.22) بلاغُ المالك «صفحة المتابعة بتاخد أكتر من ٥ ثواني»: كانت كلُّ نداءٍ يمسح الصورَ كلَّها (٣٬٩٠٠)، وبطاقةُ «صور ليست على الدرايف»
   تنادي لكلِّ نقطة (١٬٩٤٥) — سبعةُ ملايين دورةٍ في الرسمة الواحدة. صار فهرسًا بالنقطة يُبنى مرةً ويُعاد حين تتغيّر الصور. */
var PH_IDX = null; PV.PH_IDX_KEY = '';

function phIdx(){
  var P = STATE.photos || {}, key = (typeof PH_VER === 'number' ? PH_VER : 0);   /* لا عدَّ للمفاتيح في المسار الساخن — التغييرُ يُعلَن بـphTouch أو بكائنٍ جديد */
  if (PH_IDX && PV.PH_IDX_KEY === key && phIdx.ref === STATE.photos) return PH_IDX;
  var M = {}; Object.keys(P).forEach(function(k){ var p = P[k]; if (p && p.site){ (M[p.site] = M[p.site] || []).push([k, p]); } });
  Object.keys(M).forEach(function(s){ M[s].sort(function(a, b){ return (b[1].at || 0) - (a[1].at || 0); }); });
  phIdx.ref = STATE.photos; phIdx.len = Object.keys(P).length; PH_IDX = M; PV.PH_IDX_KEY = key; return M;
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


/* the deleted photos of one kind on a point, for the restore list */
function phDeletedHtml(site, ins){
  if (rankOf(effRole(ROLE)) < rankOf('admin')) return '';
  var L = (typeof photosOf === 'function' ? photosOf(site) : []).filter(function(x){ var p = x[1] || {}; return p.del && (/^ins/.test(String(p.kind || '')) === !!ins); });
  if (!L.length) return '';
  return '<details style="margin-top:8px"><summary class="hint" style="cursor:pointer">\u{1F5D1} ' + esc(t('صورٌ محذوفة')) + ' \u00b7 ' + nm(L.length) + '</summary>'
    + L.map(function(x){ var p = x[1], d0 = p.del || {}; return '<div class="svq-row"><div class="svq-k" style="flex:1 1 60%"><b style="color:var(--ink)">' + esc(x[0]) + '</b><div class="hint" style="margin:0;font-size:11.5px">' + esc(t('حذفها')) + ' ' + esc(dispName(d0.by) || d0.by || '—') + ' \u00b7 ' + esc(fmtDT(d0.at)) + (d0.why ? ' \u00b7 ' + esc(d0.why) : '') + '</div></div>' + btn('\u21A9 ' + t('استرجع'), 'btn-quiet btn-sm', ' data-phrestore="' + esc(x[0]) + '"') + '</div>'; }).join('')
    + '</details>';
}
