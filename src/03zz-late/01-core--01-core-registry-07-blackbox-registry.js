/* ============================================================================
   FILE    : src/03zz-late/01-core--01-core-registry-07-blackbox-registry.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/01-core/01-core-registry-07-blackbox-registry.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : boxText, boxCopy, softErrCard, regVer, regPublish, regCard
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function boxText(){
  var B = boxLoad(), nav = (typeof navigator === 'object' ? navigator : {});
  var head = ['nsk-box v1', 'ver ' + appVer(), 'dev ' + (typeof DEV_ID === 'string' ? DEV_ID.slice(0, 12) : ''), 'ua ' + boxRedact(nav.userAgent || '').slice(0, 60),
              'idb ' + (IDB_BAD ? 'bad' : (_idb ? 'ok' : 'mem')) + ' persist ' + (typeof PERSIST === 'object' ? PERSIST.st : ''), 'q ' + ((STATE.queue || []).length) + ' pz ' + ((STATE.poison || []).length), '---'];
  var lines = B.e.map(function(x){ return new Date(x.t).toISOString().slice(11, 19) + ' ' + x.k + ' ' + x.w; });
  var out = head.concat(lines).join('\n');
  while (out.length > BOX_BYTES && lines.length){ lines.shift(); out = head.concat(lines).join('\n'); }
  return out;
}

function boxCopy(){
  var txt = boxText();
  var done = function(){ toast(t('نُسخ التشخيص — أرسله للمهندس')); };
  try { if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done, function(){ toast(t('تعذّر النسخ')); }); return; } } catch (e){ BOX_ERR = e; }
  try { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch (e){ toast(t('تعذّر النسخ')); }
}

/* السجلُّ يُعرَض حيث يُسأَل عنه: من فتح «المزامنة والتعارض» يسأل لماذا لا
   تصل البيانات — فيجد الجواب مكتوبًا لا يخمّنه. */
function softErrCard(){
  if (!SOFT_ERRS.length) return '';
  /* (V38.55) the swallowed-error count since the app opened, and where most of them come from */
  var N = lsErrNote.n, top = N ? Object.keys(N.by).sort(function(a, b){ return N.by[b] - N.by[a]; }).slice(0, 3) : [];
  var sum = N && N.total ? '<p class="hint" style="margin:0 0 6px">' + esc(t('أخطاءٌ مبتلَعةٌ منذ فتح التطبيق')) + ': <b class="num">' + nm(N.total) + '</b>' + (top.length ? ' \u2014 ' + esc(t('أكثرُها من')) + ' ' + top.map(function(k){ return '<bdi>' + esc(k) + '</bdi> (' + nm(N.by[k]) + ')'; }).join('، ') : '') + '</p>' : '';
  return alertBox('warn', 'أعطالٌ صامتةٌ وقعت — لم تُزعج العملَ لكنها قد تفسّر نقصًا فيما تراه.') + sum
    + cardFlush(t('ما سقط بلا صوت') + ' — ' + nm(SOFT_ERRS.length),
        table(['الوقت','الموضع','السبب'],
          SOFT_ERRS.slice(0, 30).map(function(x){
            return ['<span class="num">'
                    + esc(fmtTime(x.at, { hour:'2-digit', minute:'2-digit' }))
                    + '</span>',
                    esc(t(x.where)),
                    '<span class="hint" style="margin:0">' + esc(x.msg || '—') + '</span>'];
          })),
        btn('امسح السجل','btn-quiet btn-sm',' data-serrclr="1"'));
}

function regVer(R){
  var s = JSON.stringify({ z:R.z, t:R.t, w:R.w, co:R.co, dm:R.dm, g:R.g, p:R.p }), h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + s.length.toString(36);
}

