/* ============================================================================
   FILE    : src/09-integ/09-integ-01-connections-tab.js
   DOMAIN  : Integrations — external platforms read by the cloud bridge
   PURPOSE : The office «Connections» tab: AFAQY PRO account (stored write-only), bridge status, «Refresh now».
   DEFINES : integOtpHtml, integOtp, jobsStatusLoad, jobsCardHtml, integPubLoad, integPubOf, integAcctHtml, integStatusLoad, integStateLine, integProHtml, integNusukHtml, integStepsHtml, integMissing, integMissingHtml, integTabHtml, mayIntegEdit, integSave, integOff, integNow
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             design notes.
   ============================================================================ */
/* ═══════════════════════════════════════════════════════════════════════════
   (V39.70) تبويب «🔌 الربط» — المرحلة ١ (أفاقي برو)
   ───────────────────────────────────────────────────────────────────────────
   owner: «عاوز أحطهم في المنصة يكون ليهم مكان أضيفهم، ولما أعمل كونيكت الانتجريشن يشتغل أوتوماتيك — ٥ دقايق وزرار».
   The account is written to integ/afaqypro (engineer/admin write, nobody reads — firestore.rules); the cloud function
   (functions/index.js) pulls every 5 minutes and on «⟳ حدّث الآن», and writes its state to settings/integStatus.
   Nothing here talks to AFAQY PRO directly, and the password never comes back to any device.
   ═══════════════════════════════════════════════════════════════════════════ */

/* (V39.74) owner: «عاوز اليوزر أو الإيميل يكون ظاهر، والباسورد هو اللي أكتبه كل مرة؛ ولما يعمل كونكت ألاقيهم مقفولين ومكتوب
   الإيميل المعمول بيه كونكت ومكتوب إنه متصل». The account itself stays write-only (integ/{name}); its username alone is also
   kept in settings/integPub (office-only read) so the card can show it locked, with «✎ تغيير» and «افصل». */
