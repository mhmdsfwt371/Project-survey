/* بعد تعديل ملف القاموس: يعيد بصمتَه ويكتب اسمَه الجديد في index.html — node scripts/i18n-rehash.mjs */
import { readFileSync, writeFileSync, readdirSync, renameSync } from 'fs';
import { createHash } from 'crypto';
const cur = readdirSync('i18n').filter(f => /^dict-[0-9a-f]{10}\.js$/.test(f))[0];
if (!cur) throw new Error('لا ملفَ قاموس');
const src = readFileSync('i18n/' + cur, 'utf8'), hash = createHash('sha256').update(src).digest('hex').slice(0, 10), name = 'dict-' + hash + '.js';
if (name !== cur) renameSync('i18n/' + cur, 'i18n/' + name);
let s = readFileSync('index.html', 'utf8'); const n = (s.match(/I18N_FILE = 'i18n\/dict-[0-9a-f]{10}\.js'/g) || []).length;
if (n !== 1) throw new Error('مواضعُ اسم القاموس في index.html: ' + n);
s = s.replace(/I18N_FILE = 'i18n\/dict-[0-9a-f]{10}\.js'/, "I18N_FILE = 'i18n/" + name + "'"); writeFileSync('index.html', s);
console.log('✓ ' + name);
