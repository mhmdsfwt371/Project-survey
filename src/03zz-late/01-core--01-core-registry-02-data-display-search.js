/* (V38.90) moved by scripts/split-late.mjs from src/01-core/01-core-registry-02-data-display-search.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function fsi(s){ return '\u2068' + String(s == null ? '' : s) + '\u2069'; }

function fsiText(s){ return String(s == null ? '' : s).replace(BDI_TOK, function(m){ return bdiNeed(m) ? '\u2068' + m + '\u2069' : m; }); }