function integPubLoad(force){
  var P = integPubLoad.S || (integPubLoad.S = { at:0, v:null, busy:false });
  if (!force && (P.busy || Date.now() - P.at < 20000)) return P;
  if (!FB.ready || !FB.db || !STATE.meta.online) return P;
  P.busy = true;
  DB.col('settings').doc('integPub').get().then(function(doc){ P.v = doc && doc.exists ? doc.data() : {}; P.at = Date.now(); P.busy = false; if (CUR === 'sys' && tabCur('sys') === 'integ') render(1); })
    .catch(function(e){ P.busy = false; P.at = Date.now(); LS_ERR = e; });
  return P;
}
function integPubOf(name){ var P = integPubLoad(); return P.v && P.v[name] && P.v[name].user ? P.v[name] : null; }
/* the account fields: locked with the saved username once connected; open while adding or changing */
function integAcctHtml(name, idU, idP, userLabel, extra){
  var pub = integPubOf(name), ed = integAcctHtml.edit && integAcctHtml.edit[name];
  if (pub && !ed){
    return '<div class="grid2">'
      + '<div class="field"><label>' + esc(t(userLabel)) + '</label><input class="in" value="' + esc(pub.user) + '" readonly disabled dir="ltr" style="opacity:.85"></div>'
      + '<div class="field"><label>' + esc(t('كلمة السر')) + '</label><input class="in" value="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" readonly disabled style="opacity:.85"></div>'
      + '</div><div class="actions" style="margin-top:8px">' + btn('\u270E ' + t('تغيير الحساب'), 'btn-secondary', ' data-integedit="' + name + '"') + extra + btn(t('افصل'), 'btn-quiet', ' data-integoff="' + name + '"') + '</div>';
  }
  return '<div class="grid2">'
    + '<div class="field"><label>' + esc(t(userLabel)) + '</label><input class="in" id="' + idU + '" autocomplete="off" dir="ltr" value="' + esc(pub ? pub.user : '') + '"></div>'
    + '<div class="field"><label>' + esc(t('كلمة السر')) + '</label><input class="in" id="' + idP + '" type="password" autocomplete="new-password" placeholder="' + esc(t('تُكتب في كل مرة')) + '"></div>'
    + '</div>';
}
function integStatusLoad(force){
  var S = integStatusLoad.S || (integStatusLoad.S = { at:0, v:null, busy:false });
  if (!force && (S.busy || Date.now() - S.at < 20000)) return;
  if (!FB.ready || !FB.db || !STATE.meta.online) return;
  S.busy = true;
  DB.col('settings').doc('integStatus').get().then(function(doc){ S.v = doc && doc.exists ? doc.data() : null; S.at = Date.now(); S.busy = false; if (CUR === 'sys' && tabCur('sys') === 'integ') render(1); })
    .catch(function(e){ S.busy = false; S.at = Date.now(); LS_ERR = e; });
}
function integStateLine(p){
  if (!p) return '<span class="pill" style="border-color:#94A3B8;color:#94A3B8">\u23F3 ' + esc(t('لم يعمل الجسرُ بعد — أول سحبٍ خلال ٥ دقائق من الحفظ')) + '</span>';
  var ago = p.at ? nm(Math.max(0, Math.round((Date.now() - p.at) / 60000))) + ' ' + t('د') : '—';
  if (p.state === 'err' && p.err === 'token') return '<span class="pill" style="border-color:#EF4444;color:#EF4444">\u{1F534} ' + esc(t('التوكين انتهى أو مرفوض — حط توكين جديد، أو احفظ اسم المستخدم وكلمة السر عشان يتجدد لوحده')) + ' \u00b7 ' + ago + '</span>';   /* (V40.0) */
  if (p.state === 'code') return '<span class="pill" style="border-color:#F59E0B;color:#F59E0B">\u{1F510} ' + esc(t('المنصة طلبت كود تحقق — أكمل الخطوة تحت')) + '</span>';   /* (V39.99) */
  if (p.state === 'off') return '<span class="pill" style="border-color:#94A3B8;color:#94A3B8">\u26AA ' + esc(t('غير متصل — لا حساب محفوظ')) + '</span>';
  if (p.state === 'err') return '<span class="pill" style="border-color:#EF4444;color:#EF4444">\u{1F534} ' + esc(t('فشل')) + ': ' + esc(p.err === 'otp' ? t('المنصة طلبت كودَ تحقق — هذا الحساب عليه تأكيدٌ بخطوتين؛ استخدم حسابَ ربطٍ بلا تأكيد، أو اطلب بناءَ خطوة الكود') : p.err === 'login' ? t('الدخول رُفض — راجع اسم المستخدم وكلمة السر') + (p.msg ? ' (' + p.msg + ')' : '') : String(p.err || '')) + (p.httpStatus ? ' (' + nm(p.httpStatus) + ')' : '') + ' \u00b7 ' + esc(t('منذ')) + ' ' + ago + '</span>';
  var withImei = +p.withImei || 0, matched = +p.matched || 0;
  return '<span class="pill" style="border-color:#22C55E;color:#22C55E">\u{1F7E2} ' + esc(t('متصل')) + ' \u00b7 ' + esc(t('آخر سحب منذ')) + ' ' + ago + '</span> '
    + '<span class="pill">' + nm(matched) + ' / ' + nm(withImei) + ' ' + esc(t('جهازًا مطابَقًا برقمه')) + '</span>'
    + (p.note ? ' <span class="hint" style="margin:0">' + esc(t('لم يُسجَّل رقمُ جهازٍ بعد — يُسجَّل في «تعديل حساسات» لكل حساس وجيت واي')) + '</span>' : '')
    + (withImei && matched < withImei ? ' <span class="hint" style="margin:0">' + esc(t('غير المطابَق: رقمٌ غير موجود في أفاقي برو أو مكتوبٌ خطأ')) + '</span>' : '');
}
function integProHtml(){
  var S = integStatusLoad.S, p = S && S.v && S.v.pro;
  integStatusLoad();
  var busy = integNow.busy ? ' disabled' : '';
  return card('\u{1F50C} ' + t('أفاقي برو') + ' — ' + t('الحساسات والجيت واي'),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('يُسحب كلَّ ٥ دقائق بأرقام أجهزتنا وحدها، للقراءة فقط. الحسابُ يُحفظ في مكانٍ لا يقرؤه أحدٌ من التطبيق — ولا يعود إلى أي جهاز.')) + '</p>'
    + '<div style="margin:0 0 10px">' + integStateLine(p) + '</div>'
    + (p && p.state === 'code' && mayIntegEdit() ? integOtpHtml(p) : '')   /* (V39.99) the code step */
    + (function(){ var pub = integPubOf('afaqypro'), ed = integAcctHtml.edit && integAcctHtml.edit.afaqypro, now = btn('\u21BB ' + t('حدّث الآن'), 'btn-secondary', ' data-integnow="1"' + busy);
        if (pub && !ed) return '<div class="hint" style="margin:0 0 6px">' + esc(t('الحساب المتصل')) + ': <b dir="ltr">' + esc(pub.user || '—') + '</b>' + (pub.tok ? ' \u00b7 \u{1F511} ' + esc(t('توكين محفوظ')) : '') + '</div>' + integAcctHtml('afaqypro', 'integUser', 'integPass', 'اسم المستخدم', now);   /* (V40.0) */
        return integAcctHtml('afaqypro', 'integUser', 'integPass', 'اسم المستخدم', '')
          + '<div class="field" style="margin-top:8px"><label>' + esc(t('التوكين (اختياري)')) + '</label><input class="in" id="integTok" type="password" autocomplete="off" dir="ltr" placeholder="' + esc(t('الصقه هنا')) + '">'
          + '<div class="hint" style="margin:4px 0 0">' + esc(t('يُستعمل أولًا. ومع اسم المستخدم وكلمة السر يتجدد لوحده لما ينتهي؛ ولوحده يشتغل لحد ما ينتهي بس.')) + '</div></div>'
          + '<div class="field" style="margin-top:8px"><label>' + esc(t('عنوان المنصة')) + '</label><input class="in" id="integUrl" value="https://api.afaqy.sa" dir="ltr"></div>'
          + '<div class="actions" style="margin-top:8px">' + btn('\u{1F50C} ' + t('احفظ واتصل'), 'btn-primary', ' data-integsave="afaqypro"') + (pub ? btn(t('إلغاء'), 'btn-quiet', ' data-integedit="afaqypro"') : '') + '</div>'; })()
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('«حدّث الآن» للمهندس والمدير — مرةً في الدقيقة للجميع، وتعود القراءاتُ خلال ثوانٍ إلى الخريطة الثلاثية.')) + '</p>');
}
function integNusukHtml(){
  /* (V39.72) owner: «صفحة أكتب فيها يوزر وباسورد البرو ويوزر وباسورد نسك». The account is kept (write-only, like PRO);
     the bridge starts on it once the card system's login steps reach us — nothing is guessed. */
  return card('\u{1F3AB} ' + t('نظام البطاقات') + ' — ' + t('القارئات والكاميرات'),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('يُحفظ الحسابُ الآن في المكان المحمي نفسه. السحبُ منه يبدأ حين تصلنا خطواتُ الدخول من فريقهم (الرسالةُ جاهزة) — وإن طلبت المنصةُ كودًا يظهر لك هنا مكانٌ تكتبه فيه.')) + '</p>'
    + (function(){ var pub = integPubOf('nusuk'), ed = integAcctHtml.edit && integAcctHtml.edit.nusuk;
        if (pub && !ed) return '<div class="hint" style="margin:0 0 6px">\u{1F7E1} ' + esc(t('الحساب محفوظ')) + ': <b dir="ltr">' + esc(pub.user) + '</b> \u00b7 ' + esc(t('بانتظار خطوات الدخول من فريقهم')) + '</div>' + integAcctHtml('nusuk', 'nskUser', 'nskPass', 'الإيميل أو اسم المستخدم', '');
        return integAcctHtml('nusuk', 'nskUser', 'nskPass', 'الإيميل أو اسم المستخدم', '') + '<div class="actions" style="margin-top:8px">' + btn('\u{1F4BE} ' + t('احفظ الحساب'), 'btn-secondary', ' data-integsave="nusuk"') + (pub ? btn(t('إلغاء'), 'btn-quiet', ' data-integedit="nusuk"') : '') + '</div>'; })());
}
/* (V39.72) «يقول لي الربط تم وأبدأ أشوف قراءاتك بناءً على ١ ٢ ٣ — ويشرح الطريقة» */
function integStepsHtml(){
  var S = integStatusLoad.S, p = S && S.v && S.v.pro, saved = !!(p && p.state && p.state !== 'off'), ok = !!(p && p.state === 'ok');
  var M = integMissing(), matched = p ? +p.matched || 0 : 0;
  var st = function(done, wait){ return done ? '\u2705' : wait ? '\u23F3' : '\u2B1C'; };
  var row = function(n, mark, title, body){ return '<div style="display:flex;gap:10px;margin:0 0 10px"><div style="font-size:20px">' + mark + '</div><div><b>' + nm(n) + ') ' + esc(t(title)) + '</b><div class="hint" style="margin:2px 0 0">' + body + '</div></div></div>'; };
  return card('\u{1F9ED} ' + t('كيف يعمل الربط'),
    row(1, st(saved), 'احفظ حسابَ أفاقي برو', esc(t('اسم المستخدم وكلمة السر — يُحفظان في مكانٍ لا يقرؤه التطبيق بعد الحفظ.')))
    + row(2, st(ok, saved && !ok), 'الاتصال', esc(t('خلال ٥ دقائق (أو فورًا بـ«حدّث الآن») يدخل الجسرُ المنصة: «متصل» = تمّ، «طلبت كود» = الحساب عليه تأكيد، «رُفض» = راجع البيانات.')))
    + row(3, st(ok && matched > 0, ok && !matched), 'قراءاتُك على الخريطة', esc(t('كلُّ حساسٍ وجيت واي يُطابَق برقمه (السيريال/IMEI) المسجَّل في «تعديل حساسات» للمخيم: الحرارة والرطوبة على الحساس، ومتصل/غير متصل على الجيت واي، وتتحدّث كلَّ ٥ دقائق.')) + ' <b class="num">' + nm(matched) + ' / ' + nm(M.withSerial) + '</b> ' + esc(t('جهازًا مطابَقًا')))
  );
}
/* what the camps still miss so their devices show live: devices without a serial, per camp */
function integMissing(){
  var o = { total:0, withSerial:0, camps:[] };
  (STATE.sites || []).forEach(function(x){
    if (x.type !== 'مخيم' || typeof iotOf !== 'function') return; var c = iotOf(x.id); if (!c) return;
    var sm = c.sm || [], gm = c.gm || [], n = (c.sensors || []).length + 1 + (c.gws || []).length, miss = 0;
    for (var i = 0; i < (c.sensors || []).length; i++) if (!(sm[i] && String(sm[i].serial || '').trim())) miss++;
    for (var k = 0; k < 1 + (c.gws || []).length; k++) if (!(gm[k] && String(gm[k].serial || '').trim())) miss++;
    o.total += n; o.withSerial += n - miss; if (miss) o.camps.push({ x:x, miss:miss, n:n });
  });
  o.camps.sort(function(a, b){ return b.miss - a.miss; });
  return o;
}
function integMissingHtml(){
  var M = integMissing(); if (!M.total) return '';
  return card('\u{1F4CB} ' + t('الناقص في المخيمات حتى تظهر قراءاتُها'),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('جهازٌ بلا سيريال لا يُطابَق ولا تظهر قراءته. افتح المخيم ← «تعديل حساسات» ← اختر الجهاز ← اكتب السيريال ← «حفظ البيانات».')) + '</p>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px"><span class="pill" style="border-color:#22C55E;color:#22C55E">' + nm(M.withSerial) + ' ' + esc(t('بسيريال')) + '</span><span class="pill" style="border-color:#EF4444;color:#EF4444">' + nm(M.total - M.withSerial) + ' ' + esc(t('بلا سيريال')) + '</span></div>'
    + M.camps.slice(0, 25).map(function(o){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(o.x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px"><span>' + esc(o.x.name || o.x.id) + '</span><span class="num">' + nm(o.miss) + ' / ' + nm(o.n) + '</span></button>'; }).join(''));
}
function integTabHtml(){
  if (!mayIntegEdit()) return card(t('الربط'), '<p class="hint" style="margin:0">' + esc(t('هذا التبويب للمهندس والمدير')) + '</p>');
  return integStepsHtml() + integProHtml() + integNusukHtml() + integMissingHtml() + jobsCardHtml();   /* (V39.72 · V39.89) */
}
function mayIntegEdit(){ return ROLE === 'admin' || ROLE === 'engineer'; }
function integSave(name){
  if (!mayIntegEdit()){ toast(t('هذا التبويب للمهندس والمدير')); return; }
  if (!STATE.meta.online || !FB.ready || !FB.db){ toast(t('الحفظُ يحتاج اتصالًا بالشبكة')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var nsk = name === 'nusuk', user = g(nsk ? 'nskUser' : 'integUser'), pass = g(nsk ? 'nskPass' : 'integPass'), url = nsk ? '' : (g('integUrl') || 'https://api.afaqy.sa');   /* (V39.72) */
  var tok = nsk ? '' : g('integTok');   /* (V40.0) the token alone is enough; with the account it renews itself */
  if ((!user || !pass) && !tok){ toast(t(nsk ? 'اكتب اسمَ المستخدم وكلمةَ السر' : 'اكتب اسمَ المستخدم وكلمةَ السر، أو الصق التوكين')); return; }
  var doc = { url:url, on:true, at:Date.now(), by:STATE.meta.name || '', _by:STATE.meta.uid || '', _at:Date.now() };
  if (user && pass){ doc.user = user; doc.pass = pass; }
  if (tok){ doc.token = tok; doc.tokenAt = Date.now(); }
  DB.col('integ').doc(name).set(doc, { merge:true })
    .then(function(){ var pubD = {}; pubD[name] = { user:user || ((integPubOf(name) || {}).user || ''), tok:!!tok || !!((integPubOf(name) || {}).tok), at:Date.now(), by:STATE.meta.name || '' }; DB.col('settings').doc('integPub').set(Object.assign({ _by:STATE.meta.uid || '', _at:Date.now() }, pubD), { merge:true }).then(function(){ integPubLoad(true); }).catch(function(e){ LS_ERR = e; });   /* (V39.74) */
      if (integAcctHtml.edit) integAcctHtml.edit[name] = false;
      ['integPass', 'nskPass', 'integTok'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; }); logEvent('حُفظ حسابُ الربط — ' + name + ' \u00b7 ' + user, ''); toast(t('حُفظ — أول سحبٍ خلال ٥ دقائق، أو اضغط «حدّث الآن»')); integStatusLoad(true); })
    .catch(function(e){ toast(t('تعذّر الحفظ') + ': ' + String(e && e.message || e).slice(0, 80)); });
}
function integOff(name){
  if (!mayIntegEdit()) return;
  if (!STATE.meta.online || !FB.ready || !FB.db){ toast(t('يحتاج اتصالًا بالشبكة')); return; }
  if (!confirm(t('فصلُ الربط يحذف الحسابَ المحفوظ ويوقف السحب. متابعة؟'))) return;
  DB.col('integ').doc(name).set({ on:false, user:'', pass:'', token:'', at:Date.now(), by:STATE.meta.name || '', _by:STATE.meta.uid || '', _at:Date.now() })   /* (V40.0) the token goes with the account */
    .then(function(){ var pubD = {}; pubD[name] = { user:'', tok:false, at:Date.now() }; DB.col('settings').doc('integPub').set(Object.assign({ _by:STATE.meta.uid || '', _at:Date.now() }, pubD), { merge:true }).then(function(){ integPubLoad(true); }).catch(function(e){ LS_ERR = e; });   /* (V39.74) */
      logEvent('فُصل الربط — ' + name, ''); toast(t('فُصل')); integStatusLoad(true); })
    .catch(function(e){ toast(t('تعذّر') + ': ' + String(e && e.message || e).slice(0, 80)); });
}
integNow.URL = 'https://us-central1-project-survey-60600.cloudfunctions.net/';
function integNow(){
  if (!mayIntegEdit()) return;
  var u = FB.auth && FB.auth.currentUser; if (!u || !STATE.meta.online){ toast(t('يحتاج اتصالًا بالشبكة')); return; }
  if (integNow.busy) return; integNow.busy = true; render(1);
  u.getIdToken().then(function(tok){
    return fetch(integNow.URL + 'integNow', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + tok }, body:JSON.stringify({ data:{} }) });
  }).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { st:r.status, j:j }; }); })
    .then(function(x){
      var res = (x.j && x.j.result) || {}, err = x.j && x.j.error;
      if (err || x.st >= 400){ toast(t('لم يُحدَّث') + ': ' + String((err && err.message) || x.st).slice(0, 80)); }
      else if (res.state === 'off') toast(t('لا حساب محفوظ — احفظ واتصل أولًا'));
      else if (res.state === 'err') toast(t('فشل السحب') + ': ' + String(res.err || '').slice(0, 80));
      else toast(t('حُدِّث') + ' \u00b7 ' + nm(res.matched || 0) + ' ' + t('جهازًا') + (res.cached ? ' (' + t('قبل أقل من دقيقة') + ')' : ''));
      integStatusLoad(true);
      if (typeof liveIotLoad === 'function'){ try { liveIotLoad(true); } catch (e){ LS_ERR = e; } }
    })
    .catch(function(e){ toast(t('لم يُحدَّث') + ': ' + String(e && e.message || e).slice(0, 80)); })
    .then(function(){ integNow.busy = false; render(1); });
}

