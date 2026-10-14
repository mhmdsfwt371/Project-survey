/* ═══ (V37.84) سجلُّ النقاط للأدوات — مصدرٌ واحدٌ بترتيبٍ ثابت ═══
   كان كلُّ سكربتٍ يقصُّ السجلَّ من index.html بطريقته. والسجلُّ في طريقه للخروج من
   ملفِّ التطبيق (المفتوح للزوار)، فصار له مصدرٌ واحدٌ يُجرَّب بالترتيب:
   ١) ملفٌّ محليٌّ خاصٌّ خارج المستودع (data/registry.json — مستثنى من جيت)
   ٢) السجلُّ المضمَّن في index.html ما دام مضمَّنًا
   ٣) القاعدة (settings/registry) لمن يملك مفتاحَ الخدمة — في السحابة. */
import { readFileSync, existsSync } from 'fs';

export function regFromHtml(html){
  const k = html.indexOf('var SITES_RAW = '); if (k < 0) return null;
  const at = html.indexOf('{', k);
  const nl = html.indexOf('\n', k);
  if (at < 0 || (nl > -1 && at > nl)) return null;   /* «= null;» أو ما يشبهه: غيرُ مضمَّن */
  /* نهايةُ الكائن بعدِّ الأقواس لا بنمطٍ نصّي (درسُ photos-sync) */
  let depth = 0, str = false, esc = false, end = -1;
  for (let i = at; i < html.length; i++){
    const c = html[i];
    if (str){ if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
    if (c === '"') str = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0){ end = i + 1; break; }
  }
  return end > at ? JSON.parse(html.slice(at, end)) : null;
}
const ok = (R) => R && Array.isArray(R.g) && Array.isArray(R.p) && (R.g.length + R.p.length) > 0;

export function regSync(){
  const f = process.env.NUSUK_REG_FILE || 'data/registry.json';
  if (existsSync(f)){ const R = JSON.parse(readFileSync(f, 'utf8')); if (ok(R)) return R; }
  if (existsSync('index.html')){ const R = regFromHtml(readFileSync('index.html', 'utf8')); if (ok(R)) return R; }
  return null;
}
export function regMust(){
  const R = regSync();
  if (!R) throw new Error('سجلُّ النقاط غيرُ متاح: لا data/registry.json ولا سجلَّ مضمَّنًا — شغّل scripts/reg-fetch.mjs بمفتاح الخدمة');
  return R;
}
export async function regFromDb(db){
  const d = await db.collection('settings').doc('registry').get();
  const v = d.exists ? d.data() : null;
  return ok(v) ? v : null;
}
