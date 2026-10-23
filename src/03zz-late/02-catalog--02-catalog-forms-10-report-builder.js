/* ============================================================================
   FILE    : src/03zz-late/02-catalog--02-catalog-forms-10-report-builder.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/02-catalog/02-catalog-forms-10-report-builder.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : rbFavSave, rbFavPin, rbPresetsAdd, rbFavDel, rbPopKey, rbPopCols, rbPopRow, rbPopCard, rbPopName, rbRun, rbXls
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function rbFavSave(name, shared){
  var q = rbSentence(); name = String(name || '').trim(); if (!name) return false;
  var f = { name:name, q:q, sel:Object.assign({}, rbState().sel), at:Date.now(), by:STATE.meta.name || '' };
  if (shared){
    if (!rbFavMayShare()){ toast(t('المفضّلةُ المشتركةُ للمهندس فما فوق')); return false; }
    var S = rbFavShared().filter(function(x){ return x.name !== name; }).map(function(x){ delete x.shared; return JSON.stringify(x); }); S.push(JSON.stringify(f));
    CFG.lists = CFG.lists || {}; CFG.lists.rbFav = S; cfgPushSoon('lists'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
    logEvent('مفضّلةُ تقاريرَ مشتركة — ' + name + ' — ' + q); return true;
  }
  var L = rbFavLocal().filter(function(x){ return x.name !== name; }); L.push(f);
  try { localStorage.setItem('nsk14.rbFav', JSON.stringify(L)); } catch (e){ LS_ERR = e; }
  logEvent('مفضّلةُ تقارير — ' + name + ' — ' + q); return true;
}

/* (V38.49) pinned reports: a favourite with pin:true is computed on every visit to the assistant and shown as a card with
   its count and the change since the previous day (snapshot per device); personal pins are on the device, team pins in the lists */
