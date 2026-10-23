/* (V38.90) moved by scripts/split-late.mjs from src/01-core/01-core-registry-03-config-values.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
/* حقلُ تاريخٍ موصولٌ بالمصدر — يُخزَّن رقمًا (مللي ثانية) لأن CFG رقميّة */
function cfgDate(path){
  var v = cfgGet(path);
  return '<input type="date" value="' + (v ? dayKey(v) : '') + '" data-cfgdate="' + path + '">';
}
