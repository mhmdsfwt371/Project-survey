/* مصدرُ القواميس بعد الفصل (V21.6): ملفُ i18n/dict-<بصمة>.js إن وُجد، وإلا الملفُ الرئيسي */
import { readFileSync, readdirSync, existsSync } from 'fs';
export function dictSrc(fallback){
  try { if (existsSync('i18n')){ const f = readdirSync('i18n').filter(x => /^dict-[0-9a-f]{10}\.js$/.test(x))[0]; if (f) return readFileSync('i18n/' + f, 'utf8'); } } catch {}
  return fallback == null ? '' : fallback;
}
export function dictFile(){ try { const f = readdirSync('i18n').filter(x => /^dict-[0-9a-f]{10}\.js$/.test(x))[0]; return f ? 'i18n/' + f : ''; } catch { return ''; } }