/* (V39.89) the accounts-and-photos job now runs as a cloud function every 5 minutes (functions/index.js · jobsTick); its
   last run is written to settings/jobsStatus — shown here so the office sees it is alive without opening GitHub */
function jobsStatusLoad(force){
  var P = jobsStatusLoad.S || (jobsStatusLoad.S = { at:0, v:null, busy:false });
  if (!force && (P.busy || Date.now() - P.at < 30000)) return P;
  if (!FB.ready || !FB.db || !STATE.meta.online) return P;
  P.busy = true;
  DB.col('settings').doc('jobsStatus').get().then(function(doc){ P.v = doc && doc.exists ? doc.data() : null; P.at = Date.now(); P.busy = false; if (CUR === 'sys' && tabCur('sys') === 'integ') render(1); })
    .catch(function(e){ P.busy = false; P.at = Date.now(); LS_ERR = e; });
  return P;
}
function jobsCardHtml(){
  var v = jobsStatusLoad().v;
  if (!v || !v.at) return card('\u{1F501} ' + t('الحسابات والصور على السحابة'), '<p class="hint" style="margin:0">' + esc(t('لم تُسجَّل دورةٌ بعد — تعمل كلَّ ٥ دقائق بعد النشر.')) + '</p>');
  var age = Math.round((Date.now() - v.at) / 60000), late = age > 15;
  var head = '<span class="pill" style="border-color:' + (v.ok && !late ? '#22C55E;color:#22C55E' : '#EF4444;color:#EF4444') + '">' + (v.ok && !late ? '\u{1F7E2} ' + esc(t('تعمل')) : late ? '\u{1F534} ' + esc(t('متأخرة')) : '\u{1F534} ' + esc(t('آخر دورةٍ تعثّرت'))) + '</span> '
    + '<span class="hint" style="margin:0">' + esc(t('آخر دورة')) + ': ' + esc(fmtDT(v.at)) + ' \u00b7 ' + nm(age) + ' ' + esc(t('دقيقة')) + '</span>';
  var steps = (v.steps || []).map(function(x){
    var nmL = x.name === 'provision' ? t('الحسابات') : x.name === 'photos-sync' ? t('الصور إلى الدرايف') : x.name;
    return '<div style="display:flex;justify-content:space-between;margin:4px 0"><span>' + (x.code === 0 ? '\u2705' : '\u274C') + ' ' + esc(nmL) + '</span><span class="hint num" style="margin:0">' + nm(Math.round((x.ms || 0) / 1000)) + ' ' + esc(t('ث')) + '</span></div>'
      + (x.code !== 0 && x.tail ? '<pre class="hint" style="white-space:pre-wrap;margin:0 0 6px;font-size:11px" dir="auto">' + esc(x.tail) + '</pre>' : '');
  }).join('');
  return card('\u{1F501} ' + t('الحسابات والصور على السحابة'), '<div style="margin:0 0 6px">' + head + '</div>' + steps);
}

