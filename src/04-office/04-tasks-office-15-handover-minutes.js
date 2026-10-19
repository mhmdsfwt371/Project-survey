/* ============================================================================
   FILE    : src/04-office/04-tasks-office-15-handover-minutes.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Handover and official receipt minutes.
   DEFINES : handNext, handReady, handBlock, handSave, hoSetParty, hoSetSigner, hoSetupCard, hoTpl, hoParty, hoSigners, hoLocOf, hoItems, handDocSite, handDocCo
   GLOBALS : HAND_SEQ, HO_PARTIES, HO_SIGNERS, HO_TPL
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

function handNext(){
  HAND_SEQ = (HAND_SEQ || 0) + 1;
  CORE.set('cfg', 'handSeq', { n:HAND_SEQ });
  var n = String(HAND_SEQ);
  while (n.length < 4) n = '0' + n;
  return 'HO-' + n;
}

/* بلاغٌ جوهريٌّ مفتوحٌ على النقطة يمنع تسليمَها وحدَها — لا يمنع غيرَها */
function handBlock(id){
  if (typeof NCRS === 'undefined') return null;
  return NCRS.filter(function(n){
    return n.site === id && n.st !== 'مغلق' && n.sev === 'جوهري'; })[0] || null;
}
function handSave(id, to, note){
  if (!may('approve')){ toast(t('التسليمُ للمهندس وحده')); return false; }
  var r = STATE.inss[id];
  if (!r || r.status !== 'مُركّب' || !r.approved){
    toast(t('لا تُسلَّم نقطةٌ لم يُعتمَد تركيبُها')); return false;
  }
  if (r.hand){ toast(t('سُلِّمت بالفعل')); return false; }
  var blk = handBlock(id);
  if (blk){ toast(t('بلاغٌ جوهريٌّ مفتوحٌ يمنع التسليم') + ' \u00b7 ' + (blk.no || blk.id || '')); return false; }
  to = String(to || '').trim();
  if (!to){ toast(t('اكتب اسم المستلِم من العميل')); return false; }
  r.hand = { no:handNext(), at:Date.now(), by:STATE.meta.name || '',
             to:to, note:String(note || '').trim(),
             warranty:cfgN(cfgGet('warranty') || 12) };
  CORE.set('inss', id, r);
  logEvent('تسليم نقطة — ' + id + ' \u00b7 ' + r.hand.no + ' \u00b7 ' + to, id);
  stepDone('hand', id, r.hand.no, 0);
  notifPush('تسليم', id + ' \u00b7 ' + t('سُلِّمت للعميل') + ' \u2014 ' + r.hand.no, { site:id, lv:'عادي' });
  statBump();
  return true;
}
/* ── محضرٌ لنقطةٍ واحدة ── */

/* ═══ محضرُ الاستلام الرسميّ ═══
   المحضرُ الذي يُسلَّم للوزارة نموذجٌ لها لا لنا: ترويسةُ المملكة والوزارة
   والوكالة، ثم المشروعُ والمقاولُ والاستشاري، ثم الأعمالُ بمكانها ورقمها،
   ثم البنودُ بأعدادها وسيرياتها، ثم التعهدُ والتوقيعاتُ والاعتماد.
     ولكلِّ نوعٍ نموذجُه: المخيّمُ يذكر رقمَه والشركةَ المستلمة، والممرُّ
   يذكر اسمَه ورقمَ مظلته ويُقدَّم للوزارة نفسِها، والمحطةُ والجمراتُ ومسجدُ
   نمرة وكاميرا الوزارة كلٌّ بعنوانه وبنوده. وأسماءُ المعتمِدين وصفاتُهم
   وجهاتُهم تُضبَط مرةً في «ثوابت النظام» فتُطبَع في كلِّ محضر — كانت تُكتَب
   باليد في كلِّ مرة أو تُترَك فارغةً فيُرَدُّ المحضر. */

