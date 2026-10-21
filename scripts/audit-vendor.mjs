/* ============================================================================
   FILE    : scripts/audit-vendor.mjs
   PURPOSE : (V38.54) Vendored libraries — the app no longer depends on public CDNs for its own libraries.
             1) every libLoad('vendor/…') path exists on disk, and every vendored script the app loads is in the
                service worker's library list; 2) no script is loaded straight from the internet except Google's own
                services (sign-in, maps); 3) the SheetJS copy matches the hash recorded when it was fetched from its
                official CDN; 4) at runtime the own copy is tried first and the CDN only on failure; 5) the PDF
                fallback font comes from vendor/fonts and no Google Fonts link remains.
   ========================================================================== */
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { JSDOM, VirtualConsole } from 'jsdom';
import { appHtml, srcConcat } from './lib/src.mjs';

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };

const src = srcConcat(), sw = readFileSync('sw.js', 'utf8');
console.log('\n══ ١ · النسخُ المحلّيةُ موجودةٌ ومحفوظةٌ للأوفلاين ══');
const locals = [...src.matchAll(/libLoad\('(vendor\/[^']+)'/g)].map(m => m[1]).filter(p => !p.endsWith('/')).concat([...src.matchAll(/libLoad\('vendor\/firebase\/9\.23\.0\/' \+ f/g)].length ? ['vendor/firebase/9.23.0/firebase-app-compat.js', 'vendor/firebase/9.23.0/firebase-auth-compat.js', 'vendor/firebase/9.23.0/firebase-firestore-compat.js'] : []);
T(locals.length >= 6, 'المحمّلاتُ تطلب النسخةَ المحلّيةَ أوّلًا (' + locals.length + ')');
const missing = locals.filter(p => !existsSync(p));
T(!missing.length, 'وكلُّ ملفٍّ محلّيٍّ موجودٌ في المستودع' + (missing.length ? ' — ناقص: ' + missing.join(' · ') : ''));
const notInSw = locals.filter(p => sw.indexOf("'./" + p + "'") < 0);
T(!notInSw.length, 'وكلُّها في قائمة مكتبات عامل الخدمة' + (notInSw.length ? ' — ناقص: ' + notInSw.join(' · ') : ''));
T(/const KEEP = \[[^\]]*LIB_CACHE/.test(sw) && /const LIB_CACHE = 'nusuk-lib'/.test(sw), 'ومخزنُ المكتبات يبقى عبر التحديثات (لا يُعاد تنزيلُها مع كلِّ نسخة)');
const fonts = [...sw.matchAll(/'\.\/(vendor\/fonts\/[^']+)'/g)].map(m => m[1]);
T(fonts.length === 6 && fonts.every(existsSync), 'وخطُّ Readex Pro البديلُ (عربيٌّ ولاتينيٌّ × ٣ أوزان) موجودٌ ومحفوظ');

console.log('\n══ ٢ · لا تحميلَ مباشرًا من الإنترنت إلا خدماتِ جوجل ══');
const direct = [...src.matchAll(/\.src\s*=\s*['"](https:\/\/[^'"]+)['"]/g)].map(m => m[1]).filter(u => !/^https:\/\/(accounts\.google\.com\/gsi|maps\.googleapis\.com)/.test(u));
T(!direct.length, 'لا سكربتَ يُحمَّل من شبكةٍ عامّةٍ مباشرةً' + (direct.length ? ' — ' + direct.join(' · ') : ''));
T(src.indexOf('fonts.googleapis.com') < 0, 'ولا رابطَ لخطوط جوجل');

console.log('\n══ ٣ · نسخةُ SheetJS كما جُلبت من مصدرها ══');
const x = readFileSync('vendor/xlsx/0.20.3/xlsx.full.min.js'), rec = readFileSync('vendor/xlsx/0.20.3/SHA256', 'utf8').split(/\s+/)[0];
T(createHash('sha256').update(x).digest('hex') === rec && /SheetJS/.test(x.slice(0, 200).toString()), 'بصمةُ الملفِّ تطابق المسجَّلةَ عند الجلب من cdn.sheetjs.com');
T(['vendor/xlsx/0.20.3/LICENSE', 'vendor/exceljs/4.4.0/LICENSE', 'vendor/jszip/3.10.1/LICENSE.markdown', 'vendor/firebase/9.23.0/LICENSE', 'vendor/fonts/readex-pro/LICENSE'].every(existsSync), 'ورخصةُ كلِّ مكتبةٍ بجانبها');

console.log('\n══ ٤ · في التشغيل: المحلّيُّ أوّلًا، والعامُّ احتياطٌ فقط ══');
const vc = new VirtualConsole();
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', url:'https://x.test/app/', pretendToBeVisual:true, virtualConsole:vc });
const w = dom.window; w.fetch = () => Promise.reject(new Error('net')); await new Promise(r => setTimeout(r, 1500));
const run = async (failLocal) => {
  const seen = []; const keep = w.document.head.appendChild.bind(w.document.head);
  w.document.head.appendChild = el => { if (el && el.tagName === 'SCRIPT' && el.src){ seen.push(el.src); setTimeout(() => { const local = el.src.indexOf('/vendor/') > -1; if (local && failLocal) el.onerror && el.onerror(); else el.onload && el.onload(); }, 0); return el; } return keep(el); };
  w.libLoad.fellBack = 0; const ok = await w.libLoad('vendor/jszip/3.10.1/jszip.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  w.document.head.appendChild = keep; return { ok, seen, fell:w.libLoad.fellBack };
};
const a = await run(false), b = await run(true);
T(a.ok && a.seen.length === 1 && /\/vendor\/jszip\//.test(a.seen[0]) && !a.fell, 'النسخةُ المحلّيةُ وحدَها حين تعمل — لا طلبَ للشبكة العامّة');
T(b.ok && b.seen.length === 2 && /cdnjs/.test(b.seen[1]) && b.fell === 1, 'والعامُّ احتياطٌ حين تتعذّر المحلّية — ويُعَدُّ ليظهر في الجهاز');
const face = w.readexFace ? w.readexFace() : '';
T(/https:\/\/x\.test\/app\/vendor\/fonts\/readex-pro\/readex-pro-arabic-400-normal\.woff2/.test(face) && /unicode-range/.test(face), 'وخطُّ الـPDF البديلُ بعنوانٍ مطلقٍ من نسخة التطبيق');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.log('جردُ المكتبات المحلّية فشل \u2717 (' + fails.length + ')'); process.exit(1); }
console.log('المكتباتُ من نسخة التطبيق، والشبكةُ العامّةُ احتياطٌ فقط \u2705'); process.exit(0);