/* (V39.99) the code step — AFAQY PRO asks for a verification code (two-step account). Built from the official web client:
   choose phone or e-mail → «أرسل الكود» → type the code → «تحقق». The session token is kept by the cloud function, so the
   code is asked again only when the platform ends that session. Engineer and admin only (the function checks too). */
function integOtpHtml(p){
  var M = (p.methods || []).filter(function(m){ return m && (m.type === 'phone' || m.type === 'email'); });
  var lbl = function(m){ return (m.type === 'email' ? '\u2709 ' + t('بالإيميل') : '\u{1F4F1} ' + t('برسالة على الجوال')) + (m.value ? ' \u2014 ' + m.value : ''); };
  var busy = integOtp.busy ? ' disabled' : '';
  var errL = { Invalid_OTP:t('الكود غلط — راجعه واكتبه تاني'), otp_expired:t('الكود انتهى — ابعت كود جديد'), otp_blocked:t('المنصة وقفت المحاولات مؤقتًا — استنى شوية وابعت تاني'),
    validation_error:t('اكتب الكود كامل'), no_session:t('الجلسة انتهت — ابدأ من جديد') }[p.err] || (p.err ? t('رد المنصة') + ': ' + p.err : '');
  var h = '<div class="card" style="margin:0 0 10px;padding:10px;border-color:#F59E0B">'
    + '<b>\u{1F510} ' + esc(t('خطوة كود التحقق')) + '</b>'
    + '<p class="hint" style="margin:4px 0 8px">' + esc(t('الحساب ده عليه تأكيد بخطوتين. اختار تستلم الكود فين، وبعدين اكتبه هنا. التطبيق بيحتفظ بالجلسة، فمش هيطلب الكود تاني غير لما المنصة تنهيها.')) + '</p>'
    + (errL ? '<div class="hint" style="margin:0 0 8px;color:#EF4444">' + esc(errL) + '</div>' : '');
  if (!p.sent){
    h += M.length ? '<div class="actions">' + M.map(function(m){ return btn(esc(lbl(m)), 'btn-primary btn-sm', ' data-integotpsend="' + esc(m.type) + '"' + busy); }).join('') + '</div>'
      : '<div class="actions">' + btn('\u{1F4F1} ' + t('برسالة على الجوال'), 'btn-primary btn-sm', ' data-integotpsend="phone"' + busy) + btn('\u2709 ' + t('بالإيميل'), 'btn-secondary btn-sm', ' data-integotpsend="email"' + busy) + '</div>';
  } else {
    h += '<div class="hint" style="margin:0 0 6px">' + esc(t('اتبعت الكود')) + ' ' + esc(p.method === 'email' ? t('على الإيميل') : t('على الجوال')) + (p.expiresIn ? ' \u00b7 ' + esc(t('صالح')) + ' ' + nm(Math.round(p.expiresIn / 60) || 1) + ' ' + esc(t('د')) : '') + '</div>'
      + '<div class="actions" style="align-items:center"><input class="in" id="integOtpCode" inputmode="numeric" autocomplete="one-time-code" maxlength="8" dir="ltr" placeholder="123456" style="max-width:140px">'
      + btn('\u2713 ' + t('تحقق'), 'btn-primary btn-sm', ' data-integotpverify="1"' + busy)
      + btn('\u21BB ' + t('ابعت كود جديد'), 'btn-quiet btn-sm', ' data-integotpsend="' + esc(p.method || 'phone') + '"' + busy) + '</div>';
  }
  return h + '<div class="actions" style="margin-top:6px">' + btn(t('ابدأ من جديد'), 'btn-quiet btn-sm', ' data-integotprestart="1"' + busy) + '</div></div>';
}
function integOtp(op, extra){
  if (!mayIntegEdit()) return;
  var u = FB.auth && FB.auth.currentUser; if (!u || !STATE.meta.online){ toast(t('يحتاج اتصالًا بالشبكة')); return; }
  if (integOtp.busy) return; integOtp.busy = true; render(1);
  u.getIdToken().then(function(tok){
    return fetch(integNow.URL + 'integOtp', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + tok }, body:JSON.stringify({ data:Object.assign({ op:op }, extra || {}) }) });
  }).then(function(r){ return r.json().catch(function(){ return {}; }); })
    .then(function(j){
      var res = (j && j.result) || {}, err = j && j.error;
      if (err) toast(t('لم يتم') + ': ' + String(err.message || '').slice(0, 80));
      else if (res.done) toast('\u{1F7E2} ' + t('اتصل — اتسحبت القراءات') + (res.matched != null ? ' \u00b7 ' + nm(res.matched) + ' ' + t('جهازًا') : ''));
      else if (res.ok && op === 'send') toast(t('اتبعت الكود'));
      else if (!res.ok && res.err) toast(t('رد المنصة') + ': ' + res.err);
      integStatusLoad(true);
    })
    .catch(function(e){ toast(t('لم يتم') + ': ' + String(e && e.message || e).slice(0, 80)); })
    .then(function(){ integOtp.busy = false; render(1); });
}
