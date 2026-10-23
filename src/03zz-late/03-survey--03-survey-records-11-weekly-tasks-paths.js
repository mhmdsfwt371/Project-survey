/* (V38.90) moved by scripts/split-late.mjs from src/03-survey/03-survey-records-11-weekly-tasks-paths.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function wtMeetStart(){
  if (!wtMay()) return;
  if (!wtMeetList().length){ toast(t('لا مهامَّ مفتوحةً للاجتماع')); return; }
  WT_MEET = true; WT_MI = 0; WT_MEND = 0; WT_OPEN = ''; WT_NEW = false; WT_TAB = 'list';
  logEvent('اجتماعُ الأسبوع — بدأ'); render(1);
}

function wtMeetEnd(){
  if (!WT_MEET) return;
  var n = wtSince().items.length;
  try { expPdf(['wtmeet'].filter(expAllowed)); } catch (e){ LS_ERR = e; }
  STATE.wtask = STATE.wtask || { rows:[] };
  STATE.wtask.meetAt = Date.now(); STATE.wtask.meetBy = STATE.meta.name || '';
  if (wtSave()){ logEvent('اجتماعُ الأسبوع — خُتم: ' + n + ' تغييرًا'); toast(t('خُتم الاجتماع') + ' \u00b7 ' + nm(n) + ' ' + t('تغييرًا')); }
  WT_MEET = false; WT_MI = 0; WT_MEND = 0; render(1);
}

function wtStatus(id, st){
  var r = wtRow(id); if (!r || WT_ST.indexOf(st) < 0 || r.st === st) return false;
  wtLogPush(r, { st:st }); r.st = st;
  if (st === 'مكتمل') r.doneAt = Date.now();
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — ' + id + ' \u00b7 ' + st, id); toast(t(st)); render(1); return true; }
  return false;
}

function wtAdd(o){
  if (!wtMay()){ toast(t('المهامُّ الأسبوعية للمهندس والوزارة فما فوق')); return false; }
  if (!o.n){ toast(t('اسمُ المهمة مطلوب')); return false; }
  STATE.wtask = STATE.wtask || { rows:[] };
  var mx = wtRows().reduce(function(a, x){ return Math.max(a, +x.id || 0); }, 0);
  STATE.wtask.rows.push({ id:mx + 1, n:o.n, track:o.track || '', code:o.code || '', d:o.d || '',
                          who:o.who || '', st:o.st || 'قيد الانتظار', seen:o.seen || dayKey(Date.now()),
                          due:o.due || '', src:o.src || '', upd:o.upd || '', wbs:o.wbs || '', chal:o.chal || '', req:o.req || '', plan:o.plan || '',
                          log:[{ at:Date.now(), by:STATE.meta.name || '', note:'أُنشئت' }] });
  STATE.wtask.lastId = mx + 1;   /* (V20.5) رقمُ المهمة الجديدة — لربطها بتحدّيها */
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — إضافة: ' + o.n); toast(t('أُضيفت المهمة')); WT_NEW = false; render(1); }
  return true;
}

function wtRemove(id){
  if (!wtMay()){ toast(t('المهامُّ الأسبوعية للمهندس والوزارة فما فوق')); return; }
  try { mfuTaskGone(wtRow(id)); } catch (e){ LS_ERR = e; }   /* (V20.7) */
  STATE.wtask.rows = wtRows().filter(function(x){ return String(x.id) !== String(id); });
  if (wtSave()){ logEvent('حذفُ مهمةٍ أسبوعية — ' + id, id); toast(t('حُذفت المهمة')); WT_OPEN = ''; render(1); }
}

function wtClear(){
  if (!may('settings')){ toast(t('المهامُّ الأسبوعية للمهندس فما فوق')); return; }
  STATE.wtask = { rows:[] };
  if (wtSave()){ logEvent('مسحُ المهام الأسبوعية'); toast(t('مُسحت المهام')); WT_RESET = 0; render(1); }
}