function regPublish(){
  if (!may('perms')){ toast(t('نشرُ السجلِّ للأدمن وحده')); return; }
  if (regEmpty(SITES_RAW)){ toast(t('لا سجلَّ في هذا الجهاز لنشره')); return; }
  var n = SITES_RAW.g.length + SITES_RAW.p.length;
  if (!confirm(t('يُنشَر سجلُّ النقاط في القاعدة لحسابات الفريق المسجَّلة') + ' (' + n + '). ' + t('متابعة؟'))){ toast(t('لم يُنشَر — أُلغي')); return; }
  var doc = { z:SITES_RAW.z, t:SITES_RAW.t, w:SITES_RAW.w, co:SITES_RAW.co || [], dm:SITES_RAW.dm || [], g:SITES_RAW.g, p:SITES_RAW.p };
  doc.ver = regVer(doc); doc.at = Date.now(); doc.by = STATE.meta.name || '';
  /* (V38.88) one JSON string: the database refuses the nested arrays */
  CORE.set('cfg', 'registry', { json:JSON.stringify({ z:doc.z, t:doc.t, w:doc.w, co:doc.co, dm:doc.dm, g:doc.g, p:doc.p }), ver:doc.ver, at:doc.at, by:doc.by, n:n }); CORE.saveSoon();
  STATE.regInfo = { ver:doc.ver, at:doc.at, by:doc.by, n:n };
  try { localStorage.setItem('nsk.reg', JSON.stringify(doc)); lsSet('nsk14.regver', doc.ver); } catch (e){ LS_ERR = e; }
  logEvent('نشرُ سجلِّ النقاط في القاعدة — ' + n + ' نقطة · ' + doc.ver);
  toast(t('نُشر السجلُّ في القاعدة')); render(1);
}

function regCard(){
  if (!may('perms')) return '';
  var I = STATE.regInfo, inFile = regEmpty(SITES_RAW) ? 0 : SITES_RAW.g.length + SITES_RAW.p.length, loc = regLocal();
  if (!I) regEnsure();
  var pub = !I ? t('يُفحص…') : I.none ? t('غير منشور بعد') : nm(I.n) + ' ' + t('نقطة') + ' \u00b7 ' + fmtTime(I.at, { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) + (I.by ? ' \u00b7 ' + dispName(I.by) : '');
  var same = I && !I.none && I.ver === regVer({ z:SITES_RAW.z, t:SITES_RAW.t, w:SITES_RAW.w, co:SITES_RAW.co || [], dm:SITES_RAW.dm || [], g:SITES_RAW.g, p:SITES_RAW.p });
  return card('حماية سجلّ النقاط',
    '<p class="hint" style="margin:0 0 8px">' + esc(t('ملفُّ التطبيق يُفتح لأيِّ زائرٍ بلا دخول، وفيه سجلُّ النقاط بإحداثياته. نشرُه في القاعدة أوّلُ خطوةٍ لإخراجه من الملف: يقرؤه المسجَّلون وحدهم، ويُخزَّن على كلِّ جهازٍ للعمل بلا شبكة.')) + '</p>'
    + '<div class="pop-rows" style="margin:0">'
    + '<div><span class="k">' + esc(t('في ملف التطبيق')) + '</span><span>' + (inFile ? nm(inFile) + ' ' + esc(t('نقطة')) : esc(t('خالٍ'))) + '</span></div>'
    + '<div><span class="k">' + esc(t('في القاعدة')) + '</span><span>' + esc(pub) + (same ? ' ' + pill('مطابق','ok') : (I && !I.none ? ' ' + pill('يختلف عن الملف','warn') : '')) + '</span></div>'
    + '<div><span class="k">' + esc(t('على هذا الجهاز')) + '</span><span>' + (loc && !regEmpty(loc) ? pill('مخزَّن','ok') : pill('غير مخزَّن','warn')) + '</span></div>'
    + '</div>',
    btn('\u{1F512} ' + t(I && !I.none ? 'أعد نشر السجلّ من هذا الجهاز' : 'انشر السجلّ في القاعدة'), 'btn-primary btn-sm', ' data-regpub="1"'));
}
