/* ═══════════════════════════════════════════════════════════════════════════
   بريدٌ من النظام — node scripts/mail-send.mjs "<العنوان>" <ملف النص>
   ───────────────────────────────────────────────────────────────────────────
   النظامُ يُخطِر داخلَه وعلى واتساب، ولا يصل من لا يفتحه. وهذا يرسل من السير
   بريدًا قياسيًّا (SMTP) — بلا خادمٍ لنا وبلا خدمةٍ مدفوعة: أيُّ صندوقٍ يعطي
   كلمةَ مرورِ تطبيقٍ يكفي لعشرات الرسائل يوميًّا.
   الأسرارُ (Settings ← Secrets ← Actions): SMTP_HOST · SMTP_USER · SMTP_PASS
   · MAIL_TO (مفصولةٌ بفاصلة) · واختياريًّا SMTP_PORT وMAIL_FROM.
   وما لم تُضبَط لا يُفشَل شيء: يُكتَب أنه لم يُرسَل ويمضي السير — فالبريدُ
   إضافةٌ على التقرير لا شرطٌ له.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const need = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO'];
const miss = need.filter(k => !String(process.env[k] || '').trim());
if (miss.length){
  console.log('::notice title=البريد غير مضبوط::لم يُرسَل بريد — ينقص: ' + miss.join(' · '));
  process.exit(0);
}

const subject = process.argv[2] || 'أفاقي — تقرير';
const file = process.argv[3];
let body = '';
if (file){
  try { body = readFileSync(file, 'utf8'); }
  catch { console.log('::warning::ملفُّ النص غير موجود: ' + file); }
}
if (!body.trim()){ console.log('::notice::لا نصَّ يُرسَل'); process.exit(0); }

const require = createRequire(import.meta.url);
let nodemailer;
try { nodemailer = require('nodemailer'); }
catch { console.log('::warning::nodemailer غير مثبَّت في هذه الخطوة — لم يُرسَل بريد'); process.exit(0); }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const port = +(process.env.SMTP_PORT || 587);
const to = process.env.MAIL_TO.split(/[,;\s]+/).filter(Boolean);
const html = '<div dir="rtl" lang="ar" style="font-family:system-ui,Segoe UI,Tahoma,sans-serif;'
           + 'font-size:14px;line-height:1.7;white-space:pre-wrap">' + esc(body) + '</div>';

try {
  const tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  /* مرفقاتٌ إن وُجدت (V17.85): مساراتٌ مفصولةٌ بفاصلة — التقريرُ PDF مثلًا */
  const attachments = String(process.env.MAIL_ATTACH || '').split(',').map(s => s.trim()).filter(Boolean)
    .map(path => ({ path, filename: path.split('/').pop() }));
  const info = await tx.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to, subject, text: body, html, attachments
  });
  console.log('✓ أُرسل البريدُ إلى ' + to.length + ' عنوانًا — ' + (info.messageId || ''));
} catch (e){
  /* لا يُفشَل السير: التقريرُ نُشر أصلًا، لكنَّ تعثُّرَ البريد يُكتَب حيث يُرى */
  console.log('::error title=تعذّر إرسالُ البريد::' + String(e.message).slice(0, 200));
  console.log('✗ لم يصل البريد — والتقريرُ منشورٌ في مكانه');
}
process.exit(0);
