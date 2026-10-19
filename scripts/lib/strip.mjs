/* ============================================================================
   FILE    : scripts/lib/strip.mjs
   PURPOSE : (V38.33) Comment stripping for the deployed file. src/ keeps every comment (the decision log);
             index.html ships without them: 3181 comments = 463 KB raw, ~26% of the gzipped download on
             Mina's network. Removal is token-exact via acorn (never a regex), so strings containing
             '//' or '/*' are untouched; only comments and the blank lines they leave behind go.
   ========================================================================== */
import { createRequire } from 'module';
/* acorn ships with jsdom (always installed where the audits run) — no extra dependency */
const acorn = createRequire(import.meta.url)('acorn');
export function stripJs(js){
  const cm = [];
  acorn.parse(js, { ecmaVersion:2020, sourceType:'script', onComment:cm });
  cm.sort((a, b) => a.start - b.start);
  let out = '', last = 0;
  for (const c of cm){ out += js.slice(last, c.start); last = c.end; }
  out += js.slice(last);
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}
/* The page is head(html+css) + <script>…</script> + tail; only the script body is stripped. */
export function stripPage(html){
  const a = html.indexOf('<script>'), b = html.lastIndexOf('</script>');
  if (a < 0 || b < 0 || b < a) return html;
  return html.slice(0, a + 8) + stripJs(html.slice(a + 8, b)) + html.slice(b);
}
