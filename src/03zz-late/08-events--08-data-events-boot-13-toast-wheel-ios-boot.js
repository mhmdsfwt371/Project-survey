/* (V38.90) moved by scripts/split-late.mjs from src/08-events/08-data-events-boot-13-toast-wheel-ios-boot.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
/* (V37.14) نوافذُ القوائم وصورُها تُزال من مكانها — بلا رسم الصفحة */
function supRemove(){ ['supVeil', 'supBox'].forEach(function(i0){ var el0 = document.getElementById(i0); if (el0) el0.remove(); }); }

function svPopRemove(){ ['.svpop-veil', '.svpop', '#svPhoVeil', '#svPhoBox'].forEach(function(q){ document.querySelectorAll(q).forEach(function(el){ el.remove(); }); }); }
