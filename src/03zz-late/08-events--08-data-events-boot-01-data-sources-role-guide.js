/* ============================================================================
   FILE    : src/03zz-late/08-events--08-data-events-boot-01-data-sources-role-guide.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/08-events/08-data-events-boot-01-data-sources-role-guide.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : CLICK_NEXT, roleGuide
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* (V33.0) علامةُ «لم يُعالَج هنا — تابِع» لأجزاء معالجَي النقرات: دالّةٌ فارغةٌ هويتُها فريدة (لا متغيرَ عامًّا جديدًا) */
function CLICK_NEXT(){}

/* (V32.3) الأدلةُ تملك حالتَها (كانت GUIDE.g/GUIDE.role) */
function roleGuide(k){
  var x = ROLES[k];
  if (!x) return '';
  var caps = Object.keys(x.can || {}).filter(function(c){ return x.can[c]; });
  /* شاشاتُه: ما يبلغه فعلًا بقواعد seesPage نفسِها لا بقائمةٍ تُحفَظ */
  /* الشرائحُ تُعدُّ كلُّ واحدةٍ شاشةً — فالسائقُ يقرأ «سيارتي» لا «السيارات» */
  var ids = (x.nav === '*') ? pageIds() : x.nav.filter(pageMeta);
  var byGroup = {};
  ids.forEach(function(id){
    var p = pageMeta(id);
    if (!p) return;
    var cap = PAGE_CAP[id];
    if (cap && !x.can[cap]) return;
    (byGroup[p.m] = byGroup[p.m] || []).push(p);
  });
  var groups = Object.keys(byGroup);
  var nScreens = groups.reduce(function(a, g){ return a + byGroup[g].length; }, 0);

  /* دوراتُ العمل التي يملكها: SOPS تذكر صاحبَها بالاسم */
  var sops = SOPS.filter(function(sp){ return (sp.own || '').indexOf(x.n) > -1; });

  return stats([['شاشاتُه', N(nScreens), 'acc'],
                ['مجموعاتٌ في قائمته', N(groups.length)],
                ['قدراتُه', N(caps.length), caps.length ? '' : 'wrn']])

    + card(t(x.n),
        '<p class="lede" style="margin:0 0 12px">' + esc(t(x.d || '')) + '</p>'
        + (caps.length
          ? '<div class="chips">' + caps.map(function(c){
              return '<span class="chip on">' + esc(t(CAP_SAY[c] || c)) + '</span>'; }).join('') + '</div>'
          : alertBox('info','عرضٌ فقط — لا يكتب في النظام شيئًا.')))

    /* مئةٌ وخمسُ شاشاتٍ في قائمةٍ واحدةٍ لا تُقرأ — ولا تُقاس على شاشة هاتف.
       فالمجموعاتُ مطويّةٌ بأعدادها، وتُفتَح واحدةً واحدة. */
    + groups.map(function(g){
        var open = PV.GUIDE.g === g;
        return card('',
          '<button type="button" class="btn btn-quiet" data-guideg="' + esc(open ? '' : g) + '" style="width:100%;justify-content:space-between;font-weight:700">'
          + '<span>' + (open ? '\u25BE ' : '\u25B8 ') + esc(t(g)) + '</span><span class="num">' + nm(byGroup[g].length) + '</span></button>'
          + (open
            ? table(['الشاشة','ما يفعله فيها'],
                byGroup[g].map(function(p){
                  return [(p.sub ? esc(t(p.sub)) + ' \u2190 ' : '') + esc(t(p.t)), esc(t(p.l || ''))]; }))
            : ''));
      }).join('')

    + (sops.length
      ? cardFlush('دوراتُ عمله — ' + nm(sops.length),
          table(['الدورة','ما يبدؤها','خطواتها'],
            sops.map(function(sp){
              return [sp.i + ' ' + esc(t(sp.n)), esc(t(sp.trig || '')), N(sp.steps.length)];
            })))
      : '');
}
