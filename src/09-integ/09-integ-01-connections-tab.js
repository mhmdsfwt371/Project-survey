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
    + (function(){   /* (V40.8) can the cloud reach the Nusuk API? measured hourly, without any account */
        var S = integStatusLoad.S, r = S && S.v && S.v.nusukReach; if (!r || !r.at) return '';
        var ok = !r.cf && (r.st === 401 || r.st === 403 || r.st === 200);
        return '<div class="hint" style="margin:0 0 8px;color:' + (r.cf ? '#EF4444' : ok ? '#22C55E' : '#F59E0B') + '">' + (r.cf ? '\u26D4 ' + esc(t('منصة نسك بتقفل الطلبات اللي جاية من السحابة (حماية Cloudflare) قبل أي دخول — محتاجين فريقهم يفتحوا لنا الباب')) : ok ? '\u2705 ' + esc(t('منصة نسك بترد على السحابة — الباب مفتوح، ومستني خطوات الدخول')) : '\u26A0\uFE0F ' + esc(t('منصة نسك ما ردّتش على السحابة')) + ' (' + nm(r.st) + ')') + ' \u00b7 ' + esc(t('آخر فحص')) + ' ' + iotDashHtml.age(Date.now() - r.at) + '</div>';
      })()
    + (function(){   /* (V41.0) option «ب»: can THIS browser reach the Nusuk card hosts? (the cloud cannot — Cloudflare) */
        var R = integNusukHtml.R, row = function(lab, x){ return '<div class="hint" style="margin:0 0 2px">' + esc(t(lab)) + ': ' + (!x ? '\u2026' : x.ok ? '\u2705 ' + esc(t('وصل')) : x.st === 401 ? '\u{1F511} ' + esc(t('وصل — محتاج توكين')) : x.st === 403 ? '\u26D4 ' + esc(t('ممنوع')) + ' (403)' : x.st ? '\u26A0\uFE0F ' + nm(x.st) : '\u26D4 ' + esc(t('المتصفح منعه')) + ' (' + esc(x.err || '') + ')') + '</div>'; };
        return (mayIntegEdit() ? '<div class="actions" style="margin:0 0 8px">' + btn('\u{1F9EA} ' + t('جرّب الوصول لنسك من الجهاز ده'), 'btn-secondary btn-sm', ' data-nsktest="1"' + (R && R.busy ? ' disabled' : '')) + '</div>' : '')
          + (R ? '<div style="margin:0 0 8px">' + row('قائمة القرّاء', R.a) + row('المخيمات', R.b) + '</div>' : '');
      })()
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
  /* (V40.9) the owner: «ليه ٢٦ حساس بس؟ احنا ضايفين فوق ٨٠٠٠» — the camps' full plan (layers/mina-sensors.json) loads only
     with the map's sensors layer, so this page saw only the two edited camps. It loads it now. And: «فلتر بالمخيم الأول …
     تاب للمخيمات وتاب للحساسات وتاب للجيت واي؛ أضغط المخيم يطلع بوب فيه حساساته والجيت واي؛ والحساس والجيت واي ليهم بوب
     للقراءة والتعديل». */
  var F = iotDashHtml.F || (iotDashHtml.F = { tab:'camps', st:'all', zone:'all', q:'', n:100, sort:'old', pop:null });
  if (!F.tab) F.tab = 'camps';
  if (typeof iotLoad === 'function') iotLoad();   /* lives in the office part — a field device before it arrives just waits */
  var L = IOT.live; if (!F.pop && (!L || Date.now() - (L.at || 0) > 60000)) liveIotLoad(true);   /* not while a popup is being edited — a redraw would drop what is typed */
  var all = iotDashHtml.rows(), lv = L && L.v, pull = lv && lv.at ? Date.now() - lv.at : -1;
  var zones = {}; all.forEach(function(r){ zones[r.zone] = 1; });
  var inZone = function(r){ return F.zone === 'all' || r.zone === F.zone; };
  var q = String(F.q || '').trim().toLowerCase();
  var cS = all.filter(function(r){ return r.kind === 's'; }).length, cG = all.length - cS;
  var camps = iotDashHtml.camps(all);
  var tb = function(k, ic, lab, n){ return '<button class="btn ' + (F.tab === k ? 'btn-primary' : 'btn-secondary') + '" data-iotd="tab:' + k + '">' + ic + ' ' + esc(t(lab)) + ' <b class="num">' + nm(n) + '</b></button>'; };
  var zb = function(k, lab){ return '<button class="btn btn-sm ' + (F.zone === k ? 'btn-primary' : 'btn-quiet') + '" data-iotd="zone:' + esc(k) + '">' + esc(t(lab)) + '</button>'; };
  var head = '<div class="hint" style="margin:0 0 8px">' + esc(pull < 0 ? t('لسه مفيش سحب من أفاقي برو — راجع تبويب «الربط»') : t('آخر سحب من أفاقي برو') + ': ' + iotDashHtml.age(pull) + ' \u00b7 ' + t('بيتجدد كل ٥ دقايق')) + (IOT.data ? '' : ' \u00b7 ' + t('بيحمّل خطة المخيمات…')) + '</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px">' + tb('camps', '\u26FA', 'المخيمات', camps.length) + tb('s', '\u{1F321}', 'الحساسات', cS) + tb('g', '\u{1F4F6}', 'الجيت واي', cG) + '</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px">' + zb('all', 'كل المناطق') + Object.keys(zones).sort().map(function(z){ return zb(z, z || 'بلا منطقة'); }).join('')
    + '<input class="in" id="iotdQ" style="max-width:280px" placeholder="' + esc(t(F.tab === 'camps' ? 'رقم المخيم أو اسمه (مثلًا 2/212)' : 'دوّر باسم النقطة أو رقم الجهاز أو السيريال')) + '" value="' + esc(F.q || '') + '">'
    + (F.q ? btn('\u2715 ' + t('امسح البحث'), 'btn-quiet btn-sm', ' data-iotd="q:"') : '') + btn('\u2B07 ' + t('إكسل'), 'btn-quiet btn-sm', ' data-iotd="xlsx"') + btn('\u21BB ' + t('حدّث الآن'), 'btn-quiet btn-sm', ' data-iotd="refresh"') + '</div>';
  var body = F.tab === 'camps' ? iotDashHtml.campsHtml(camps.filter(function(c){ return (F.zone === 'all' || c.zone === F.zone) && (!q || c.key.indexOf(q) > -1); }), F)
    : iotDashHtml.devHtml(all.filter(function(r){ return r.kind === F.tab && inZone(r) && (!q || (r.pn + ' ' + r.camp + ' ' + r.did + ' ' + r.ser + ' ' + r.pnm + ' ' + r.room).toLowerCase().indexOf(q) > -1); }), F);
  return card('\u{1F4E1} ' + t('تحديث الأجهزة والحساسات') + ' \u00b7 ' + nm(all.length) + ' ' + t('جهاز'), head + body) + iotDashHtml.popHtml(F, all);
}
iotDashHtml.LAB = { ok:['\u{1F7E2}', 'محدّث'], late:['\u{1F7E1}', 'متأخر'], off:['\u{1F534}', 'منقطع'], nor:['\u26AA', 'على المنصة بلا قراءة'], nof:['\u26AB', 'السيريال مش على المنصة'], nos:['\u25FB', 'بلا سيريال'] };
/* (V41.1) owner: «فيه parameter اسمه rssi … عاوز أعرف أستخدمه إزاي في منى، مش مجرد الـvalue». RSSI is how strongly the gateway
   heard the sensor (dBm; closer to 0 is stronger). Bands for the LoRaWAN link of a sensor, from field-test guidance (RAK: target
   above −90 post-deployment, below −120 unusable; a common LoRaWAN rule: good above −115 with SNR above −7, at the limit at
   −120 or SNR −13): strong ≥ −90 · acceptable to −110 · weak to −120 · critical below. SNR ≤ −10 means radio noise. Sensors
   only — the signal of a gateway itself is cellular, on another scale. */
