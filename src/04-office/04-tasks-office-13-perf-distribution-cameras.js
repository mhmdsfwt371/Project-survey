/* ============================================================================
   FILE    : src/04-office/04-tasks-office-13-perf-distribution-cameras.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Performance for 150 concurrent users, distribution by zone and type, survey progress per zone, ministry cameras (Bullet/PTZ/LPR) and hierarchy views.
   DEFINES : siteIndex, siteFind, siteSearch, statBump, recLocApply, siteKeyStats, overZoneCards, svLabel, declaredKeys, typeOfLabel, declaredTypeKeys, camKind, camKindLabel, declaredZones … (+4 more)
   GLOBALS : SITE_IX, STAT_CACHE, OVER_ZONE, CAM_KINDS, LIST_PAGE, RENDER_CUR, RENDER_KEY, CFG_VER, PULL_COL
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الأداء — مئةٌ وخمسون مستخدمًا في آنٍ واحد ═══
   ثلاثةُ أعناقٍ قاستها الأرقام: بحثٌ خطيٌّ في ألفٍ وسبعمئة صف،
   وإحصاءٌ يُعاد حسابُه في كل رسمة، وسحبٌ كاملٌ من القاعدة
   كان سيبلغ ثلاثةَ ملايين قراءةٍ يوميًّا والحدُّ خمسون ألفًا. */

/* ═══ المسحُ بالمشعر: كم أُنجز وكم بقي (V17.78) ═══
   الوزارةُ تسأل عن منى وحدَها ثم عن عرفات وحدَها، والملخّصُ كان يجيب عن الكلّ
   فقط. فصار المشعرُ يُختار ببطاقةٍ فتُقرأ أرقامُه ونسبتُه وما بقي منه، ولا
   اختيارَ يعني الكلَّ نسبًا من الكلّ — والأعدادُ من الحلقة نفسِها. */
var OVER_ZONE = '';
function overZoneCards(K){
  var Z = K.zones, names = Object.keys(Z).sort(function(a, b){ return Z[b].n - Z[a].n; });
  var pct = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var one = function(key, label, o){
    var on = OVER_ZONE === key;
    return '<button class="btn ' + (on ? 'btn-primary' : 'btn-quiet') + '" data-ovz="' + esc(key) + '"'
      + ' style="flex:1 1 150px;min-width:150px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;text-align:start">'
      + '<span class="num" style="font-size:22px;line-height:1.1">' + nm(pct(o.sv, o.n)) + '٪</span>'
      + '<span>' + esc(label) + '</span>'
      + '<span class="hint" style="margin:0">' + esc(t('تمت الزيارة')) + ' <b class="num">' + nm(o.sv) + '</b> ' + esc(t('من')) + ' <b class="num">' + nm(o.n) + '</b>'
      +   ' \u00b7 ' + esc(t('متبقٍّ')) + ' <b class="num">' + nm(o.n - o.sv) + '</b></span></button>';
  };
  return '<div class="wt-row" style="flex-wrap:wrap;gap:8px;align-items:stretch">'
    + one('', t('كلُّ المشاعر'), K.total)
    + names.map(function(z){ return one(z, t(z), Z[z]); }).join('')
    + '</div>';
}

function declaredZones(){
  var out = []; declaredKeys().forEach(function(k){ var z = k.split('|')[0]; if (z && out.indexOf(z) < 0) out.push(z); }); return out;
}
/* المشاعرُ الحيّة: ما فيه نقاطٌ وما أُعلن — للقوائم والأشرطة والتصدير */
function zonesLive(){
  var out = zoneList(); declaredZones().forEach(function(z){ if (out.indexOf(z) < 0) out.push(z); }); return out;
}

   

/* ── السحبُ الفارقي: ما تغيّر بعد آخر مزامنةٍ وحده ── */
   /* الأثرُ: مجموعتُه «events» ومفتاحُه في الحالة «evlog» */
