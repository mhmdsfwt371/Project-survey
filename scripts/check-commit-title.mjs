/* (V37.74) عنوانُ الالتزام يُفحَص قبل أن يُكتَب — القاعدةُ نفسُها التي يطبّقها audit-health على المرحلة في GitHub:
   «Vس.ص — نصٌّ لا يقلّ عن ثمانية أحرف». كانت لا تُفحَص إلا هناك، فسقطت بوابةُ ٣٧٫٧٣ بعنوان «V37.71–V37.73 — …» ولم يرها فحصٌ محلّيّ. */
import { readFileSync } from 'fs';
const f = process.argv[2]; const subj = f ? String(readFileSync(f, 'utf8')).split('\n')[0].trim() : String(process.argv[3] || '');
if (!/^V\d+\.\d+ — .{8,}/.test(subj)){ console.error('✗ عنوانُ الالتزام ليس بصيغة «Vس.ص — …» (إصدارٌ واحدٌ ثم شرطةٌ طويلةٌ ثم وصف): ' + subj.slice(0, 80)); process.exit(1); }
console.log('✓ عنوانُ الالتزام بصيغته');
