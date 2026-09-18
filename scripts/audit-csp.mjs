/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سياسة المصادر (V17.61) — node scripts/audit-csp.mjs
   ───────────────────────────────────────────────────────────────────────────
   الاستضافةُ لا تسمح بترويسات حماية، فالسياسةُ وسمٌ في الصفحة. وخطرُها أنها
   صامتة: مصدرٌ يُنسى فلا يُحمَّل شيءٌ ولا يُقال لماذا — والخريطةُ مدخلُ الميدان.
   فهذا الجردُ يقرأ كلَّ مصدرٍ خارجيٍّ مكتوبٍ في الشيفرة ويسأل السياسةَ: أتأذنين
   له؟ فلا يُضاف مصدرٌ غدًا ويسقط صامتًا، ولا تُفتَح السياسةُ على مصراعيها.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); }
  else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };

const html = readFileSync('index.html', 'utf8');
const sw   = readFileSync('sw.js', 'utf8');

/* ── ١ · الوسمُ قائمٌ ومقروء ───────────────────────────────────────────── */
const m = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html);
T(!!m, 'وسمُ سياسة المصادر في الرأس');
if (!m){ console.log(`\nنجح ${pass} · فشل ${fails.length}`); process.exit(1); }
const CSP = m[1];
const dir = {};
CSP.split(';').forEach(p => {
  const q = p.trim().split(/\s+/);
  if (q[0]) dir[q[0]] = q.slice(1);
});
const has = (d, v) => (dir[d] || []).indexOf(v) > -1;

T(has('default-src', "'self'"), 'الأصلُ المسموح: هذا الموقعُ وحدَه');
T(has('object-src', "'none'") && has('base-uri', "'self'"),
  'ولا كائناتٍ مضمَّنة، ولا تحويلَ أصلِ الروابط');
T(has('script-src', "'self'") && !has('script-src', "'unsafe-eval'") && !has('script-src', '*')
  && !has('script-src', 'https:'),
  'والسكربتُ من قائمةٍ مسمّاةٍ لا من أيِّ موقع — وبلا تنفيذِ نصٍّ حيّ');
T(has('worker-src', 'blob:'), 'وعاملُ محرّك الثلاثي يُبنى من blob فأُذن له');
T(!has('connect-src', '*') && !has('connect-src', 'https:'),
  'والاتصالُ مقيَّدٌ بما يستعمله التطبيقُ فعلًا');