iotDashHtml.sig = function(r){ var v = r && r.v, x = v && v.rssi; if (r.kind !== 's' || x == null) return null;
  return { k:x >= -90 ? 'good' : x > -110 ? 'ok' : x > -120 ? 'weak' : 'crit', x:x, noisy:v.snr != null && v.snr <= -10 }; };
iotDashHtml.SIG = { good:['\u{1F7E2}', 'قوية'], ok:['\u{1F7E1}', 'مقبولة'], weak:['\u{1F7E0}', 'ضعيفة'], crit:['\u{1F534}', 'حرجة'] };
iotDashHtml.sigCell = function(r){ var g = iotDashHtml.sig(r); return g ? iotDashHtml.SIG[g.k][0] + ' <span class="num" dir="ltr">' + nm(g.x) + '</span>' + (g.noisy ? ' \u26A1' : '') : '\u2014'; };
iotDashHtml.sigWhy = function(r){ var g = iotDashHtml.sig(r); if (!g) return '';
  var say = { good:'الإشارة قوية — مفيش مشكلة تغطية', ok:'الإشارة مقبولة — تابعها، ولو الحساس بيقطع قرّبه من الجيت واي', weak:'الإشارة ضعيفة — الحساس على حدود التغطية: قرّبه من الجيت واي، أو ارفع الجيت واي، أو شيل العائق اللي بينهم', crit:'الإشارة حرجة — غالبًا هيقطع: انقل الجيت واي أو ضيف واحد للمخيم' }[g.k];
  var off = r.st === 'off' || r.st === 'late';
  var why = off ? (g.k === 'weak' || g.k === 'crit' ? 'انقطع وآخر إشارة كانت ضعيفة — غالبًا مشكلة تغطية مش عطل' : 'انقطع وإشارته كانت كويسة — غالبًا بطارية أو عطل في الحساس، أو الجيت واي نفسه واقف لو كل حساسات المخيم وقفت') : '';
  return '<div class="hint" style="margin:0 0 8px">' + iotDashHtml.SIG[g.k][0] + ' ' + esc(t(say)) + (g.noisy ? '<br>\u26A1 ' + esc(t('وفيه تشويش على الإشارة: بعّد الجيت واي عن الكهربا والمعدات')) : '') + (why ? '<br><b>' + esc(t(why)) + '</b>' : '') + '</div>'; };
