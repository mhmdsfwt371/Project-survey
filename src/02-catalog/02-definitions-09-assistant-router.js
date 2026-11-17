/* ============================================================================
   FILE    : src/02-catalog/02-definitions-09-assistant-router.js
   DOMAIN  : Catalog & definitions — the assistant's question router
   PURPOSE : (V47.4) Decides which answer a question gets before any answer is drawn. Each answer section
             («intent») declares its strong words (enough to answer) and weak words (hints only). The intent
             with the highest score answers; weak words alone never answer — they ask «تقصد ايه؟» instead.
             Intents with a `go` lead to the page that answers them until a data answer is written (phase 2).
   DEFINES : aqRoute, aqOn, aqIntentCount, aqGoCard, aqAskCard
   GLOBALS : PV.AQ_INTENTS, PV.AQ_R, PV.AQ_LAST
   PREFIX  : aq   (every function here starts with it — scripts/audit-names.mjs)
   NOTE    : The root of the owner's report (17 Nov 2026): «أول كلمة يعرفها تكسب» answered 9 of 30 real
             questions confidently wrong — «كام حساس» got the progress card, «الشحنات المتأخرة» the tasks card.
             scripts/audit-brain-bank.mjs holds a question bank against this router.
   ============================================================================ */

/* s: strong — one hit makes the intent eligible · w: weak — counts only beside a strong hit, or asks
   need: a second regex that must also match · go: the page/tab that answers it · ask: the canonical
   question offered as a chip when only weak words point here · lbl: what the chip says it is about */
PV.AQ_INTENTS = [
  { id:'reader',   s:/قارئ|قراء|القراء|اشاره|بترسل|ترسل|بيبعت|بتبعت|اونلاين|اوفلاين|online|offline|مقطوع/, w:/(^|\s)شغال/,
    ask:'كام قارئ بيرسل دلوقتي', lbl:'إشارة القرّاء' },
  { id:'stock',    s:/رصيد|مخزن|مخزون/, w:/متاح|فاضل|عندنا/, item:true, ask:'ايه أكبر الأرصدة في المخزن', lbl:'المخزن' },
  { id:'techvis',  s:/تحتاج زياره|محتاجه زياره|زياره تقنيه|زياره اخري|زياره تانيه|اعاده زياره|اعاده الزياره|يتزار تاني/,
    ask:'نقاط تحتاج زيارة تقنية', lbl:'نقاط تحتاج زيارة أخرى' },
  { id:'latevis',  s:/(متاخر|تاخير)[\s\S]*(زياره|زيارات|مسح)|(زياره|زيارات|مسح)[\s\S]*(متاخر|تاخير)/,
    w:/متاخر|تاخير/, ask:'مين متأخر في الزيارات؟', lbl:'الزيارات المتأخرة' },
  { id:'pace',     s:/امتي|هنخلص|نخلص|هيخلص|هتخلص|هنخلّص|توقع|موعد الانتهاء|الوتيره|نلحق|هنلحق/, go:'page|pace',
    ask:'امتى هنخلص المسح', lbl:'الوتيرة والهدف' },
  { id:'progress', s:/تركيب|اتركب|مركب|ركبت|اتمسح|(^|\s)(ال)?مسح|زياره|زيارات|اتزار|معتمد|انجاز|نسبه|تقدم/, w:/(^|\s)(كام|كم|عدد)(\s|$)|قد ايه|اد ايه/,
    /* a count word with a place or a kind is a progress question: «قطار المشاعر فيه كام بوابة» · «كام نقطة في منى» */
    elig:function(n, sc){ return /(^|\s)(كام|كم|عدد)(\s|$)/.test(n) && !!(sc.zone || sc.type || /نقطه|نقاط|موقع|مواقع/.test(n)); },
    ask:'كام نقطة اتركبت', lbl:'التقدّم' },
  { id:'tasks',    s:/(^|\s)(ال)?(مهام|مهمه)/, w:/متاخر|تاخير/, ask:'المهام المتأخرة', lbl:'المهام الأسبوعية' },
  { id:'chal',     s:/تحدي|تحديات|معوق|معوقات|عائق|عوائق/, w:/مشاكل|مشكله/, ask:'ايه أكتر تحدي', lbl:'التحديات والمعوقات' },
  { id:'taf',      s:/اعتماد|اعتمد|رفض|رفضت|مرفوض|بانتظار|قرار/, need:/التفويج|الوزاره/, ask:'كام نقطة مستنية اعتماد التفويج', lbl:'اعتماد إدارة التفويج' },
  { id:'occ',      s:/اشغال|زحمه|ازدحام|مليان|ممتلي|ممتلئ/, ask:'ايه أعلى إشغال', lbl:'الإشغال' },
  { id:'gates',    s:/ترددي|بوابات التفويج|بوابه التفويج|بوابه تفويج|بوابات تفويج|حاجز/, ask:'كام بوابة تفويج في المخيمات الترددي', lbl:'حصر بوابات التفويج' },
  { id:'ready',    s:/ناقص|جاهز|نجهز|معلق|المطلوب|اعمل ايه|نعمل ايه|الخطوه الجايه/, ask:'ايه اللي ناقص', lbl:'ما ينقص للجاهزية' },
  /* the domains the data answers do not cover yet: the page that answers them, never a wrong card */
  { id:'sensor',   s:/حساس|جيت ?واي|جيتواي|gateway|الرطوبه|درجه الحراره/, go:'page|iotdash', lbl:'الحساسات والجيت واي' },
  { id:'ship',     s:/شحنه|شحنات|الشحن|توريد|مورد/, w:/متاخر|تاخير/, go:'page|ships', lbl:'الشحنات والتوريد' },
  { id:'co',       s:/(^|\s)(ال)?(شركه|شركات)/, go:'page|mcos', lbl:'شركات الخدمة' },
  { id:'veh',      s:/عربيه|عربيات|سياره|سيارات/, go:'page|fleet', lbl:'السيارات' },
  { id:'perf',     s:/(اكتر|افضل|احسن|اقل|اضعف|ترتيب|اشطر)\s+(مشرف|فني|فريق|طاقم|واحد)|اداء|انتاجيه/, go:'page|perf', lbl:'الفرق والأداء' },
  { id:'expo',     s:/اكسبو|expo/, go:'page|expo', lbl:'الإكسبو' },
  { id:'yday',     s:/(اتعمل|حصل|اتنفذ|انجزنا|عملنا|اشتغلنا)[\s\S]*(امبارح|امس|النهارده|اليوم)|(امبارح|امس)/, go:'page|now', lbl:'أمس · الآن · غدًا' },
  { id:'version',  s:/اخر نسخه|النسخه الحاليه|رقم النسخه|اصدار|ايه الجديد|اخر تحديث/, go:'page|vers', lbl:'نسخ الأجهزة' },
  { id:'backup',   s:/نسخ(ه)? (ال)?احتياطي|باك ?اب|backup|الدرايف/, go:'page|retain', lbl:'النسخ الاحتياطي' }
];

