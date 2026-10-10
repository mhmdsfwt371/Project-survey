/* (مرةً واحدة) جلبُ توكين التطبيق المحفوظ في إعدادات النظام (ghcfg/gh.tok) مشفّرًا بمفتاحٍ عامٍّ — لا يُطبَع ولا يُرفَع إلا مشفّرًا،
   ولا يفكّه إلا صاحبُ المفتاح الخاصّ في بيئة العمل. ثم تُحذف هذه الخطوةُ والمفتاحُ العامّ. */
import admin from 'firebase-admin'; import { readFileSync, writeFileSync, mkdirSync } from 'fs'; import { publicEncrypt, constants } from 'crypto';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const g = (await db.collection('ghcfg').doc('gh').get()).data() || {};
if (!g.tok){ writeFileSync('/tmp/exp/apptok.sealed.txt', 'NONE'); console.log('no token'); process.exit(0); }
const ct = publicEncrypt({ key: readFileSync('scripts/fetch-key.pub.pem'), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(String(g.tok)));
writeFileSync('/tmp/exp/apptok.sealed.txt', ct.toString('base64')); console.log('sealed', ct.length, 'bytes');
