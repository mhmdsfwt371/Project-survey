/* ============================================================================
   FILE    : src/03zz-late/01-core--01-core-registry-01-boot-i18n.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/01-core/01-core-registry-01-boot-i18n.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : scanOpen, scanClose, serialFormatOk, scanFill
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function scanOpen(key){
  if (!SCAN.ok) return;
  SCAN.key = key; SCAN.on = true; render(1);
  var video = document.getElementById('scanVideo'); if (!video) return;
  navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:'environment' } }, audio:false }).then(function(st){
    SCAN.stream = st; video.srcObject = st; try { video.play(); } catch (e){ LS_ERR = e; }
    var det = new window.BarcodeDetector({ formats: SCAN.formats });
    var tick = function(){
      if (!SCAN.on) return;
      det.detect(video).then(function(codes){
        var c = codes && codes[0];
        if (c && c.rawValue){ scanFill(String(c.rawValue).trim()); return; }
        SCAN.timer = setTimeout(tick, 250);
      }).catch(function(){ SCAN.timer = setTimeout(tick, 400); });
    };
    SCAN.timer = setTimeout(tick, 300);
  }).catch(function(){ toast(t('تعذّر فتحُ الكاميرا — اكتب الرقمَ يدًا')); scanClose(); });
}

function scanClose(){
  SCAN.on = false;
  if (SCAN.timer){ clearTimeout(SCAN.timer); SCAN.timer = 0; }
  if (SCAN.stream){ try { SCAN.stream.getTracks().forEach(function(tr){ tr.stop(); }); } catch (e){ LS_ERR = e; } SCAN.stream = null; }
  render(1);
}

function serialFormatOk(key, sn){
  var it = itemsList().filter(function(i){ return i.code === key; })[0];
  if (!it || !it.sn) return true;
  try { return new RegExp(it.sn).test(String(sn || '').trim()); } catch (e){ return true; }
}

function scanFill(sn){
  var key = SCAN.key; scanClose();
  FORM.serials[key] = sn;
  var el = document.querySelector('[data-serial="' + CSS.escape(key) + '"]'); if (el) el.value = sn;
  if (!serialFormatOk(key, sn)) toast(t('الرقمُ لا يطابق صيغةَ هذا الصنف — راجعه'));
  var other = serialOwner(sn, FORM.site);
  if (other) toast(t('هذا الرقمُ مسجَّلٌ على نقطةٍ أخرى') + ': ' + other);
  else toast(t('قُرئ الرقم') + ': ' + sn);
}