function aqIntentCount(I, n){
  var c = (n.match(new RegExp(I.s.source, 'g')) || []).length;
  if (I.item && /(^|\s)(كام|كم|عدد)(\s|$)|عندنا|متاح|فاضل|رصيد|باقي/.test(n)){   /* a catalog word alone («شاشة القاعة») is not a stock question — only with a quantity */
    /* an item named in the question is as strong as «رصيد»: «كام راوتر عندنا» */
    (typeof itemsList === 'function' ? itemsList() : []).forEach(function(it){ var k = aqNorm(it.name || ''); if (k.split(/\s+/).some(function(w){ if (w.length < 4 || n.indexOf(' ' + w) < 0) return false; var sw = aqScope(' ' + w + ' '); return !sw.zone && !sw.type && !/^(ال)?(كاميرا|قارئ|منظومه)$/.test(w); })) c++; });   /* catalog names, not only items that moved — a word that is also a holy site or a point kind does not count («بوابة مخيم» is not «مخيم») */
  }
  return c;
}

/* The decision: { win, list:[ids answering], ask:[intents offered], score } — stored on PV.AQ_R for the
   sections of aqAnswer to read, and on PV.AQ_LAST for the question-bank audit. */
function aqRoute(q){
  var n = ' ' + aqNorm(q) + ' ', S = [], weakOnly = [], sc = aqScope(n);
  if (!sc.zone && !sc.type && typeof aqPlace === 'function') sc.type = aqPlace(n);   /* (V47.5) a place named in the registry is a scope too */
  PV.AQ_INTENTS.forEach(function(I){
    if (I.go && typeof seesPage === 'function' && !seesPage(I.go.split('|')[1])) return;   /* never offer a page the role cannot open */
    var s = aqIntentCount(I, n), w = I.w ? (n.match(new RegExp(I.w.source, 'g')) || []).length : 0;
    if (I.need && !I.need.test(n)) s = 0;
    if (!s && I.elig && I.elig(n, sc)){ s = 0.5; w = 0; }
    if (s) S.push({ I:I, score:s * 12 + w * 3 });
    else if (w) weakOnly.push(I);
  });
  S.sort(function(a, b){ return b.score - a.score; });
  var best = S.length ? S[0].score : 0;
  /* ties answer together: two data cards, or the data card with the page that holds the rest */
  var top = S.filter(function(x){ return x.score === best; });
  top.sort(function(a, b){ return (a.I.go ? 1 : 0) - (b.I.go ? 1 : 0); });
  PV.AQ_R = { win:top.length ? top[0].I.id : (weakOnly.length ? 'ask' : ''), list:top.map(function(x){ return x.I.id; }), ask:weakOnly, score:best };
  PV.AQ_LAST = PV.AQ_R.win;
  return PV.AQ_R;
}

function aqOn(id){ return !!(PV.AQ_R && PV.AQ_R.list.indexOf(id) > -1); }

/* a domain intent: its numbers when this device has them (aqAns, V47.5), else where it is answered */
function aqGoCard(I, c){
  var A = c && typeof aqAns === 'function' ? aqAns(I, c) : ''; if (A) return A;
  var id = I.go.split('|')[1], m = typeof pageMeta === 'function' ? pageMeta(id) : null;
  return aqCard(t('مكانها') + ': ' + t(m ? m.t : I.lbl) + (m && m.sub ? ' \u2039 ' + t(m.sub) : ''),
    m && m.l ? '<p class="hint" style="margin:0">' + esc(t(m.l)) + '</p>' : '', aqGo('افتح', I.go));
}

/* only weak words: ask which one is meant, a chip for each, instead of a confident wrong card */
function aqAskCard(L){
  return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid var(--warn, #d08a1e)"><div class="pid">' + esc(t('مساعد البيانات')) + '</div>'
    + '<h4 style="margin:2px 0 6px">' + esc(t('تقصد ايه؟')) + '</h4><div class="chips" style="margin:0">'
    + L.slice(0, 4).map(function(I){ return '<button type="button" class="chip" data-assistq="' + esc(I.ask || I.lbl) + '">' + esc(t(I.lbl)) + '</button>'; }).join('')
    + '</div></div>';
}
