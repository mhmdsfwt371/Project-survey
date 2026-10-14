/* (V37.84) يجلب سجلَّ النقاط من القاعدة إلى data/registry.json (مستثنى من جيت) —
   للسحابة قبل الجرود حين يخرج السجلُّ من ملف التطبيق. يحتاج FIREBASE_SERVICE_ACCOUNT. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
import { regFromDb, regSync } from './lib/registry.mjs';
if (regSync()){ console.log('السجلُّ متاحٌ محليًّا — لا جلب'); process.exit(0); }
const SA = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!SA){ console.log('::error::FIREBASE_SERVICE_ACCOUNT غير مضبوط ولا سجلَّ محليّ'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
const R = await regFromDb(admin.firestore());
if (!R){ console.log('::error::لا سجلَّ منشورًا في settings/registry — انشره من «حماية سجلّ النقاط»'); process.exit(1); }
mkdirSync('data', { recursive:true });
writeFileSync('data/registry.json', JSON.stringify({ z:R.z, t:R.t, w:R.w, co:R.co || [], dm:R.dm || [], g:R.g, p:R.p }));
console.log(`✓ السجلُّ من القاعدة: ${R.g.length + R.p.length} نقطة · ${R.ver || ''}`);
process.exit(0);
