/* يطبع تقريرَ الوزارة PDF بكروميوم حقيقي — node scripts/ministry-pdf.mjs <report.html> <out.pdf> */
import { createRequire } from 'module';
import { resolve } from 'path';
const require = createRequire(import.meta.url);
const [src, out] = process.argv.slice(2);
if (!src || !out){ console.log('الاستعمال: ministry-pdf.mjs <report.html> <out.pdf>'); process.exit(1); }
let pw; try { pw = require('playwright'); } catch { console.log('::warning::playwright غير مثبَّت — لا PDF'); process.exit(0); }
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
await page.goto('file://' + resolve(src), { waitUntil:'load' });
await page.waitForTimeout(1500);   /* تُكمِل الحلقاتُ حركتَها */
await page.pdf({ path: out, format:'A4', printBackground:true, margin:{ top:'10mm', bottom:'10mm', left:'8mm', right:'8mm' } });
await browser.close();
console.log('✓ PDF: ' + out);
