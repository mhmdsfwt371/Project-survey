/* ═══ (V37.84) سجلُّ النقاط للأدوات — مصدرٌ واحدٌ بترتيبٍ ثابت ═══
   كان كلُّ سكربتٍ يقصُّ السجلَّ من index.html بطريقته. والسجلُّ في طريقه للخروج من
   ملفِّ التطبيق (المفتوح للزوار)، فصار له مصدرٌ واحدٌ يُجرَّب بالترتيب:
   ١) ملفٌّ محليٌّ خاصٌّ خارج المستودع (data/registry.json — مستثنى من جيت)
   ٢) السجلُّ المضمَّن في index.html ما دام مضمَّنًا
   ٣) القاعدة (settings/registry) لمن يملك مفتاحَ الخدمة — في السحابة. */
import { readFileSync, existsSync } from 'fs';

export function regFromHtml(html){
  /* (V38.89) the shipped page is minified: «var SITES_RAW={» — and with no line breaks, the next «{» could belong to
     another statement, so the object must start right after the «=» */
  const m = /var SITES_RAW\s*=\s*/.exec(html); if (!m) return null;
  const at = m.index + m[0].length;
  if (html[at] !== '{') return null;   /* «= null;» أو ما يشبهه: غيرُ مضمَّن */
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
/* (V38.88) the published copy is one JSON string (json) — the database refuses arrays inside arrays */
export function regDecodeDoc(v){
  if (v && typeof v.json === 'string'){ try { return Object.assign(JSON.parse(v.json), { ver: v.ver || '', at: v.at || 0, by: v.by || '' }); } catch { return null; } }
  return v || null;
}
/* the fingerprint the app computes (regVer) — the same key order, the same hash */
export function regVer(R){
  const s = JSON.stringify({ z: R.z, t: R.t, w: R.w, co: R.co, dm: R.dm, g: R.g, p: R.p });
  let h = 5381; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + s.length.toString(36);
}
export async function regFromDb(db){
  const d = await db.collection('settings').doc('registry').get();
  const v = regDecodeDoc(d.exists ? d.data() : null);
  return ok(v) ? v : null;
}
