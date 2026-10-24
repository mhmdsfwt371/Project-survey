/* ============================================================================
   FILE    : src/03z-shared/03z-shared-15-from-tasks-office-15-handover-minutes.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-15-handover-minutes.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : handReady, hoTpl, hoParty, hoSigners, hoLocOf, hoItems, handDocSite, handDocCo
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ محضرُ التسليم ═══
   «جاهزٌ للتسليم» كان يعدُّ ما رُكِّب واعتُمد، و«سُلِّم» صفرًا مكتوبًا — لأن
   التسليمَ لم يكن فعلًا في النظام أصلًا. وهو حلقةٌ لازمة: ما رُكِّب يُسلَّم
   للعميل بمحضرٍ يحمل رقمَه وتاريخَه ومن سلَّم ومن استلم، ومنه تبدأ مدةُ
   الضمان، وقبله لا يُفكُّ شيء — فالفكُّ إرجاعُ ما سُلِّم.
     ويُحفَظ المحضرُ على سجل التركيب نفسِه (`inss[id].hand`): هو الوثيقةُ
   التي تصف ما رُكِّب، والتسليمُ خاتمتُها لا سجلٌّ منفصلٌ يُتَتبَّع. */
var HAND_SEQ = 0;

function handReady(x){
  var r = STATE.inss[x.id];
  return !!(r && r.status === 'مُركّب' && r.approved && !r.hand);
}

var HO_PARTIES = { owner:'وزارة الحج والعمرة', agency:'وكالة التخطيط والتحول الرقمي',
                   contractor:'آفاقي', consultant:'شركة علم',
                   project:'مشروع قارئات أفاقي' };

var HO_SIGNERS = [
  { n:'', role:'مدير برامج رقمية', org:'وزارة الحج والعمرة' },
  { n:'', role:'مدير البرنامج',    org:'شركة آفاقي' },
  { n:'', role:'مدير المشروع',     org:'شركة آفاقي' },
  { n:'', role:'مهندس الموقع',     org:'شركة آفاقي' }
];