iotDashHtml.bad = function(st){ return st === 'late' || st === 'off' || st === 'nor' || st === 'nof'; };   /* a planned device with no serial yet is not «broken» — it is just not registered */
iotDashHtml.val = function(r){ var v = r.v || {}, o = [];
  if (r.kind === 's'){ if (v.temp != null) o.push(nm(v.temp) + '\u00B0'); if (v.hum != null) o.push(nm(v.hum) + '\u066A'); if (v.bat != null) o.push('\u{1F50B}' + nm(v.bat)); }
  else { if (v.ext_bat != null) o.push('\u{1F50C}' + nm(v.ext_bat)); if (v.int_bat != null) o.push('\u{1F50B}' + nm(v.int_bat)); if (v.ext_bat == null && v.int_bat == null && v.bat != null) o.push('\u{1F50B}' + nm(v.bat)); }
  return o.join(' \u00b7 '); };
iotDashHtml.camps = function(all){
  var M = {}, out = [];
  all.forEach(function(r){ var c = M[r.camp] || (M[r.camp] = { id:r.camp, pn:r.pn, zone:r.zone, key:'', s:0, g:0, sOk:0, gOk:0, bad:0, ser:0, at:0 });
    if (r.kind === 's'){ c.s++; if (r.st === 'ok') c.sOk++; } else { c.g++; if (r.st === 'ok') c.gOk++; }
    if (iotDashHtml.bad(r.st)) c.bad++; if (r.ser) c.ser++; if (r.at > c.at) c.at = r.at;
    var g = iotDashHtml.sig(r); if (g && (c.wr == null || g.x < c.wr.x)) c.wr = r; });   /* (V41.1) the weakest sensor of the camp — the weak spot of the gateway placement */
  Object.keys(M).forEach(function(k){ var c = M[k], x = siteFind(k) || {};
    c.key = (c.pn + ' ' + k + ' ' + [x.code, x.co, x.company, x.op, x.operator, x.sp].filter(Boolean).join(' ')).toLowerCase();
    c.st = c.bad ? 'bad' : !c.ser ? 'nos' : (c.sOk + c.gOk) === c.ser ? 'ok' : 'part'; out.push(c); });
  return out;
};
iotDashHtml.campsHtml = function(list, F){
  var cnt = { all:list.length, bad:0, ok:0, part:0, nos:0 }; list.forEach(function(c){ cnt[c.st]++; });
  var chip = function(k, ic, lab){ return '<button class="btn btn-sm ' + (F.st === k ? 'btn-primary' : 'btn-secondary') + '" data-iotd="st:' + k + '">' + ic + ' ' + esc(t(lab)) + ' <b class="num">' + nm(cnt[k] || 0) + '</b></button>'; };
  var rows = list.filter(function(c){ return F.st === 'all' || F.st === c.st; });
  var rank = { bad:0, part:1, ok:2, nos:3 };
  rows.sort(F.sort === 'name' ? function(a, b){ return a.pn < b.pn ? -1 : 1; } : function(a, b){ return (rank[a.st] - rank[b.st]) || (b.bad - a.bad) || (a.pn < b.pn ? -1 : 1); });
  var sl = { bad:'\u26A0\uFE0F ' + t('محتاج تدخّل'), part:'\u{1F7E1} ' + t('جزء محدّث'), ok:'\u{1F7E2} ' + t('كله محدّث'), nos:'\u25FB ' + t('لسه بلا سيريالات') };
  var tr = rows.slice(0, F.n).map(function(c){
    return '<tr data-iotd="pop:camp:' + esc(c.id) + '" style="cursor:pointer"><td>' + esc(c.pn) + '</td><td>' + esc(c.zone || '\u2014') + '</td>'
      + '<td class="num">' + nm(c.sOk) + ' / ' + nm(c.s) + '</td><td class="num">' + nm(c.gOk) + ' / ' + nm(c.g) + '</td><td class="num">' + (c.bad ? nm(c.bad) : '\u2014') + '</td>'
      + '<td>' + (c.at ? iotDashHtml.age(Date.now() - c.at) : '\u2014') + '</td><td>' + (c.wr ? iotDashHtml.sigCell(c.wr) : '\u2014') + '</td><td>' + esc(sl[c.st]) + '</td></tr>'; }).join('');
  return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px">' + chip('all', '\u{1F4CB}', 'الكل') + chip('bad', '\u26A0\uFE0F', 'محتاج تدخّل') + chip('part', '\u{1F7E1}', 'جزء محدّث') + chip('ok', '\u{1F7E2}', 'كله محدّث') + chip('nos', '\u25FB', 'لسه بلا سيريالات') + '</div>'
    + (rows.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>' + [t('المخيم'), t('المنطقة'), t('الحساسات المحدّثة'), t('الجيت واي المحدّث'), t('محتاج تدخّل'), t('آخر تحديث'), t('أضعف إشارة'), t('الحالة')].map(esc).join('</th><th>') + '</th></tr></thead><tbody>' + tr + '</tbody></table></div>'
      + iotDashHtml.more(rows.length, F) : '<div class="hint">' + esc(t('مفيش مخيمات بالفلتر ده')) + '</div>');
};
iotDashHtml.devHtml = function(list, F){
  var cnt = { all:list.length, bad:0, ok:0, late:0, off:0, nor:0, nof:0, nos:0 }; list.forEach(function(r){ cnt[r.st]++; if (iotDashHtml.bad(r.st)) cnt.bad++; });
  var LB = iotDashHtml.LAB, chip = function(k, ic, lab){ return '<button class="btn btn-sm ' + (F.st === k ? 'btn-primary' : 'btn-secondary') + '" data-iotd="st:' + k + '">' + ic + ' ' + esc(t(lab)) + ' <b class="num">' + nm(cnt[k] || 0) + '</b></button>'; };
  cnt.sig = list.filter(function(r){ var g = iotDashHtml.sig(r); return g && (g.k === 'weak' || g.k === 'crit'); }).length;
  var rows = list.filter(function(r){ if (F.st === 'sig'){ var g = iotDashHtml.sig(r); return !!(g && (g.k === 'weak' || g.k === 'crit')); } return F.st === 'all' || (F.st === 'bad' ? iotDashHtml.bad(r.st) : r.st === F.st); });
  var rank = { off:0, late:1, nof:2, nor:3, ok:4, nos:5 };
  rows.sort(F.sort === 'name' ? function(a, b){ return a.pn < b.pn ? -1 : a.pn > b.pn ? 1 : (a.did < b.did ? -1 : 1); } : function(a, b){ return (rank[a.st] - rank[b.st]) || ((a.at || 0) - (b.at || 0)); });
  var tr = rows.slice(0, F.n).map(function(r){
    return '<tr data-iotd="pop:dev:' + esc(r.camp) + ':' + r.kind + ':' + r.i + '" style="cursor:pointer"><td>' + esc(r.pn) + '</td><td dir="ltr">' + esc(r.did) + (r.room ? ' <span class="hint" style="margin:0">' + esc(r.room) + '</span>' : '') + '</td>'
      + '<td dir="ltr">' + (r.ser ? esc(r.ser) : '\u2014') + '</td><td>' + (r.at ? iotDashHtml.age(Date.now() - r.at) : '\u2014') + '</td><td>' + (esc(iotDashHtml.val(r)) || '\u2014') + '</td><td>' + iotDashHtml.sigCell(r) + '</td><td>' + LB[r.st][0] + ' ' + esc(t(LB[r.st][1])) + '</td></tr>'; }).join('');
  return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px">' + chip('all', '\u{1F4CB}', 'الكل') + chip('bad', '\u26A0\uFE0F', 'محتاج تدخّل') + (cnt.sig ? chip('sig', '\u{1F4F6}', 'إشارة ضعيفة') : '') + chip('ok', '\u{1F7E2}', 'محدّث') + chip('late', '\u{1F7E1}', 'متأخر') + chip('off', '\u{1F534}', 'منقطع')
    + chip('nof', '\u26AB', 'السيريال مش على المنصة') + chip('nor', '\u26AA', 'على المنصة بلا قراءة') + chip('nos', '\u25FB', 'بلا سيريال') + '</div>'
    + (rows.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>' + [t('المخيم'), t('الجهاز'), t('السيريال'), t('آخر تحديث'), t('القراءة الحالية'), t('الإشارة'), t('الحالة')].map(esc).join('</th><th>') + '</th></tr></thead><tbody>' + tr + '</tbody></table></div>'
      + iotDashHtml.more(rows.length, F) : '<div class="hint">' + esc(t('مفيش أجهزة بالفلتر ده')) + '</div>');
};
iotDashHtml.more = function(n, F){ return '<div class="hint" style="margin:6px 0 0">' + esc(t('معروض')) + ' ' + nm(Math.min(F.n, n)) + ' ' + esc(t('من')) + ' ' + nm(n) + (n > F.n ? ' ' + btn(t('اعرض ١٠٠ كمان'), 'btn-secondary btn-sm', ' data-iotd="more"') : '') + '</div>'; };
iotDashHtml.popHtml = function(F, all){
  var P = F.pop; if (!P) return '';
  var LB = iotDashHtml.LAB, x = siteFind(P.camp), pn = x ? (x.name || P.camp) : P.camp, close = btn('\u2715', 'btn-quiet btn-sm', ' data-iotd="close" aria-label="' + esc(t('إغلاق')) + '"');
  var box = function(title, inner){ return '<div class="svq-back" role="dialog" aria-modal="true" data-iotd="close"><div class="svq-box" data-iotd="keep" style="max-width:720px;max-height:86vh;overflow:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 8px"><b>' + title + '</b>' + close + '</div>' + inner + '</div></div>'; };
  if (P.t === 'camp'){
    var mine = all.filter(function(r){ return r.camp === P.camp; });
    var list = function(kind){ var L2 = mine.filter(function(r){ return r.kind === kind; });
      return L2.length ? '<table class="tbl"><tbody>' + L2.map(function(r){ return '<tr data-iotd="pop:dev:' + esc(r.camp) + ':' + r.kind + ':' + r.i + '" style="cursor:pointer"><td dir="ltr">' + esc(r.did) + (r.room ? ' <span class="hint" style="margin:0">' + esc(r.room) + '</span>' : '') + '</td><td dir="ltr">' + (r.ser ? esc(r.ser) : '\u2014') + '</td><td>' + (esc(iotDashHtml.val(r)) || '\u2014') + '</td><td>' + iotDashHtml.sigCell(r) + '</td><td>' + (r.at ? iotDashHtml.age(Date.now() - r.at) : '\u2014') + '</td><td>' + LB[r.st][0] + ' ' + esc(t(LB[r.st][1])) + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="hint">\u2014</div>'; };
    var nS = mine.filter(function(r){ return r.kind === 's'; }).length;
    return box('\u26FA ' + esc(pn), '<div class="hint" style="margin:0 0 6px">' + esc(t('اضغط أي جهاز لقراءته وتعديله')) + '</div>'
      + '<div style="margin:6px 0 4px"><b>\u{1F4F6} ' + esc(t('الجيت واي')) + ' (' + nm(mine.length - nS) + ')</b></div>' + list('g')
      + '<div style="margin:12px 0 4px"><b>\u{1F321} ' + esc(t('الحساسات')) + ' (' + nm(nS) + ')</b></div>' + list('s'));
  }
  var r = all.filter(function(q2){ return q2.camp === P.camp && q2.kind === P.k && q2.i === +P.i; })[0]; if (!r) return '';
  var c = iotOf(P.camp) || {}, m = (P.k === 's' ? (c.sm || [])[r.i] : (c.gm || [])[r.i]) || {}, v = r.v || {}, ed = mayIot();
  var big = function(ic, lab, val, unit){ return '<div style="flex:1;min-width:110px;border:1px solid rgba(148,163,184,.3);border-radius:10px;padding:8px;text-align:center"><div class="hint" style="margin:0">' + ic + ' ' + esc(t(lab)) + '</div><div style="font-size:1.4em;font-weight:700">' + (val != null ? nm(val) + (unit || '') : '\u2014') + '</div></div>'; };
  var cards = P.k === 's' ? big('\u{1F321}', 'درجة الحرارة', v.temp, '\u00B0') + big('\u{1F4A7}', 'الرطوبة', v.hum, '\u066A') + big('\u{1F50B}', 'البطارية', v.bat, '') + big('\u{1F4F6}', 'الإشارة', v.rssi, '')
    : big('\u{1F50C}', 'بطارية خارجية', v.ext_bat, '') + big('\u{1F50B}', 'بطارية داخلية', v.int_bat, '') + (v.ext_bat == null && v.int_bat == null ? big('\u{1F50B}', 'البطارية', v.bat, '') : '');
  var fld = function(id, lab, val){ return '<div class="field" style="margin:6px 0"><label>' + esc(t(lab)) + '</label><input class="in" id="' + id + '" dir="auto" value="' + esc(val || '') + '"' + (ed ? '' : ' disabled') + '></div>'; };
  return box((P.k === 's' ? '\u{1F321} ' : '\u{1F4F6} ') + '<span dir="ltr">' + esc(r.did) + '</span> \u00b7 ' + esc(pn),
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px">' + cards + '</div>' + iotDashHtml.sigWhy(r)
    + '<div class="hint" style="margin:0 0 8px">' + LB[r.st][0] + ' ' + esc(t(LB[r.st][1])) + ' \u00b7 ' + esc(t('آخر تحديث')) + ': ' + (r.at ? iotDashHtml.age(Date.now() - r.at) + ' (' + fmtDT(r.at) + ')' : '\u2014') + (r.pnm ? ' \u00b7 ' + esc(t('الاسم على المنصة')) + ': <span dir="ltr">' + esc(r.pnm) + '</span>' : '') + '</div>'
    + fld('iotdSer', 'السيريال', m.serial) + fld('iotdMod', 'الطراز', m.model) + (P.k === 's' ? fld('iotdRoom', 'الغرفة', m.room) : '') + fld('iotdTag', 'العلامة على الجهاز', m.tag) + fld('iotdNote', 'ملاحظة', m.note)
    + '<div class="actions" style="margin-top:8px">' + (ed ? btn('\u{1F4BE} ' + t('احفظ'), 'btn-primary', ' data-iotd="save:' + esc(P.camp) + ':' + P.k + ':' + r.i + '"') : '<span class="hint">' + esc(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')) + '</span>')
    + ' ' + btn('\u2190 ' + t('المخيم'), 'btn-quiet', ' data-iotd="pop:camp:' + esc(P.camp) + '"') + '</div>');
};
iotDashHtml.rows = function(){
  var U = (IOT.live && IOT.live.v && IOT.live.v.units) || {}, now = Date.now(), out = [];
  iotCampIds().forEach(function(id){ var c = iotOf(id); if (!c) return; var x = siteFind(id), pn = x ? (x.name || id) : id, zn = x && typeof taxOf === 'function' ? (taxOf(x).g || x.zone || '') : ((x && x.zone) || '');
    var add = function(kind, did, m, ix){ var ser = String((m && m.serial) || '').trim(), L = ser ? U[ser.toLowerCase()] : null, at = L && L.t ? +L.t : 0;
      out.push({ camp:id, pn:String(pn), zone:zn, i:ix, did:did, kind:kind, ser:ser, room:(m && m.room) || '', pnm:L ? String(L.nm || '') : '', at:at, v:L ? (L.v || {}) : null,
        st:!ser ? 'nos' : !L ? 'nof' : !at ? 'nor' : now - at < 1200000 ? 'ok' : now - at < 7200000 ? 'late' : 'off' }); };
    iotAllGw(c).forEach(function(g, j){ add('g', iotGid(id, c, j), (c.gm || [])[j] || {}, j); });
    (c.sensors || []).forEach(function(q2, i){ add('s', iotSid(id, c, i), (c.sm || [])[i] || {}, i); });
  });
  return out;
};
iotDashHtml.age = function(ms){ var m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? t('منذ') + ' ' + nm(m) + ' ' + t('د') : m < 2880 ? t('منذ') + ' ' + nm(Math.round(m / 60)) + ' ' + t('ساعة') : t('منذ') + ' ' + nm(Math.round(m / 1440)) + ' ' + t('يوم'); };
iotDashHtml.act = function(a){
  var F = iotDashHtml.F || (iotDashHtml.F = { tab:'camps', st:'all', zone:'all', q:'', n:100, sort:'old', pop:null }), k = a.split(':')[0], v = a.slice(k.length + 1);
  if (k === 'keep') return;
  if (k === 'tab'){ F.tab = v; F.st = 'all'; F.n = 100; F.q = ''; } else if (k === 'st'){ F.st = v; F.n = 100; } else if (k === 'zone'){ F.zone = v; F.n = 100; } else if (k === 'sort') F.sort = v;
  else if (k === 'q'){ F.q = v; F.n = 100; } else if (k === 'more') F.n += 100;
  else if (k === 'close') F.pop = null;
  else if (k === 'pop'){ var p = v.split(':'); F.pop = p[0] === 'camp' ? { t:'camp', camp:p.slice(1).join(':') } : { t:'dev', camp:p.slice(1, p.length - 2).join(':'), k:p[p.length - 2], i:+p[p.length - 1] }; }
  else if (k === 'save'){ iotDashHtml.save(v); return; }
  else if (k === 'refresh'){ liveIotLoad(true); toast(t('بيتحدّث…')); }
  else if (k === 'xlsx'){
    var lab = { ok:'محدّث', late:'متأخر', off:'منقطع', nor:'على المنصة بلا قراءة', nof:'السيريال مش على المنصة', nos:'بلا سيريال' };
    var R = iotDashHtml.rows().map(function(r){ var w = r.v || {}; return [r.pn, r.camp, r.zone, r.did, t(r.kind === 's' ? 'حساس' : 'جيت واي'), r.room, r.ser, r.pnm, r.at ? fmtDT(r.at) : '', w.temp != null ? w.temp : '', w.hum != null ? w.hum : '', w.bat != null ? w.bat : '', w.ext_bat != null ? w.ext_bat : '', w.int_bat != null ? w.int_bat : '', t(lab[r.st])]; });
    if (typeof mtXlsx === 'function') mtXlsx('تحديث الحساسات', ['النقطة', 'رقم المخيم', 'المنطقة', 'رقم الجهاز', 'النوع', 'الغرفة', 'السيريال', 'الاسم على المنصة', 'آخر تحديث', 'درجة الحرارة', 'الرطوبة', 'البطارية', 'بطارية خارجية', 'بطارية داخلية', 'الحالة'], R);
    return;
  }
  render(1);
};
/* the device popup's «احفظ»: the same plan the map editor writes (iotPersist), one device's fields changed */
iotDashHtml.save = function(v){
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return; }
  var p = v.split(':'), i = +p[p.length - 1], kd = p[p.length - 2], id = p.slice(0, p.length - 2).join(':'), c = iotOf(id);
  if (!c){ toast(t('لا خطّةَ حساساتٍ لهذا المخيم')); return; }
  var cp = function(q){ return [+q[0], +q[1]]; };
  var E = { id:id, gw:cp(c.gw), gws:(c.gws || []).map(cp), sensors:c.sensors.map(cp), sm:c.sensors.map(function(_, n){ return Object.assign({ id:iotSid(id, c, n), status:'مخطط' }, (c.sm || [])[n] || {}); }),
    gm:[c.gw].concat(c.gws || []).map(function(_, n){ return Object.assign({ id:iotGid(id, c, n), status:'مخطط' }, (c.gm || [])[n] || {}); }) };
  var m = kd === 's' ? E.sm[i] : E.gm[i]; if (!m){ toast(t('الجهاز مش موجود')); return; }
  var g = function(x){ var el = document.getElementById(x); return el ? String(el.value || '').trim() : null; };
  [['iotdSer', 'serial'], ['iotdMod', 'model'], ['iotdRoom', 'room'], ['iotdTag', 'tag'], ['iotdNote', 'note']].forEach(function(f){ var val = g(f[0]); if (val !== null) m[f[1]] = val; });
  if (typeof iotPersist !== 'function'){ toast(t('لحظة — باقي التطبيق لسه بيتحمّل، جرّب تاني')); return; }
  iotPersist(E);
  logEvent('تعديلُ جهازٍ من «الحساسات والجيت واي» — ' + (m.id || id) + (m.serial ? ' \u00b7 ' + m.serial : ''), id);
  toast(t('اتحفظ')); render(1);
};

/* (V40.8) the owner: «خلّي الصفحة دي في الميدان — داشبورد الحساسات والجيت واي». Its own page in the field group (admin,
   engineer, supervisor), no longer a tab under system health. */
PAGE.iotdash = { m:'الميدان', t:'الحساسات والجيت واي', l:'كلُّ جهاز: محدَّثٌ أم لا، باسم النقطة والسيريال.', body:function(){ return iotDashHtml(); } };

/* (V41.0) the owner chose option «ب» for Nusuk: pull from the office browser, since the cloud is turned away by Cloudflare
   (403, measured from the cloud on 28 Oct). V37.93's first try from the owner's phone failed — but the app's network policy
   did not list the Nusuk hosts then, so the browser itself refused; they are listed now. This asks both doors once from
   this device and says what came back: reached, reached but wants a token, forbidden, or refused by the browser. */
integNusukHtml.test = function(){
  var R = integNusukHtml.R = { busy:true }; render(1);
  var one = function(url, bearer){
    var h = {}; if (bearer && EXT.tok) h.Authorization = 'Bearer ' + EXT.tok;
    return fetch(url, { headers:h, credentials:'omit' }).then(function(r){ return { ok:r.ok, st:r.status }; }, function(e){ return { ok:false, st:0, err:String((e && e.name) || 'TypeError').slice(0, 20) }; });
  };
  var tk = typeof extTokLoad === 'function' ? extTokLoad() : Promise.resolve();
  Promise.resolve(tk).then(function(){ return Promise.all([one(PV.EXT_STREAM, false), one(PV.EXT_API + '/tents?page=1&perPage=1', true)]); })
    .then(function(x){ R.a = x[0]; R.b = x[1]; R.busy = false; R.at = Date.now(); render(1); }, function(){ R.busy = false; render(1); });
};
