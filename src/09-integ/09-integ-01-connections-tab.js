/* ═══════════════════════════════════════════════════════════════════════════
   (V39.70) تبويب «🔌 الربط» — المرحلة ١ (أفاقي برو)
   ───────────────────────────────────────────────────────────────────────────
   owner: «عاوز أحطهم في المنصة يكون ليهم مكان أضيفهم، ولما أعمل كونيكت الانتجريشن يشتغل أوتوماتيك — ٥ دقايق وزرار».
   The account is written to integ/afaqypro (engineer/admin write, nobody reads — firestore.rules); the cloud function
   (functions/index.js) pulls every 5 minutes and on «⟳ حدّث الآن», and writes its state to settings/integStatus.
   Nothing here talks to AFAQY PRO directly, and the password never comes back to any device.
   ═══════════════════════════════════════════════════════════════════════════ */

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
  if (p.state === 'off') return '<span class="pill" style="border-color:#94A3B8;color:#94A3B8">\u26AA ' + esc(t('غير متصل — لا حساب محفوظ')) + '</span>';
  if (p.state === 'err') return '<span class="pill" style="border-color:#EF4444;color:#EF4444">\u{1F534} ' + esc(t('فشل')) + ': ' + esc(p.err === 'login' ? t('الدخول رُفض — راجع اسم المستخدم وكلمة السر') : String(p.err || '')) + (p.httpStatus ? ' (' + nm(p.httpStatus) + ')' : '') + ' \u00b7 ' + esc(t('منذ')) + ' ' + ago + '</span>';
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
    + '<div class="grid2">'
    + '<div class="field"><label>' + esc(t('اسم المستخدم')) + '</label><input class="in" id="integUser" autocomplete="off" placeholder="' + esc(t('حساب الربط في أفاقي برو')) + '"></div>'
    + '<div class="field"><label>' + esc(t('كلمة السر')) + '</label><input class="in" id="integPass" type="password" autocomplete="new-password"></div>'
    + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('عنوان المنصة')) + '</label><input class="in" id="integUrl" value="https://api.afaqy.sa" dir="ltr"></div>'
    + '</div>'
    + '<div class="actions" style="margin-top:8px">' + btn('\u{1F50C} ' + t('احفظ واتصل'), 'btn-primary', ' data-integsave="afaqypro"') + btn('\u21BB ' + t('حدّث الآن'), 'btn-secondary', ' data-integnow="1"' + busy) + btn(t('افصل'), 'btn-quiet', ' data-integoff="afaqypro"') + '</div>'
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('«حدّث الآن» للمهندس والمدير — مرةً في الدقيقة للجميع، وتعود القراءاتُ خلال ثوانٍ إلى الخريطة الثلاثية.')) + '</p>');
}
function integNusukHtml(){
  return card('\u{1F3AB} ' + t('نُسُك — نظام البطاقات'), '<p class="hint" style="margin:0">' + esc(t('المرحلة التالية: الدخول بالإيميل وكلمة السر، ثم كودُ التحقق يُكتب هنا، ويُحفظ التوكن على الخادم ويُجدَّد. حتى حينها تعمل وصلةُ القارئات الحالية كما هي.')) + '</p>');
}
function integTabHtml(){
  if (!mayIntegEdit()) return card(t('الربط'), '<p class="hint" style="margin:0">' + esc(t('هذا التبويب للمهندس والمدير')) + '</p>');
  return integProHtml() + integNusukHtml();
}
function mayIntegEdit(){ return ROLE === 'admin' || ROLE === 'engineer'; }
function integSave(name){
  if (!mayIntegEdit()){ toast(t('هذا التبويب للمهندس والمدير')); return; }
  if (!STATE.meta.online || !FB.ready || !FB.db){ toast(t('الحفظُ يحتاج اتصالًا بالشبكة')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var user = g('integUser'), pass = g('integPass'), url = g('integUrl') || 'https://api.afaqy.sa';
  if (!user || !pass){ toast(t('اكتب اسمَ المستخدم وكلمةَ السر')); return; }
  DB.col('integ').doc(name).set({ user:user, pass:pass, url:url, on:true, at:Date.now(), by:STATE.meta.name || '' })
    .then(function(){ var el = document.getElementById('integPass'); if (el) el.value = ''; logEvent('حُفظ حسابُ الربط — ' + name + ' \u00b7 ' + user, ''); toast(t('حُفظ — أول سحبٍ خلال ٥ دقائق، أو اضغط «حدّث الآن»')); integStatusLoad(true); })
    .catch(function(e){ toast(t('تعذّر الحفظ') + ': ' + String(e && e.message || e).slice(0, 80)); });
}
function integOff(name){
  if (!mayIntegEdit()) return;
  if (!STATE.meta.online || !FB.ready || !FB.db){ toast(t('يحتاج اتصالًا بالشبكة')); return; }
  if (!confirm(t('فصلُ الربط يحذف الحسابَ المحفوظ ويوقف السحب. متابعة؟'))) return;
  DB.col('integ').doc(name).set({ on:false, user:'', pass:'', at:Date.now(), by:STATE.meta.name || '' })
    .then(function(){ logEvent('فُصل الربط — ' + name, ''); toast(t('فُصل')); integStatusLoad(true); })
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
