/* (V38.90) moved by scripts/split-late.mjs from src/03z-shared/03z-shared-b-05-from-tasks-office-05-account-backup-continuity.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function bkAgeDays(o){ return o && o.at ? Math.floor((Date.now() - new Date(o.at).getTime()) / 86400000) : null; }