function rbFavPin(i){
  var all = rbFavs(), f = all[+i]; if (!f) return false;
  if (f.shared){ if (!rbFavMayShare()){ toast(t('المفضّلةُ المشتركةُ للمهندس فما فوق')); return false; }
    CFG.lists.rbFav = rbFavShared().map(function(x){ if (x.name === f.name) x.pin = !x.pin; delete x.shared; return JSON.stringify(x); }); cfgPushSoon('lists'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1; return true; }
  var L = rbFavLocal().map(function(x){ if (x.name === f.name) x.pin = !x.pin; return x; }); try { localStorage.setItem('nsk14.rbFav', JSON.stringify(L)); } catch (e){ LS_ERR = e; } return true;
}

function rbPresetsAdd(){
  var have = {}; rbFavs().forEach(function(f){ have[f.name] = 1; });
  var L = rbFavLocal(), n = 0, keep = rbState().sel;
  rbPresets().forEach(function(p){ if (have[p.name]) return; rbState().sel = Object.assign({}, p.sel); L.push({ name:p.name, q:rbSentence(), sel:Object.assign({}, p.sel), at:Date.now(), by:STATE.meta.name || '', pin:true }); n++; });
  rbState().sel = keep;
  try { localStorage.setItem('nsk14.rbFav', JSON.stringify(L)); } catch (e){ LS_ERR = e; }
  if (n) logEvent('التقاريرُ الجاهزةُ أُضيفت — ' + n);
  return n;
}

function rbFavDel(i){
  var all = rbFavs(), f = all[+i]; if (!f) return false;
  if (f.shared){
    if (!rbFavMayShare()){ toast(t('المفضّلةُ المشتركةُ للمهندس فما فوق')); return false; }
    CFG.lists.rbFav = rbFavShared().filter(function(x){ return x.name !== f.name; }).map(function(x){ delete x.shared; return JSON.stringify(x); }); cfgPushSoon('lists'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1; return true;
  }
  var L = rbFavLocal().filter(function(x){ return x.name !== f.name; }); try { localStorage.setItem('nsk14.rbFav', JSON.stringify(L)); } catch (e){ LS_ERR = e; } return true;
}

function rbPopKey(pop, r){
  var g = rbState().sel.group || '', x = r.x;
  if (g === 'zone') return x.zone || '\u2014'; if (g === 'type') return x.type || '\u2014'; if (g === 'co') return x.co || t('بلا شركة');
  if (g === 'tech') return r.by ? dispName(r.by) : '\u2014'; if (g === 'block'){ var m = /مربع\s*([0-9A-Za-z\u0660-\u0669]+)/.exec(x.name || ''); return m ? t('مربع') + ' ' + m[1] : '\u2014'; }
  if (g === 'ccat') return r.n || '\u2014'; if (g === 'cgroup') return r.grp || '\u2014'; if (g === 'pkind') return r.kind || '\u2014'; if (g === 'day') return r.at ? dayKey(r.at) : '\u2014';
  if (g === 'tst') return r.st || '\u2014'; if (g === 'ttrack') return r.track || '\u2014'; if (g === 'twho') return r.who || '\u2014';
  return '';
}

function rbPopCols(pop){ return pop === 'chal' ? ['النقطة', 'الاسم', 'المشعر', 'التحدي', 'جهة المعالجة', 'الوصف', 'الفني', 'التاريخ'] : pop === 'task' ? ['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الموعد', 'متأخّرة', 'آخر تحديث'] : ['النقطة', 'الاسم', 'المشعر', 'نوع الصورة', 'الحالة', 'بواسطة', 'التاريخ']; }

function rbPopRow(pop, r){ return pop === 'chal' ? [r.x.id, r.x.name || '', r.x.zone || '', r.n, r.grp, r.desc, r.by ? dispName(r.by) : '', r.at ? fmtDT(r.at) : '']
                                              : pop === 'task' ? [r.r.n, r.track, r.who, r.st, r.r.due || '', r.late ? t('نعم') : '', r.r.upd || '']
                                              : [r.x.id, r.x.name || '', r.x.zone || '', r.kind, r.up ? t('مرفوعة') : t('بانتظار الرفع'), r.by ? dispName(r.by) : '', r.at ? fmtDT(r.at) : '']; }

function rbPopCard(pop){
  var rows = rbPopRows(pop), g = rbState().sel.group, unit = pop === 'chal' ? 'تحدٍّ' : pop === 'task' ? 'مهمة' : 'صورة';
  var body;
  if (g && rbPopKey(pop, rows[0] || { x:{} }) !== '' || (g && rows.length === 0)){
    var G = {}; rows.forEach(function(r){ var k = rbPopKey(pop, r); G[k] = (G[k] || 0) + 1; });
    var L = Object.keys(G).sort(function(a, b){ return G[b] - G[a]; });
    body = L.length ? table([t('المجموعة'), t('العدد'), '%'], L.map(function(k){ return [esc(k), '<span class="num">' + nm(G[k]) + '</span>', '<span class="num">' + nm(Math.round(G[k] / rows.length * 100)) + '%</span>']; }).concat([[esc(t('الإجمالي')), '<span class="num">' + nm(rows.length) + '</span>', '']])) : '';
  } else body = rows.slice(0, 15).map(function(r){ var c = rbPopRow(pop, r);
      if (pop === 'task') return '<div class="kk-zl" style="margin:3px 0"><span>' + esc(c[0]) + ' \u00b7 ' + esc(c[2] || '\u2014') + ' \u00b7 ' + pill(c[3], r.late ? 'bad' : c[3] === 'مكتمل' ? 'ok' : '') + (c[4] ? ' <span class="hint" style="margin:0">' + esc(c[4]) + '</span>' : '') + '</span>' + btn('\u{1F4C4}', 'btn-quiet btn-sm', ' data-wtopen="' + esc(r.r.id) + '"') + '</div>';
      return '<div class="kk-zl" style="margin:3px 0"><span><bdi>' + esc(c[0]) + '</bdi> \u00b7 ' + esc(c[3]) + (pop === 'chal' && r.desc ? ' \u2014 <span class="hint" style="margin:0">' + esc(r.desc.slice(0, 60)) + '</span>' : '') + '</span>' + btn('\u{1F4C4}', 'btn-quiet btn-sm', ' data-site="' + esc(r.x.id) + '"') + '</div>'; }).join('')
    + (rows.length > 15 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي في الملف')) + ' (' + nm(rows.length - 15) + ')</p>' : '');
  if (!rows.length) body = '<p class="hint" style="margin:0">' + esc(t('لا شيءَ ينطبق عليه الشروط')) + '</p>';
  return card((pop === 'chal' ? '\u26A0 ' : pop === 'task' ? '\u{1F4CB} ' : '\u{1F4F7} ') + t('تقرير') + ' \u00b7 ' + nm(rows.length) + ' ' + t(unit), body + (rows.length ? '<div class="actions">' + btn('\u2B07 ' + t('إكسل'), 'btn-primary btn-sm', ' data-rbxls="' + esc(pop) + '"') + '</div>' : ''));
}

function rbPopName(pop){ return pop === 'chal' ? 'التحديات' : pop === 'task' ? 'المهام الأسبوعية' : 'الصور'; }

function rbRun(pop){ rbState().out = rbPopCard(pop); rbState().open = true; var o = document.getElementById('rbOut'); if (o) o.innerHTML = rbState().out; logEvent('تقرير ' + rbPopName(pop) + ' — ' + (pop === 'task' ? rbPopChips(pop).replace(/<[^>]+>/g, ' ') : rbSentence())); }

function rbXls(pop){
  var rows = rbPopRows(pop); if (!rows.length){ toast(t('لا شيءَ ينطبق عليه الشروط')); return; }
  var cols = rbPopCols(pop).map(function(c){ return t(c); }), body = rows.map(function(r){ return rbPopRow(pop, r); });
  var g = rbState().sel.group, sheets = [];
  if (g){ var G = {}; rows.forEach(function(r){ var k = rbPopKey(pop, r); G[k] = (G[k] || 0) + 1; }); sheets.push([t('التجميع'), [[t('المجموعة'), t('العدد')]].concat(Object.keys(G).map(function(k){ return [k, G[k]]; }))]); }
  sheets.push([t(rbPopName(pop)), [cols].concat(body)]);
  sheets.push([t('الشروط'), [[t('الجملة'), pop === 'task' ? rbPopChips(pop).replace(/<[^>]+>/g, ' ').trim() : rbSentence()], [t('العدد'), rows.length], [t('الوقت'), fmtDT()], [t('بواسطة'), dispName(STATE.meta.name || '')]]]);
  xlsSheets(sheets, 'nusuk-' + pop + '-' + dayKey(Date.now()) + '.xlsx');
  logEvent('إكسل ' + rbPopName(pop) + ' — ' + rows.length);
}
