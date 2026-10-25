/* ═══ (V38.28) مصدرٌ واحدٌ لقائمة ملفات src/ — المجلّداتُ بالمجال، والترتيبُ بالمسار الكامل ═══
   كان المصدرُ سبعةَ عشرَ ملفًّا مسطّحةً أكبرُها ٥٨٠٠ سطر؛ صار ٩٤ ملفًّا في ثمانية مجلّداتٍ بمجالها (نواة · كتالوج · مسح ·
   مكتب · خريطة · وزارة · تقارير · أحداث)، بلا تغييرٍ في بايتٍ واحدٍ من ناتج البناء. الترتيبُ هو ترتيبُ المسار الكامل
   (00-shell/00-head.html … 99-shell/99-tail.html)، وكلُّ أداةٍ تقرأ المصدرَ تمرّ من هنا لا من readdirSync('src'). */
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
export function srcFiles(root = 'src'){
  const out = [];
  (function walk(d){ for (const f of readdirSync(d).sort()){ const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(html|js)$/.test(f)) out.push(relative(root, p).split('\\').join('/')); } })(root);
  return out.sort();
}
export function srcPaths(root = 'src'){ return srcFiles(root).map(f => root + '/' + f); }
export function srcJs(root = 'src'){ return srcPaths(root).filter(f => f.endsWith('.js')); }
export function srcConcat(root = 'src'){ return srcPaths(root).map(f => readFileSync(f, 'utf8')).join(''); }
export function srcFind(re, root = 'src'){ return srcPaths(root).find(f => re.test(readFileSync(f, 'utf8'))); }

/* ── (V38.39) core + chunks ──
   The shipped page is index.html (shell + core script + a deferred <script> tag) plus app-office.js (the office,
   ministry and reports domains). The audits run the same code in the same order through appHtml(): the chunk is
   appended after the core script, exactly where the browser executes the deferred file. */
export const CHUNK_DIRS = ['03zz-late', '04-office', '06-ministry', '07-reports'];   /* (V38.90) 03zz-late: what the core alone never reaches (split-late.mjs) */
export const CHUNK_FILE = 'app-office.js';
export function isChunkFile(rel){ return CHUNK_DIRS.some(d => rel.startsWith(d + '/')); }
export function coreFiles(root = 'src'){ return srcFiles(root).filter(f => !isChunkFile(f)); }
export function chunkFiles(root = 'src'){ return srcFiles(root).filter(isChunkFile); }
export function appVersion(root = 'src'){ const m = readFileSync(root + '/00-shell/00-head.html', 'utf8').match(/نسخة (V\d+\.\d+)/); return m ? m[1] : 'V0'; }
export const CHUNK_TRAILER = "\n/* end of app-office.js */\nif (typeof nskChunkReady === 'function') nskChunkReady();\n";
/* (V38.89) the shipped files are minified — whitespace and comments only, no name is renamed (inline handlers and the
   chunk call globals by name): 573 → 529 KB on the wire for the field core, about a second of a cold start on the Mina
   line. The tests keep the readable page (full), and the real browser and the post-deploy check run the shipped one.
   The minifier is pinned (5.51.2) so that \`build.mjs --check\` gives the same bytes here and on the server. */
async function minJs(js){
  let terser;
  try { terser = await import('terser'); } catch { throw new Error('البناءُ يحتاج terser@5.51.2 — npm i --no-save terser@5.51.2'); }
  const r = await terser.minify(js, { compress: false, mangle: false, format: { comments: false, ascii_only: false, inline_script: true, keep_quoted_props: true, quote_style: 3 }   /* data literals stay JSON (the registry reader parses one) */ });
  if (!r || typeof r.code !== 'string' || !r.code.length) throw new Error('تعذّر تصغيرُ الشيفرة');
  return r.code;
}
export async function buildParts(root = 'src', opt = {}){
  const { stripJs } = await import('./strip.mjs');
  const read = f => readFileSync(root + '/' + f, 'utf8');
  const head = read('00-shell/00-head.html'), tail = read('99-shell/99-tail.html');
  const core = coreFiles(root).filter(f => f.endsWith('.js')).map(read).join('');
  const chunk = chunkFiles(root).map(read).join('');
  const ver = appVersion(root);
  let coreJs = stripJs(core), chunkJs = stripJs(chunk) + CHUNK_TRAILER;
  const full = head + coreJs + '\n' + chunkJs + tail;   /* the readable page the audits run */
  if (opt.ship){ coreJs = await minJs(regAsJsonParse(coreJs)); chunkJs = (await minJs(chunkJs)) + '\n'; }
  const tag = '</script>\n<script defer src="' + CHUNK_FILE + '?v=' + ver.replace(/^V/, '') + '"></script>';
  const index = head + coreJs + tag + tail.slice('</script>'.length);
  return { index, chunk:chunkJs, full, ver };
}
/* the whole app in one page, in production order — what every jsdom audit loads */
let _full = null;
export async function appHtml(root = 'src'){ if (!_full) _full = (await buildParts(root)).full; return _full; }
/* (V39.41) the embedded registry (SITES_RAW, ~300 KB of JSON on one line) ships as JSON.parse('…') instead of an object
   literal: engines parse a JSON string markedly faster than the same object as JavaScript, which is what the field's older
   phones pay on every cold start. Same data, same variable; only the shipped page changes (the audits' page keeps the
   literal). scripts/lib/registry.mjs reads both forms. */
export function regAsJsonParse(js){
  const m = /var SITES_RAW\s*=\s*\{/.exec(js); if (!m) return js;
  const at = m.index + m[0].length - 1;
  let depth = 0, str = false, esc = false, end = -1;
  for (let i = at; i < js.length; i++){
    const c = js[i];
    if (str){ if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
    if (c === '"') str = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0){ end = i + 1; break; }
  }
  if (end < 0) return js;
  const json = js.slice(at, end); JSON.parse(json);   /* only valid JSON is converted */
  const lit = "'" + json.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029').replace(/<\/script/gi, '<\\/script') + "'";
  return js.slice(0, at) + 'JSON.parse(' + lit + ')' + js.slice(end);
}
