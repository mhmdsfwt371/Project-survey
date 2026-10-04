import { driveClient, rootFolder, q as qEsc } from './drive-auth.mjs';
import { readFileSync, existsSync } from 'fs'; import { Readable } from 'stream';
const { drive, mode, err } = driveClient(); if (!drive){ console.log('لا درايف:', err || ''); process.exit(1); }
const ROOT = await rootFolder(drive, mode);
const name = 'تقارير المشروع';
const f = await drive.files.list({ q:`name='${qEsc(name)}' and '${ROOT}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`, fields:'files(id)', pageSize:1, supportsAllDrives:true, includeItemsFromAllDrives:true });
const folder = f.data.files?.[0]?.id || (await drive.files.create({ requestBody:{ name, mimeType:'application/vnd.google-apps.folder', parents:[ROOT] }, fields:'id', supportsAllDrives:true })).data.id;
for (const [p, n, mime] of [['/tmp/exp/تحديات-المشاعر-١٤٤٨.xlsx', 'تحديات-المشاعر-١٤٤٨.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], ['/tmp/exp/summary.json', 'تحديات-١٤٤٨-ملخص.json', 'application/json'], ['/tmp/exp/usage.json', 'استعمال-النظام.json', 'application/json'], ['/tmp/exp/diag-lost.json', 'تشخيص-المسوح-المحذوفة.json', 'application/json'], ['/tmp/exp/heal-tombs.json', 'استعادة-المسوح-المختفية.json', 'application/json'], ['/tmp/exp/heal-list.json', 'استعادة-٣-وفحص-العزل.json', 'application/json'], ['/tmp/exp/new3.json', 'النقاط-المضافة-عرفات.json', 'application/json'], ['/tmp/exp/merge-new3.json', 'دمج-النقاط-الثلاث.json', 'application/json'], ['/tmp/exp/fix-khaled.json', 'تصحيح-زيارات-خالد.json', 'application/json'], ['/tmp/exp/old-devices.json', 'الأجهزة-القديمة.json', 'application/json'], ['/tmp/exp/orphans.json', 'الوثائق-اليتيمة.json', 'application/json'], ['/tmp/exp/photos-diag.json', 'تشخيص-الصور.json', 'application/json'], ['/tmp/exp/study-extract.json', 'أرقام-الدراسة-من-السجل.json', 'application/json'], ['/tmp/exp/newsites-check.json', 'فحص-المواقع-المضافة.json', 'application/json'], ['/tmp/exp/hide-placeholders.json', 'إخفاء-نقاط-التفويج-المؤقتة.json', 'application/json']]){
  if (!existsSync(p)) continue;
  const old = await drive.files.list({ q:`name='${qEsc(n)}' and '${folder}' in parents and trashed=false`, fields:'files(id)', supportsAllDrives:true, includeItemsFromAllDrives:true });
  for (const o of old.data.files || []) await drive.files.delete({ fileId:o.id, supportsAllDrives:true }).catch(() => {});
  await drive.files.create({ requestBody:{ name:n, parents:[folder] }, media:{ mimeType:mime, body:Readable.from(readFileSync(p)) }, fields:'id', supportsAllDrives:true });
  console.log('رُفع:', n);
}
