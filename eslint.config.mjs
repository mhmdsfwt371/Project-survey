/* (V31.1) فاحصُ النحو في قائمة الحارس — قواعدُ قليلةٌ حاسمة: لا متغيرَ غيرَ معلَن، لا مفتاحَ مكرَّرًا، لا إعادةَ إعلان. وغيرُ المستعمل تحذيرٌ لا رفض. */
import globals from 'globals';
export default [{ files:['index.html.js'], languageOptions:{ ecmaVersion:2020, sourceType:'script', globals:{ ...globals.browser, L:'readonly', firebase:'readonly', XLSX:'readonly', JSZip:'readonly', docx:'readonly', QRCode:'readonly', maplibregl:'readonly', google:'readonly', pmtiles:'readonly', protomapsL:'readonly', APP_VER:'readonly' } },
  rules:{ 'no-undef':'error', 'no-dupe-keys':'error', 'no-redeclare':'warn', 'no-unreachable':'warn', 'no-unused-vars':'off' } }];