T((dir['frame-src'] || []).every(v => /^https:\/\//.test(v)) && (dir['frame-src'] || []).length > 0,
  'والإطاراتُ من مواقعَ مسمّاةٍ فقط: ' + (dir['frame-src'] || []).join(' '));

/* ── ٢ · كلُّ مصدرٍ في الشيفرة مأذونٌ له ──────────────────────────────── */
const allow = (d, host) => (dir[d] || []).some(v => {
  if (v === "'self'" || v.charAt(0) === "'") return false;
  const h = v.replace(/^(https|wss):\/\//, '').replace(/\/.*$/, '');
  if (h === host) return true;
  if (h.charAt(0) === '*') return host.endsWith(h.slice(1));
  return false;
});

/* المصادرُ التي تُحمَّل سكربتًا: عنصرُ script أو استيرادٌ حيّ */
const SCRIPT_HOSTS = [...new Set([
  ...[...html.matchAll(/(?:js\.src|script\.src|\.src)\s*=\s*['"]https:\/\/([^\/'"]+)/g)].map(x => x[1]),
  ...[...html.matchAll(/import\(\s*['"]https:\/\/([^\/'"]+)/g)].map(x => x[1]),
  ...[...html.matchAll(/https:\/\/([^\/'"]+)\/firebasejs/g)].map(x => x[1]),
  ...[...html.matchAll(/loadScript\(\s*['"]https:\/\/([^\/'"]+)/g)].map(x => x[1])
])];
const noScript = SCRIPT_HOSTS.filter(h => !allow('script-src', h));
T(!noScript.length, 'كلُّ ما يُحمَّل سكربتًا مأذونٌ له: ' + SCRIPT_HOSTS.join(' · '), noScript.join(' · '));

/* المصادرُ التي تُطلَب بالشبكة: fetch أو XHR أو نمطُ خريطةٍ أو بلاطاتٌ */
const FETCH_HOSTS = [...new Set(
  [...html.matchAll(/(?:fetch\(\s*['"`]|open\(\s*'[A-Z]+'\s*,\s*['"`])https:\/\/([^\/'"`\s]+)/g)].map(x => x[1])
)];
const noFetch = FETCH_HOSTS.filter(h => !allow('connect-src', h));
T(!noFetch.length, 'وكلُّ ما يُطلَب بالشبكة مأذونٌ له: ' + FETCH_HOSTS.length + ' مصدرًا', noFetch.join(' · '));

/* شبكةُ التطبيق المعروفة: تُكتَب بالاسم فلا تُفلت من نمطٍ لم يلتقطها — فإن
   نُقل مصدرٌ أو أُضيف مثلُه ظهر هنا لا في الميدان */
const NET = ['firestore.googleapis.com', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com',
  'firebaseinstallations.googleapis.com', 'www.googleapis.com', 'drive.google.com', 'accounts.google.com',
  'raw.githubusercontent.com', 'api.github.com', 'tiles.openfreemap.org', 's3.amazonaws.com',
  'www.gstatic.com', 'cdn.sheetjs.com', 'cdnjs.cloudflare.com',
  /* تجلبها مكتبةُ دخولِ جوجل بنفسها ولا تُذكَر في شيفرتنا — رآها المتصفّحُ
     الحقيقيُّ مرفوضةً في V17.61، فتُكتَب هنا لئلا تُنسى ثانيةً */
  'apis.google.com', 'content.googleapis.com',
  /* إطارُ إتمام الدخول: يفتحه فايربيز على نطاق المشروع (V17.63) */
  'project-survey-60600.firebaseapp.com'];
const noNet = NET.filter(h => !allow('connect-src', h));
const noScr = ['apis.google.com', 'accounts.google.com', 'www.gstatic.com'].filter(h => !allow('script-src', h));
T(!noScr.length, 'ومكتباتُ جوجل تُحمَّل: هي تجلب بعضَها بعضًا فالنطاقُ كلُّه مأذون', noScr.join(' · '));
T(!noNet.length, 'وشبكةُ التطبيق المعروفةُ كلُّها مأذونةٌ بالاسم: ' + NET.length + ' مصدرًا', noNet.join(' · '));
/* المصادقةُ تفتح إطارَ إتمامِ الدخول على نطاق المشروع — يُفحَص بالاسم (V17.63) */
const AUTH_DOM = (/authDomain:\s*['"]([^'"]+)['"]/.exec(html) || [])[1] || '';
T(!!AUTH_DOM && allow('frame-src', AUTH_DOM) && allow('connect-src', AUTH_DOM),
  'وإطارُ إتمام الدخول مأذونٌ تأطيرًا واتصالًا: ' + AUTH_DOM);
const TILES = ['tile.openstreetmap.org', 'server.arcgisonline.com'];
T(TILES.every(h => has('img-src', 'https:') || allow('img-src', h)), 'وبلاطاتُ الخريطة تُرسَم صورًا مأذونةً');

/* ما يخبّئه عاملُ الخدمة يُطلَب بالشبكة أوّلًا — فما خُبّئ يجب أن يكون مأذونًا */
const SW_HOSTS = (/\/([a-z0-9|\\.\-]+)\/\.test\(url\.host\)/.exec(sw) || [])[1];
if (SW_HOSTS){
  const pats = SW_HOSTS.split('|').map(x => x.replace(/\\\./g, '.'));
  const bad = pats.filter(p => !(dir['connect-src'] || []).concat(dir['img-src'] || [])
    .some(v => v.indexOf(p) > -1 || v === 'https:'));
  T(!bad.length, 'وما يخبّئه عاملُ الخدمة مأذونٌ له: ' + pats.join(' · '), bad.join(' · '));
}

/* البلاطاتُ والصورُ: تُترَك مفتوحةً عمدًا (خوادمُ بلاطاتٍ كثيرةٌ وصورٌ من درايف) */
T(has('img-src', 'https:') && has('img-src', 'data:') && has('img-src', 'blob:'),
  'والصورُ والبلاطاتُ مفتوحةٌ عمدًا — خوادمُها كثيرةٌ وخطرُها صورةٌ لا شيفرة');

/* ── ٣ · لا ترويسةَ موازيةٌ تناقضها، ولا تنفيذَ نصٍّ حيٍّ في الشيفرة ──── */
T(!/\beval\s*\(/.test(html) && !/new\s+Function\s*\(/.test(html),
  'ولا تنفيذَ نصٍّ حيٍّ في الشيفرة أصلًا');
T((html.match(/<meta http-equiv="Content-Security-Policy"/g) || []).length === 1,
  'ووسمٌ واحدٌ لا يتناقض مع ثانٍ');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ سياسة المصادر نظيف \u2705');
process.exit(0);
