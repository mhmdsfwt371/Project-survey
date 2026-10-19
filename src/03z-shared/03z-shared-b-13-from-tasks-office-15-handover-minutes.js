/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-13-from-tasks-office-15-handover-minutes.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-15-handover-minutes.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : hoSetParty, hoSetSigner, hoSetupCard
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* تُضبَط مرةً في «ثوابت النظام» وتُطبَع في كلِّ محضر */
function hoSetParty(k, v){
  if (!may('settings')){ toast(t('ضبطُ المحضر للمهندس وحده')); return; }
  CFG.hoParties = CFG.hoParties || {};
  CFG.hoParties[k] = String(v || '').trim();
  CORE.set('cfg', 'hoParties', Object.assign({}, CFG.hoParties));
}

function hoSetSigner(i, k, v){
  if (!may('settings')){ toast(t('ضبطُ المحضر للمهندس وحده')); return; }
  var L = hoSigners().map(function(x){ return Object.assign({}, x); });
  if (!L[i]) return;
  L[i][k] = String(v || '').trim();
  CFG.hoSigners = L;
  CORE.set('cfg', 'hoSigners', L);
}

function hoSetupCard(){
  var P = ['owner','agency','project','contractor','consultant'];
  var LB = { owner:'الجهة المالكة', agency:'الوكالة', project:'اسم المشروع',
             contractor:'المقاول', consultant:'الاستشاري' };
  return card('\u{1F4C4} ' + t('ترويسةُ محضر الاستلام'),
      '<div class="grid cols-2">'
      + P.map(function(k){
          return '<div class="field"><label>' + esc(t(LB[k])) + '</label>'
            + '<input data-hop="' + k + '" value="' + esc(hoParty(k)) + '" dir="auto"></div>';
        }).join('')
      + '</div>'
      + cardFlush(t('المعتمِدون'),
          table(['م','الاسم','صفته','الجهة'],
            hoSigners().map(function(g, i){
              return [N(i + 1),
                '<input data-hosn="' + i + '" value="' + esc(g.n || '') + '" dir="auto" placeholder="' + esc(t('الاسم')) + '">',
                '<input data-hosr="' + i + '" value="' + esc(g.role || '') + '" dir="auto">',
                '<input data-hoso="' + i + '" value="' + esc(g.org || '') + '" dir="auto">'];
            })))
      + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُكتَب مرةً فتُطبَع في كلِّ محضرٍ لكلِّ نوع — كانت تُملأ باليد في كلِّ مرة أو تُترَك فارغةً فيُرَدُّ المحضر.')) + '</p>');
}
