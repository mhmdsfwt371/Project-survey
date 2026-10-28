/* ============================================================================
   FILE    : src/09-integ/09-integ-01-connections-tab.js
   DOMAIN  : Integrations — external platforms read by the cloud bridge
   PURPOSE : The office «Connections» tab: AFAQY PRO account (stored write-only), bridge status, «Refresh now».
   DEFINES : iotDashHtml, integSessionHtml, integExpiryNotify, integOtpHtml, integOtp, jobsStatusLoad, jobsCardHtml, integPubLoad, integPubOf, integAcctHtml, integStatusLoad, integStateLine, integProHtml, integNusukHtml, integStepsHtml, integMissing, integMissingHtml, integTabHtml, mayIntegEdit, integSave, integOff, integNow
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
  DB.col('settings').doc('integStatus').get().then(function(doc){ S.v = doc && doc.exists ? doc.data() : null; S.at = Date.now(); S.busy = false; integExpiryNotify(S.v && S.v.pro); if (CUR === 'sys' && tabCur('sys') === 'integ') render(1); })   /* (V40.6) */
    .catch(function(e){ S.busy = false; S.at = Date.now(); LS_ERR = e; });
}
function integStateLine(p){
  if (!p) return '<span class="pill" style="border-color:#94A3B8;color:#94A3B8">\u23F3 ' + esc(t('لم يعمل الجسرُ بعد — أول سحبٍ خلال ٥ دقائق من الحفظ')) + '</span>';
  var ago = p.at ? nm(Math.max(0, Math.round((Date.now() - p.at) / 60000))) + ' ' + t('د') : '—';
  if (p.state === 'err' && p.err === 'token') return '<span class="pill" style="border-color:#EF4444;color:#EF4444">\u{1F534} ' + esc(t('التوكين انتهى أو مرفوض — حط توكين جديد، أو احفظ اسم المستخدم وكلمة السر عشان يتجدد لوحده')) + ' \u00b7 ' + ago + '</span>';   /* (V40.0) */
  if (p.state === 'err' && p.err === 'login' && /2fa|otp|captcha|verif/i.test(String(p.msg || ''))) return '<span class="pill" style="border-color:#EF4444;color:#EF4444">\u{1F534} ' + esc(t('مش قادر أكمّل الدخول بالكود من هنا — هات التوكين من موقع أفاقي برو وحطه في خانة «التوكين»')) + ' \u00b7 ' + ago + '</span>';   /* (V40.4) */
  if (p.state === 'err' && p.err === 'refused') return '<span class="pill" style="border-color:#EF4444;color:#EF4444">\u{1F534} ' + esc(t('المنصة رفضت الجلسة حتى بعد تسجيل دخول جديد')) + (p.msg ? ' \u2014 ' + esc(p.msg) : '') + ' \u00b7 ' + ago + '</span>';   /* (V40.3) */
  if (p.state === 'code') return '<span class="pill" style="border-color:#F59E0B;color:#F59E0B">\u{1F510} ' + esc(t('المنصة طلبت كود تحقق — أكمل الخطوة تحت')) + '</span>';   /* (V39.99) */
  if (p.state === 'off') return '<span class="pill" style="border-color:#94A3B8;color:#94A3B8">\u26AA ' + esc(t('غير متصل — لا حساب محفوظ')) + '</span>';
  if (p.state === 'err') return '<span class="pill" style="border-color:#EF4444;color:#EF4444">\u{1F534} ' + esc(t('فشل')) + ': ' + esc(p.err === 'otp' ? t('المنصة طلبت كودَ تحقق — هذا الحساب عليه تأكيدٌ بخطوتين؛ استخدم حسابَ ربطٍ بلا تأكيد، أو اطلب بناءَ خطوة الكود') : p.err === 'login' ? t('الدخول رُفض — راجع اسم المستخدم وكلمة السر') + (p.msg ? ' (' + p.msg + ')' : '') : String(p.err || '')) + (p.httpStatus ? ' (' + nm(p.httpStatus) + ')' : '') + ' \u00b7 ' + esc(t('منذ')) + ' ' + ago + '</span>';
  var withImei = +p.withImei || 0, matched = +p.matched || 0;
  return '<span class="pill" style="border-color:#22C55E;color:#22C55E">\u{1F7E2} ' + esc(t('متصل')) + ' \u00b7 ' + esc(t('آخر سحب منذ')) + ' ' + ago + '</span> '
    + '<span class="pill">' + nm(matched) + ' / ' + nm(withImei) + ' ' + esc(t('جهازًا مطابَقًا برقمه')) + '</span>'
    + (p.note ? ' <span class="hint" style="margin:0">' + esc(t('لم يُسجَّل رقمُ جهازٍ بعد — يُسجَّل في «تعديل حساسات» لكل حساس وجيت واي')) + '</span>' : '')
    + (withImei && !matched && p.visible != null ? '<div class="hint" style="margin:6px 0 0;color:#F59E0B">' + esc(t('الحساب ده شايف')) + ' ' + nm(p.visible) + ' ' + esc(t('وحدة بس على أفاقي برو، ومفيش ولا واحدة من أرقامنا — غالبًا محتاج الحساب اللي شايف وحدات المشروع (اللي بتفتح بيه الموقع)')) + '</div>'   /* (V40.1) */
      : (withImei && matched < withImei ? ' <span class="hint" style="margin:0">' + esc(t('غير المطابَق: رقمٌ غير موجود في أفاقي برو أو مكتوبٌ خطأ')) + '</span>' : ''));
}
function integProHtml(){
  var S = integStatusLoad.S, p = S && S.v && S.v.pro;
  integStatusLoad();
  var busy = integNow.busy ? ' disabled' : '';
  return card('\u{1F50C} ' + t('أفاقي برو') + ' — ' + t('الحساسات والجيت واي'),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('يُسحب كلَّ ٥ دقائق بأرقام أجهزتنا وحدها، للقراءة فقط. الحسابُ يُحفظ في مكانٍ لا يقرؤه أحدٌ من التطبيق — ولا يعود إلى أي جهاز.')) + '</p>'
    + '<div style="margin:0 0 10px">' + integStateLine(p) + '</div>'
    + integSessionHtml(p)   /* (V40.6) how long the session has left */
    + (p && p.state === 'code' && mayIntegEdit() ? integOtpHtml(p) : '')   /* (V39.99) the code step */
    + (p && p.state === 'ok' && p.renew && mayIntegEdit() ? integOtpHtml({ state:'code', methods:p.methods || [], sent:!!p.renewSent, method:p.method || 'email', err:p.err || '' }) : '')   /* (V40.6) renewal while the session still works */
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
      if (name === 'afaqypro') setTimeout(function(){ integNow(); }, 600);   /* (V40.5) saving connects at once — and if the platform asks for a code, it is sent to the e-mail now */
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
      else if (res.state === 'code') toast(res.sent ? '\u2709 ' + t('اتبعت الكود على الإيميل — اكتبه في «خطوة كود التحقق»') : t('المنصة طلبت كود تحقق — أكمل الخطوة تحت'));   /* (V40.5) */
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
    + (errL ? '<div class="hint" style="margin:0 0 8px;color:#EF4444">' + esc(errL) + '</div>' : '')
    /* (V40.4) the owner: «لو مش قادر تعمل ده، طلّع لي رسالة: مش قادر — لازم تجيب التوكين» */
    + (p.err && !/^(Invalid_OTP|otp_expired|validation_error)$/.test(p.err) ? '<div class="hint" style="margin:0 0 8px;color:#F59E0B">' + esc(t('مش قادر أكمّل الدخول بالكود من هنا — هات التوكين من موقع أفاقي برو وحطه في خانة «التوكين»')) + ' ' + btn('\u270E ' + t('حط التوكين'), 'btn-secondary btn-sm', ' data-integedit="afaqypro"') + '</div>' : '');
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

/* (V40.6) the owner: «محتاج كل مرة أفتح البرنامج أكتب يوزر وباسورد؟ ولا التوكين موجود؟ ويكون عندي تايمر قدامه قد إيه ويقلّ
   كل يوم، ولما ينتهي عرّفني». Nothing is typed when the app opens — the session lives on the server and the bridge pulls
   every 5 minutes. The card shows the session's end (from the token itself) with the days left; two days before, the
   bridge starts the renewal by itself; and admins/engineers get a notification with 7 days, 3 days and one day left, and at the end. */
function integSessionHtml(p){
  if (!p || !p.tokExp) return '';
  var left = p.tokExp - Date.now(), d = Math.floor(left / 86400000), h = Math.max(0, Math.floor((left % 86400000) / 3600000));
  var col = left <= 0 ? '#EF4444' : d < 2 ? '#EF4444' : d < 7 ? '#F59E0B' : '#22C55E';
  var when = fmtDate(p.tokExp, { day:'numeric', month:'long' }) + ' ' + fmtTime(p.tokExp);
  var line = left <= 0 ? '\u{1F534} ' + t('الجلسة انتهت') + ' \u2014 ' + t('اضغط «حدّث الآن»: الكود هيوصل إيميلك، تكتبه وتضغط «تحقق»، وتبدأ جلسة جديدة لمدة ٣٠ يوم')
    : '\u{1F511} ' + t('الجلسة صالحة لحد') + ' ' + when + ' \u00b7 ' + t('فاضل') + ' ' + nm(d) + ' ' + t('يوم') + (d < 2 ? ' ' + nm(h) + ' ' + t('ساعة') : '');
  var pct = Math.max(0, Math.min(100, Math.round(left / (30 * 86400000) * 100)));
  return '<div style="margin:0 0 10px"><div class="hint" style="margin:0 0 4px;color:' + col + '">' + esc(line) + '</div>'
    + (left > 0 ? '<div style="height:6px;border-radius:4px;background:rgba(148,163,184,.25);overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + col + '"></div></div>' : '')
    + (left > 0 && d < 2 ? '<div class="hint" style="margin:4px 0 0">' + esc(p.renew ? t('التجديد بدأ: الكود اتبعت على إيميلك — اكتبه تحت وجلستك الحالية شغّالة لحد ما تخلص') : t('التجديد بيبدأ لوحده خلال ساعات: الكود هيوصل إيميلك')) + '</div>' : '')
    + '</div>';
}
function integExpiryNotify(p){
  if (!p || !p.tokExp || !mayIntegEdit() || typeof notifPush !== 'function') return;
  var left = p.tokExp - Date.now(), d = left / 86400000, step = left <= 0 ? 0 : d <= 1 ? 1 : d <= 3 ? 3 : d <= 7 ? 7 : -1;
  if (step < 0) return;
  var key = 'nsk14.integExp', mark = p.tokExp + ':' + step, seen = '';
  try { seen = localStorage.getItem(key) || ''; } catch (e){ LS_ERR = e; }
  if (seen === mark) return;
  try { localStorage.setItem(key, mark); } catch (e2){ LS_ERR = e2; }
  notifPush(t('ربط أفاقي برو'), step === 0 ? t('جلسة أفاقي برو انتهت — افتح «الربط» واضغط «حدّث الآن»، والكود هيوصل إيميلك') : t('جلسة أفاقي برو تنتهي خلال') + ' ' + nm(step) + ' ' + t('يوم') + ' \u2014 ' + t('التجديد بيبدأ لوحده قبل يومين والكود هيوصل إيميلك'), { lv:'مهم' });
}

/* (V40.7) the owner: «محتاج داشبورد لتحديث الأجهزة والحساسات — إيه اللي محدّث وإيه اللي مش محدّث، باسم النقطة أو اسم الحساس
   والسيريال اللي مكتوب عليه … لما العدد يبقى بالـ500 والـ1000 والـ5000 محتاج حاجة سهلة توضّح كل حاجة». Every planned device
   (each camp's gateways and sensors) against the AFAQY PRO bridge's last pull: fresh under 20 minutes, late under 2 hours,
   offline beyond; on the platform without a reading; a serial the platform does not know; no serial at all. Counts on top
   (each one a filter), the points with the most trouble, search by point / device / serial / platform name, problems first
   and oldest first, 100 rows at a time, and the filtered list to Excel. One global: its helpers hang on the function. */
function iotDashHtml(){
  var F = iotDashHtml.F || (iotDashHtml.F = { st:'bad', kind:'all', q:'', n:100, sort:'old' });
  var L = IOT.live; if (!L || Date.now() - (L.at || 0) > 60000) liveIotLoad(true);
  var all = iotDashHtml.rows(), cnt = { all:all.length, bad:0, ok:0, late:0, off:0, nor:0, nof:0, nos:0 };
  all.forEach(function(r){ cnt[r.st]++; if (r.st !== 'ok') cnt.bad++; });
  var lv = L && L.v, pull = lv && lv.at ? Date.now() - lv.at : -1;
  var q = String(F.q || '').trim().toLowerCase();
  var rows = all.filter(function(r){
    if (F.st === 'bad' ? r.st === 'ok' : (F.st !== 'all' && r.st !== F.st)) return false;
    if (F.kind !== 'all' && r.kind !== F.kind) return false;
    return !q || (r.pn + ' ' + r.camp + ' ' + r.did + ' ' + r.ser + ' ' + r.pnm + ' ' + r.room).toLowerCase().indexOf(q) > -1;
  });
  var rank = { off:0, late:1, nof:2, nor:3, nos:4, ok:5 };
  rows.sort(F.sort === 'name' ? function(a, b){ return a.pn < b.pn ? -1 : a.pn > b.pn ? 1 : (a.did < b.did ? -1 : 1); }
    : function(a, b){ return (rank[a.st] - rank[b.st]) || ((a.at || 0) - (b.at || 0)); });
  var chip = function(k, ic, lab, col){ var on = F.st === k;
    return '<button class="btn btn-sm ' + (on ? 'btn-primary' : 'btn-secondary') + '" data-iotd="st:' + k + '" style="' + (col && !on ? 'border-color:' + col + ';' : '') + '">' + ic + ' ' + esc(t(lab)) + ' <b class="num">' + nm(cnt[k]) + '</b></button>'; };
  var head = '<div class="hint" style="margin:0 0 8px">' + esc(pull < 0 ? t('لسه مفيش سحب من أفاقي برو — راجع تبويب «الربط»') : t('آخر سحب من أفاقي برو') + ': ' + iotDashHtml.age(pull) + ' \u00b7 ' + t('بيتجدد كل ٥ دقايق')) + '</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px">'
    + chip('bad', '\u26A0\uFE0F', 'محتاج تدخّل', '#F59E0B') + chip('ok', '\u{1F7E2}', 'محدّث', '#22C55E') + chip('late', '\u{1F7E1}', 'متأخر', '#EAB308') + chip('off', '\u{1F534}', 'منقطع', '#EF4444')
    + chip('nof', '\u26AB', 'السيريال مش على المنصة', '') + chip('nor', '\u26AA', 'على المنصة بلا قراءة', '') + chip('nos', '\u25FB', 'بلا سيريال', '') + chip('all', '\u{1F4CB}', 'الكل', '') + '</div>';
  var byCamp = {}; all.forEach(function(r){ if (r.st === 'ok') return; var b = byCamp[r.camp] || (byCamp[r.camp] = { pn:r.pn, n:0, off:0, late:0 }); b.n++; if (r.st === 'off') b.off++; if (r.st === 'late') b.late++; });
  var worst = Object.keys(byCamp).map(function(k){ return [k, byCamp[k]]; }).sort(function(a, b){ return (b[1].off - a[1].off) || (b[1].n - a[1].n); }).slice(0, 8);
  var top = worst.length ? '<div class="hint" style="margin:0 0 4px">' + esc(t('أكتر النقط محتاجة تدخّل')) + ':</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px">'
    + worst.map(function(w){ return '<button class="btn btn-quiet btn-sm" data-iotd="q:' + esc(w[0]) + '">' + esc(w[1].pn) + ' \u00b7 <b class="num">' + nm(w[1].n) + '</b>' + (w[1].off ? ' \u{1F534}' + nm(w[1].off) : '') + '</button>'; }).join('') + '</div>' : '';
  var kb = function(k, lab){ return '<button class="btn btn-sm ' + (F.kind === k ? 'btn-primary' : 'btn-quiet') + '" data-iotd="kind:' + k + '">' + esc(t(lab)) + '</button>'; };
  var sb = function(k, lab){ return '<button class="btn btn-sm ' + (F.sort === k ? 'btn-primary' : 'btn-quiet') + '" data-iotd="sort:' + k + '">' + esc(t(lab)) + '</button>'; };
  var tools = '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px">'
    + '<input class="in" id="iotdQ" style="max-width:280px" placeholder="' + esc(t('دوّر باسم النقطة أو رقم الجهاز أو السيريال')) + '" value="' + esc(F.q || '') + '">'
    + (F.q ? btn('\u2715 ' + t('امسح البحث'), 'btn-quiet btn-sm', ' data-iotd="q:"') : '')
    + kb('all', 'الكل') + kb('s', 'حساسات') + kb('g', 'جيت واي') + '<span style="width:8px"></span>' + sb('old', 'المشاكل والأقدم الأول') + sb('name', 'بالاسم')
    + btn('\u2B07 ' + t('إكسل'), 'btn-secondary btn-sm', ' data-iotd="xlsx"') + btn('\u21BB ' + t('حدّث الآن'), 'btn-quiet btn-sm', ' data-iotd="refresh"') + '</div>';
  var lab = { ok:['\u{1F7E2}', 'محدّث'], late:['\u{1F7E1}', 'متأخر'], off:['\u{1F534}', 'منقطع'], nor:['\u26AA', 'على المنصة بلا قراءة'], nof:['\u26AB', 'السيريال مش على المنصة'], nos:['\u25FB', 'بلا سيريال'] };
  var body = rows.slice(0, F.n).map(function(r){
    var v = r.v || {}, val = [];
    if (r.kind === 's'){ if (v.temp != null) val.push(nm(v.temp) + '\u00B0'); if (v.hum != null) val.push(nm(v.hum) + '\u066A'); if (v.bat != null) val.push('\u{1F50B}' + nm(v.bat)); }
    else { if (v.ext_bat != null) val.push('\u{1F50C}' + nm(v.ext_bat)); if (v.int_bat != null) val.push('\u{1F50B}' + nm(v.int_bat)); if (v.ext_bat == null && v.int_bat == null && v.bat != null) val.push('\u{1F50B}' + nm(v.bat)); }
    return '<tr><td>' + esc(r.pn) + '</td><td dir="ltr">' + esc(r.did) + (r.room ? ' <span class="hint" style="margin:0">' + esc(r.room) + '</span>' : '') + '</td><td>' + esc(t(r.kind === 's' ? 'حساس' : 'جيت واي')) + '</td>'
      + '<td dir="ltr">' + (r.ser ? esc(r.ser) : '\u2014') + '</td><td dir="ltr">' + (r.pnm ? esc(r.pnm) : '\u2014') + '</td>'
      + '<td>' + (r.at ? iotDashHtml.age(Date.now() - r.at) : '\u2014') + '</td><td>' + (val.length ? esc(val.join(' \u00b7 ')) : '\u2014') + '</td>'
      + '<td>' + lab[r.st][0] + ' ' + esc(t(lab[r.st][1])) + '</td></tr>';
  }).join('');
  var table = rows.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>' + [t('النقطة'), t('الجهاز'), t('النوع'), t('السيريال'), t('الاسم على المنصة'), t('آخر تحديث'), t('القراءة الحالية'), t('الحالة')].map(esc).join('</th><th>') + '</th></tr></thead><tbody>' + body + '</tbody></table></div>'
      + '<div class="hint" style="margin:6px 0 0">' + esc(t('معروض')) + ' ' + nm(Math.min(F.n, rows.length)) + ' ' + esc(t('من')) + ' ' + nm(rows.length) + (rows.length > F.n ? ' ' + btn(t('اعرض ١٠٠ كمان'), 'btn-secondary btn-sm', ' data-iotd="more"') : '') + '</div>'
    : '<div class="hint">' + esc(cnt.all ? t('مفيش أجهزة بالفلتر ده') : t('لسه مفيش خطة حساسات في أي مخيم')) + '</div>';
  return '<div class="card"><div class="card-h"><div class="card-t">\u{1F4E1} ' + esc(t('تحديث الأجهزة والحساسات')) + ' <span class="hint" style="margin:0">' + nm(cnt.all) + ' ' + esc(t('جهاز')) + '</span></div></div><div class="card-b">' + head + top + tools + table + '</div></div>';
}
iotDashHtml.rows = function(){
  var U = (IOT.live && IOT.live.v && IOT.live.v.units) || {}, now = Date.now(), out = [];
  iotCampIds().forEach(function(id){ var c = iotOf(id); if (!c) return; var x = siteFind(id), pn = x ? (x.name || id) : id;
    var add = function(kind, did, m){ var ser = String((m && m.serial) || '').trim(), L = ser ? U[ser.toLowerCase()] : null, at = L && L.t ? +L.t : 0;
      out.push({ camp:id, pn:String(pn), did:did, kind:kind, ser:ser, room:(m && m.room) || '', pnm:L ? String(L.nm || '') : '', at:at, v:L ? (L.v || {}) : null,
        st:!ser ? 'nos' : !L ? 'nof' : !at ? 'nor' : now - at < 1200000 ? 'ok' : now - at < 7200000 ? 'late' : 'off' }); };
    iotAllGw(c).forEach(function(g, j){ add('g', iotGid(id, c, j), (c.gm || [])[j] || {}); });
    (c.sensors || []).forEach(function(q2, i){ add('s', iotSid(id, c, i), (c.sm || [])[i] || {}); });
  });
  return out;
};
iotDashHtml.age = function(ms){ var m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? t('منذ') + ' ' + nm(m) + ' ' + t('د') : m < 2880 ? t('منذ') + ' ' + nm(Math.round(m / 60)) + ' ' + t('ساعة') : t('منذ') + ' ' + nm(Math.round(m / 1440)) + ' ' + t('يوم'); };
iotDashHtml.act = function(a){
  var F = iotDashHtml.F || (iotDashHtml.F = { st:'bad', kind:'all', q:'', n:100, sort:'old' }), k = a.split(':')[0], v = a.slice(k.length + 1);
  if (k === 'st'){ F.st = v; F.n = 100; } else if (k === 'kind'){ F.kind = v; F.n = 100; } else if (k === 'sort') F.sort = v;
  else if (k === 'q'){ F.q = v; F.n = 100; if (v) F.st = 'all'; } else if (k === 'more') F.n += 100;
  else if (k === 'refresh'){ liveIotLoad(true); toast(t('بيتحدّث…')); }
  else if (k === 'xlsx'){
    var lab = { ok:'محدّث', late:'متأخر', off:'منقطع', nor:'على المنصة بلا قراءة', nof:'السيريال مش على المنصة', nos:'بلا سيريال' };
    var R = iotDashHtml.rows().map(function(r){ var v = r.v || {}; return [r.pn, r.camp, r.did, t(r.kind === 's' ? 'حساس' : 'جيت واي'), r.room, r.ser, r.pnm, r.at ? fmtDT(r.at) : '', v.temp != null ? v.temp : '', v.hum != null ? v.hum : '', v.bat != null ? v.bat : '', v.ext_bat != null ? v.ext_bat : '', v.int_bat != null ? v.int_bat : '', t(lab[r.st])]; });
    if (typeof mtXlsx === 'function') mtXlsx('تحديث الحساسات', ['النقطة', 'رقم المخيم', 'رقم الجهاز', 'النوع', 'الغرفة', 'السيريال', 'الاسم على المنصة', 'آخر تحديث', 'درجة الحرارة', 'الرطوبة', 'البطارية', 'بطارية خارجية', 'بطارية داخلية', 'الحالة'], R);
    return;
  }
  render(1);
};
