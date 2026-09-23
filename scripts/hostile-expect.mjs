/* ═══════════════════════════════════════════════════════════════════════════
   توقّعاتُ الحسابات المعادية — تُقرأ في اختبار المحاكي (rules-test) وفي جرده
   الساكن (audit-hostile).
   ───────────────────────────────────────────────────────────────────────────
   ثلاثُ شخصيات: str غريبٌ مسجَّلُ الدخول بلا وثيقة · ina فنيٌّ سجّل نفسَه ولم
   يُفعَّل · tec فنيٌّ ميدانيٌّ فعّال. لكلِّ مجموعةٍ في القواعد سطرٌ هنا:
     مجموعةٌ عادية: خمسةُ أحرفٍ لـ قراءة · قائمة · إنشاء · تعديل · حذف
     وثيقةٌ مفردة (settings/<اسم>): ثلاثةٌ لـ قراءة · كتابة · حذف
   A يُقبَل · D يُرفَض · - لا يُختبَر (مع السبب). والمجموعاتُ تُعَدُّ من ملف
   القواعد نفسِه — فمجموعةٌ جديدةٌ بلا سطرٍ هنا تُسقِط الحارس.
   ═════════════════════════════════════════════════════════════════════════ */
const DENY5 = 'DDDDD', DENY3 = 'DDD';
const office = (tec, seed) => ({ str:DENY5, ina:DENY5, tec, seed });
export const HOSTILE = {
  maints:      office('AAAAA'),
  steps:       office('AAADD'),
  pcode:       office('DDDDD'),
  ghcfg:       office('DDDDD'),
  provision:   office('DDDDD', { by:'someone', role:'tech' }),
  att:         office('AADDD', { uid:'someone', day:'2026-01-01' }),
  pending:     { str:'ADDDD', ina:'ADDDD', tec:'ADDDD', seed:{ name:'x', user:'H1', role:'tech' } },
  users:       office('AADDD', { name:'x', role:'tech', active:true }),
  recs:        office('AAAAD', { review:'pending' }),
  inss:        office('AAAAD', { approved:false }),
  props:       office('AAAAD'),
  photos:      office('AAAAD'),
  tasks:       office('AAAAD'),
  srvorders:   office('AAAAD'),
  hb:          office('AAAAA'),
  hbev:        office('AAADD'),
  colist:      office('AADDD', { st:'req' }),
  events:      office('AAADD', { site:'S1' }),
  stats:       office('AAAAD'),
  dismantles:  office('AAAAD'),
  newsites:    office('AAAAD'),
  coreqs:      office('AAADD'),
  fixreqs:     office('AAADD'),
  sites:       office('AAAAD'),
  ships:       office('AAAAD'),
  vehicles:    office('AAAAA'),
  vehAsn:      office('AAAAD'),
  accounts:    office('DDDDD'),
  inventory:   office('AAAAD'),
  purchases:   office('DDDDD'),
  teams:       office('AAAAD'),
  bonus:       office('AADDD'),
  workreqs:    office('AAAAD'),
  baseline:    office('AADDD'),
  changes:     office('AAADD'),
  hse:         office('AAAAD'),
  ncr:         office('AAADD'),
  ipc:         office('DDDDD'),
  presence:    office('AADDD'),
  bugs:        office('DDADD', { uid:'someone' }),
  misc:        office('DDDDD'),
  /* الوثائقُ المفردة — القائمةُ لا تُختبَر: شرطُ المعرِّف لا يُثبَت لاستعلام */
  'settings/pulse':    { str:DENY3, ina:DENY3, tec:'AAD' },
  'settings/bridge':   { str:DENY3, ina:DENY3, tec:'ADD' },
  'settings/sysreport':{ str:DENY3, ina:DENY3, tec:'DDD' },
  'settings/contacts': { str:DENY3, ina:DENY3, tec:'ADD' },
  'settings/cotel':    { str:DENY3, ina:DENY3, tec:'ADD' },
  'settings/wtask':    { str:DENY3, ina:DENY3, tec:'ADD' },
  'settings/perms':    { str:DENY3, ina:DENY3, tec:'ADD' },
  'settings/roles':    { str:DENY3, ina:DENY3, tec:'ADD' },
  'settings/{id}':     { str:DENY3, ina:DENY3, tec:'ADD' }
};

/* أهدافُ الاختبار من نصِّ القواعد: كلُّ `match /<مجموعة>/{…}` وكلُّ `match /settings/<وثيقة>` */
export function rulesTargets(rules){
  const out = [], seen = new Set();
  for (const m of rules.matchAll(/match\s+\/(\w+)\/(\{\w+\}|\w+)\s*\{/g)){
    const col = m[1], part = m[2];
    if (col === 'databases') continue;
    const key = part.startsWith('{') ? (col === 'settings' ? 'settings/{id}' : col) : col + '/' + part;
    if (seen.has(key)) continue; seen.add(key);
    if (key === 'settings/{id}') out.push({ key, path:'settings/H1', single:true });
    else if (part.startsWith('{')) out.push({ key, path:col, single:false });
    else out.push({ key, path:key, single:true });
  }
  return out;
}