/* نموذجٌ لكلِّ نوع: عنوانُه، وحقلُ موضعه، ومن يُقدَّم إليه، وتعهُّدُه */
var HO_TPL = {
  'مخيم':   { t:'محضر استلام عهدة',           loc:'رقم المخيم',   to:'شركة تقديم الخدمة',
              pledge:'تتعهد الشركة ({co}) بتسليم الأجهزة سليمةً بعد الموسم بموجب محضر تسليمٍ كما استلمتها بلا خدوشٍ أو كسور.' },
  'ممر':    { t:'محضر استلام الممرات',        loc:'اسم الممر ورقم المظلة', to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا مع تشغيل القارئ والكاميرا والتأكد من عملهما بكفاءة.' },
  'محطة':   { t:'محضر استلام محطات القطار',   loc:'اسم المحطة والبوابة',   to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا ومربوطًا بشبكة المحطة، ويُتأكَّد من عمله بكفاءة.' },
  'جسر':    { t:'محضر استلام الجمرات',        loc:'الدور والمدخل',         to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا في موضعه من الجسر ويُتأكَّد من عمله بكفاءة.' },
  'بوابة':  { t:'محضر استلام مسجد نمرة',      loc:'البوابة',               to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا عند البوابة ويُتأكَّد من عمله بكفاءة.' },
  'كاميرا': { t:'محضر استلام كاميرات الوزارة', loc:'الموضع',               to:'وزارة الحج والعمرة',
              pledge:'تُسلَّم الكاميرا مركَّبةً ومربوطةً ومُختبَرةً على شبكة الوزارة.' },
  'مبنى':   { t:'محضر استلام المباني',        loc:'المبنى والدور',         to:'وزارة الحج والعمرة',
              pledge:'يُسلَّم النظامُ متكاملًا في موضعه ويُتأكَّد من عمله بكفاءة.' }
};

function hoTpl(x){ return HO_TPL[x && x.type] || HO_TPL['مخيم']; }

function hoParty(k){ return (CFG.hoParties || {})[k] || HO_PARTIES[k]; }

function hoSigners(){
  var L = CFG.hoSigners;
  return (Array.isArray(L) && L.length) ? L : HO_SIGNERS;
}

function hoLocOf(x){
  if (!x) return '';
  var bits = [];
  if (x.sq)   bits.push(x.sq);
  if (x.sign) bits.push(x.sign);
  if (x.name && x.name !== x.sq) bits.push(x.name);
  return bits.join(' \u00b7 ') || '\u2014';
}

/* صفوفُ البنود: من قطع التركيب وسيرياتها — لا تُكتَب باليد */
function hoItems(id){
  var r = STATE.inss[id] || {};
  return Object.keys(r.parts || {}).map(function(k){
    return { item:itemName(k), qty:cfgN(r.parts[k]), sn:(r.serials || {})[k] || '' };
  });
}

function handDocSite(id){
  var s = siteFind(id), r = STATE.inss[id], h = handOf(id);
  if (!s || !r) return '';
  var T = hoTpl(s), IT = hoItems(id);
  var end = h ? new Date(h.at + (h.warranty || cfgGet('warranty') || 12) * 30 * 86400000) : null;
  var hijri = function(ms){
    try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day:'numeric', month:'numeric', year:'numeric' }).format(new Date(ms)); }
    catch (e){ return fmtDate(ms); }
  };
  return '<div class="hdoc">'
    /* ترويسةُ الجهة — كما في نموذج الوزارة */
    + '<div style="text-align:center;line-height:1.7;margin:0 0 10px">'
    +   '<div>' + esc(t('المملكة العربية السعودية')) + '</div>'
    +   '<div><strong>' + esc(hoParty('owner')) + '</strong></div>'
    +   '<div class="hint" style="margin:0">' + esc(hoParty('agency')) + '</div>'
    + '</div>'
    + '<h3 style="margin:0 0 10px;text-align:center">' + esc(t(T.t)) + '</h3>'

    + table(['البند','البيان','البند','البيان'], [
        [esc(t('اسم المشروع')), esc(hoParty('project')), esc(t('المقاول')), esc(hoParty('contractor'))],
        [esc(t('الاستشاري')), esc(hoParty('consultant')), esc(t('نوع التقديم')), esc(t(h && h.re ? 'إعادة تقديم' : 'جديد'))],
        [esc(t('رقم المحضر')), h ? '<span class="num">' + esc(h.no) + '</span>' : pill('لم يُسلَّم بعد','warn'),
         esc(t('تاريخ المحضر')), h ? '<span class="num">' + esc(hijri(h.at)) + '</span>' : '\u2014'],
        [esc(t('مكان الأعمال')), esc(t(s.zone)), esc(t(T.loc)), '<span class="num">' + esc(hoLocOf(s)) + '</span>']
      ])

    + '<h4 style="margin:14px 0 6px">' + esc(t('الأعمال')) + '</h4>'
    + table(['البند','العدد','السيريال'],
        (IT.length ? IT : [{ item:'\u2014', qty:0, sn:'' }]).map(function(o){
          return [esc(o.item), N(o.qty), o.sn ? '<span class="num" dir="ltr">' + esc(o.sn) + '</span>' : '\u2014'];
        }),
        ['<b>' + t('الإجمالي') + '</b>', N(IT.reduce(function(a, o){ return a + o.qty; }, 0)), ''])

    + table(['البند','البيان'], [
        [esc(t('يُقدَّم إلى')), esc(T.to === 'شركة تقديم الخدمة' ? (coName(s.co) || t(T.to)) : t(T.to))],
        [esc(t('بادئة الشبكة')), s.net ? '<span class="num">' + esc(s.net) + '</span>' : '\u2014'],
        [esc(t('تاريخ التركيب')), '<span class="num">' + esc(fmtDate(r.at || 0)) + '</span>'],
        [esc(t('نفّذه')), esc(dispName(r.by) || '\u2014')],
        [esc(t('اعتمده')), esc(dispName(r.qaBy || r.apprBy || '') || '\u2014')],
        [esc(t('سلَّم')), h ? esc(dispName(h.by)) : '\u2014'],
        [esc(t('استلم عن العميل')), h ? esc(h.to) : '\u2014'],
        [esc(t('نهاية الضمان')), end ? '<span class="num">' + esc(fmtDate(end)) + '</span>' : '\u2014']
      ])

    + '<p style="margin:12px 0 4px"><strong>' + esc(t('تعهدات الاستلام')) + ':</strong> '
    +   esc(String(T.pledge).replace('{co}', coName(s.co) || '')) + '</p>'
    + (h && h.note ? '<p class="hint">' + esc(t('ملاحظات المشرف')) + ': ' + esc(h.note) + '</p>' : '')
    + '<p class="hint">' + esc(t('اعتمادُ الأعمال لا يُعفي المقاولَ من مسؤولياته التعاقدية والقانونية.')) + '</p>'

    + '<h4 style="margin:14px 0 6px">' + esc(t('الاعتماد')) + '</h4>'
    + table(['م','الاسم','صفته','الجهة','التوقيع'],
        hoSigners().map(function(g, i2){
          return [N(i2 + 1), esc(g.n || '\u2014'), esc(t(g.role)), esc(g.org),
                  '<div style="height:34px;border-bottom:1px dashed var(--line)"></div>'];
        }))
    + '</div>';
}

function handDocCo(co){
  var L = STATE.sites.filter(function(x){
    var r = STATE.inss[x.id];
    return x.co === co && r && r.status === 'مُركّب' && r.approved;
  });
  var done = L.filter(function(x){ return handDone(x.id); });
  var byType = {};
  L.forEach(function(x){ byType[x.type] = (byType[x.type] || 0) + 1; });
  var items = {};
  L.forEach(function(x){
    var r = STATE.inss[x.id];
    Object.keys(r.parts || {}).forEach(function(c){ items[c] = (items[c] || 0) + cfgN(r.parts[c]); });
  });
  return '<div class="hdoc">'
    + '<h3 style="margin:0 0 2px">' + esc(t('محضر تسليم شركة')) + '</h3>'
    + '<p class="hint" style="margin:0 0 12px">' + esc(co) + ' \u00b7 '
    + esc(t('قارئات بطاقة نسك — أفاقي · موسم ١٤٤٨هـ')) + '</p>'
    + stats([['نقاطٌ مُركّبةٌ معتمدة', N(L.length), 'acc'],
             ['سُلِّمت', N(done.length), done.length === L.length && L.length ? 'ok' : 'wrn'],
             ['بانتظار التسليم', N(L.length - done.length), L.length - done.length ? 'wrn' : 'ok']])
    + (Object.keys(byType).length
      ? card(t('بالنوع'), table(['النوع','العدد'],
          Object.keys(byType).map(function(k){ return [esc(t(k)), N(byType[k])]; })))
      : '')
    + (Object.keys(items).length
      ? card(t('إجمالي الأجهزة المسلَّمة'),
          table(['الصنف','الكمية'],
            Object.keys(items).sort(function(a, b){ return items[b] - items[a]; })
              .map(function(c){ return [esc(itemName(c)), N(items[c])]; })))
      : '')
    + (L.length
      ? cardFlush(t('النقاط'), table(['النقطة','الاسم','الشبكة','رقم المحضر','التاريخ'],
          L.slice(0, 400).map(function(x){
            var h = handOf(x.id);
            return [siteIdHtml(x),
                    esc((x.name || '').slice(0, 34)),
                    x.net ? '<span class="num">' + esc(x.net) + '</span>' : '\u2014',
                    h ? '<span class="num">' + esc(h.no) + '</span>' : pill('لم يُسلَّم','warn'),
                    h ? '<span class="num">' + esc(fmtDate(h.at)) + '</span>' : '\u2014'];
          })))
      : '')
    + '<div class="grid cols-2" style="margin-top:18px">'
    + '<div><p class="hint" style="margin:0">' + esc(t('عن المنفِّذ — أفاقي')) + '</p>'
    +   '<div style="border-bottom:1px solid var(--line);height:42px"></div></div>'
    + '<div><p class="hint" style="margin:0">' + esc(t('عن العميل — الوزارة')) + '</p>'
    +   '<div style="border-bottom:1px solid var(--line);height:42px"></div></div>'
    + '</div></div>';
}
