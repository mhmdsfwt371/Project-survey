/* رفعُ ملفات التحديث الأسبوعي إلى الدرايف: مجلد «التقارير الأسبوعية/<التاريخ>» تحت جذر المشروع — node scripts/weekly-drive.mjs <files...> */
import { driveClient, rootFolder, explain } from './drive-auth.mjs';
import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';
const { drive, err } = driveClient(); if (err || !drive){ console.log('weekly-drive: ' + (err || 'لا عميل') + ' — تخطّي'); process.exit(0); }
const root = await rootFolder(drive);
async function folder(name, parent){ const q = `name='${name.replace(/'/g, "\\'")}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const r = await drive.files.list({ q, fields:'files(id)', supportsAllDrives:true, includeItemsFromAllDrives:true }); if (r.data.files && r.data.files[0]) return r.data.files[0].id;
  const c = await drive.files.create({ requestBody:{ name, mimeType:'application/vnd.google-apps.folder', parents:[parent] }, fields:'id', supportsAllDrives:true }); return c.data.id; }
const day = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
const top = await folder('التقارير الأسبوعية', root), sub = await folder(day, top);
const MIME = { pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation', pdf:'application/pdf', txt:'text/plain', html:'text/html' };
let n = 0;
for (const f of process.argv.slice(2)){
  if (!existsSync(f)) continue;
  try { const r = await drive.files.create({ requestBody:{ name:basename(f), parents:[sub] }, media:{ mimeType:MIME[f.split('.').pop()] || 'application/octet-stream', body:(await import('stream')).Readable.from(readFileSync(f)) }, fields:'id,webViewLink', supportsAllDrives:true }); n++; console.log('✓', basename(f), r.data.webViewLink || r.data.id); }
  catch (e){ console.log('✗', basename(f), explain(e)); }
}
console.log('weekly-drive: رُفع', n, 'ملفًا إلى التقارير الأسبوعية/' + day);
