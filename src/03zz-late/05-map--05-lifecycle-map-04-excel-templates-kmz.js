/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-04-excel-templates-kmz.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-04-excel-templates-kmz.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : xlsPage, xlsSheets, xmlEsc, xlSerial, wtWorkbook, xlsExport, crc32, zipStore, kmzCamTable, kmzBuild, kmiApply, kmiCard
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function xlsPage(){
  var p = (typeof FIELD_PAGES === 'object' && FIELD_PAGES[CUR]) || PAGE[CUR];
  if (!p || !p.body){ toast(t('لا صفحةَ تُصدَّر')); return Promise.resolve(false); }
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return false; }
    var html = '', origSlice = Array.prototype.slice;
    EXP.xlsAll = true;
    try {
      /* قصُّ العرض slice(0, n≥10) على المصفوفات يُعطَّل أثناء البناء وحدَه */
      Array.prototype.slice = function(a, b){
        if (EXP.xlsAll && (a === 0 || a === undefined) && typeof b === 'number' && b >= 10 && this.length > b) return origSlice.call(this, 0);
        return origSlice.apply(this, arguments);
      };
      html = p.body();
    } catch (e){ softErr('إكسل الصفحة', e, 'تعذّر بناءُ الصفحة للتصدير'); }
    finally { Array.prototype.slice = origSlice; EXP.xlsAll = false; }
    if (!html) return false;
    var box = document.createElement('div'); box.innerHTML = html;
    var wb = XLSX.utils.book_new(), n = 0, used = {};
    var tables = box.querySelectorAll('table');
    Array.prototype.forEach.call(tables, function(tb, i){
      var rows = [];
      Array.prototype.forEach.call(tb.querySelectorAll('tr'), function(tr){
        var cells = [];
        Array.prototype.forEach.call(tr.children, function(td){ cells.push(String(td.textContent || '').replace(/\s+/g, ' ').trim()); });
        if (cells.some(function(c){ return c; })) rows.push(cells);
      });
      if (rows.length < 2) return;
      var card = tb.closest('.card'); var h = card ? card.querySelector('h2,h3,h4,.card-title') : null;
      var name = ((h && h.textContent) || (t(p.t) + ' ' + (i + 1))).replace(/[\\\/\?\*\[\]:]/g, ' ').trim().slice(0, 28) || ('جدول ' + (i + 1));
      if (used[name]) name = (name + ' ' + (++used[name])).slice(0, 31); else used[name] = 1;
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = rows[0].map(function(_, ci){ var w = 8; rows.forEach(function(r){ w = Math.max(w, Math.min(46, String(r[ci] == null ? '' : r[ci]).length + 2)); }); return { wch:w }; });
      XLSX.utils.book_append_sheet(wb, ws, name); n++;
    });
    /* القوائمُ التي ليست جداول (المواقع وأمثالُها): عنوانٌ · تفصيلٌ · قيمة */
    Array.prototype.forEach.call(box.querySelectorAll('.list'), function(ls, i){
      var rows = [[t('العنوان'), t('التفاصيل'), t('القيمة')]];
      Array.prototype.forEach.call(ls.children, function(li){
        var g = function(sel){ var el = li.querySelector(sel); return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
        var r = [g('.li-t'), g('.li-s'), g('.li-end')];
        if (!r[0] && !r[1]) r = [String(li.textContent || '').replace(/\s+/g, ' ').trim(), '', ''];
        if (r[0]) rows.push(r);
      });
      if (rows.length < 2) return;
      var card = ls.closest('.card'); var h = card ? card.querySelector('h2,h3,h4,.card-title') : null;
      var name = ((h && h.textContent) || (t(p.t) + ' ' + (n + i + 1))).replace(/[\\\/\?\*\[\]:]/g, ' ').trim().slice(0, 28) || ('قائمة ' + (i + 1));
      if (used[name]) name = (name + ' ' + (++used[name])).slice(0, 31); else used[name] = 1;
      var ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch:34 }, { wch:46 }, { wch:16 }];
      XLSX.utils.book_append_sheet(wb, ws, name); n++;
    });
    if (!n){ toast(t('لا جداولَ في هذه الصفحة')); return false; }
    var tabT = TABS[CUR] ? (tabsOf(CUR).filter(function(x){ return x[0] === tabCur(CUR); })[0] || [])[1] : '';
    XLSX.writeFile(wb, 'نسك-' + t(p.t) + (tabT ? '-' + t(tabT) : '') + '-' + dayKey() + '.xlsx');
    logEvent('إكسل الصفحة — ' + p.t + (tabT ? ' · ' + tabT : '') + ' · ' + nm(n) + ' جدول');
    toast(nm(n) + ' ' + t('جدولًا صُدِّر بكلِّ صفوفه'));
    return true;
  });
}

/* ورقةٌ مبنيّةٌ في اللحظة لا من SHEETS — لنوافذِ التفاصيل */
function xlsSheets(pairs, fname){
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return false; }
    var wb = XLSX.utils.book_new(), n = 0;
    (pairs || []).forEach(function(p){
      var rows = p[1]; if (!rows || rows.length < 2) return;
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = rows[0].map(function(_, i){
        var w = 10; rows.forEach(function(r){ w = Math.max(w, Math.min(46, String(r[i] == null ? '' : r[i]).length + 2)); });
        return { wch:w };
      });
      XLSX.utils.book_append_sheet(wb, ws, String(p[0] || 'ورقة').slice(0, 30)); n++;
    });
    if (!n){ toast(t('لا بيانات للتصدير')); return false; }
    XLSX.writeFile(wb, (fname || 'نسك') + '-' + dayKey() + '.xlsx');
    toast(nm(n) + ' ' + t('ورقةً صُدّرت'));
    return true;
  });
}

function xmlEsc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function xlSerial(iso){
  var d = iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00Z') : null;
  return d && !isNaN(d) ? Math.round((d.getTime() / 86400000) + 25569) : '';
}

function wtWorkbook(){
  return jszipLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة الضغط')); return false; }
    return fetch('docs/templates/tasks-template.xlsx', { cache:'no-store' }).then(function(r){
      if (!r.ok) throw new Error('template ' + r.status);
      return r.arrayBuffer();
    });
  }).then(function(buf){
    if (!buf) return false;
    return JSZip.loadAsync(buf).then(function(zip){
      return zip.file('xl/worksheets/sheet1.xml').async('string').then(function(xml){
        /* صفُّ القالب الأوّل: أنماطُ كلِّ عمودٍ ومعادلاتُ ل·م·ن كما هي */
        var row3 = /<row r="3"[^>]*>[\s\S]*?<\/row>/.exec(xml)[0];
        var st = {}; row3.replace(/<c r="([A-Z]+)3"([^>]*)>/g, function(m, col, attrs){ var mm = /s="(\d+)"/.exec(attrs); st[col] = mm ? mm[1] : ''; return m; });
        var fL = (/<c r="L3"[^>]*>\s*<f>([\s\S]*?)<\/f>/.exec(row3) || [])[1] || '';
        var fM = (/<c r="M3"[^>]*>\s*<f>([\s\S]*?)<\/f>/.exec(row3) || [])[1] || '';
        var fN = (/<c r="N3"[^>]*>\s*<f[^>]*>([\s\S]*?)<\/f>/.exec(row3) || [])[1] || '';
        var R = wtRows(), rows = [];
        var cell = function(ref, col, v, kind){
          var sa = st[col] ? ' s="' + st[col] + '"' : '';
          if (kind === 'n') return v === '' ? '<c r="' + ref + '"' + sa + '/>' : '<c r="' + ref + '"' + sa + '><v>' + v + '</v></c>';
          if (kind === 'f') return '<c r="' + ref + '"' + sa + ' t="str"><f>' + v + '</f></c>';
          if (kind === 'fa') return '<c r="' + ref + '"' + sa + ' t="str"><f t="array" ref="' + ref + '">' + v + '</f></c>';
          return v === '' ? '<c r="' + ref + '"' + sa + '/>' : '<c r="' + ref + '"' + sa + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>';
        };
        R.forEach(function(x, i){
          var n = 3 + i;
          rows.push('<row r="' + n + '" spans="1:18">'
            + cell('A' + n, 'A', i + 1, 'n')
            + cell('B' + n, 'B', x.n || '') + cell('C' + n, 'C', x.track || '') + cell('D' + n, 'D', x.code || '')
            + cell('E' + n, 'E', x.d || '') + cell('F' + n, 'F', x.who || '') + cell('G' + n, 'G', x.st || '')
            + cell('H' + n, 'H', xlSerial(x.seen), 'n') + cell('I' + n, 'I', xlSerial(x.due), 'n')
            + cell('J' + n, 'J', x.src || '') + cell('K' + n, 'K', x.upd || '')
            + cell('L' + n, 'L', fL.replace(/\$H3/g, '$H' + n), 'f')
            + cell('M' + n, 'M', fM.replace(/\$I3/g, '$I' + n), 'f')
            + (fN ? cell('N' + n, 'N', fN, 'fa') : '')
            + cell('O' + n, 'O', x.stop || '') + cell('P' + n, 'P', x.mSun || '') + cell('Q' + n, 'Q', x.mWed || '')
            + '</row>');
        });
        var last = 2 + Math.max(R.length, 1);
        /* الصفوفُ من ٣ فصاعدًا تُستبدَل كلُّها؛ ما قبلها (العنوانُ والرأس) يبقى */
        var head = xml.slice(0, xml.indexOf('<row r="3"'));
        var tail = xml.slice(xml.indexOf('</sheetData>'));
        xml = head + rows.join('') + tail;
        xml = xml.replace(/<dimension ref="[^"]+"\/>/, '<dimension ref="A1:R' + last + '"/>');
        /* التنسيقاتُ الشرطيةُ تمتدّ إلى آخر صف */
        xml = xml.replace(/sqref="([A-Z]+)3:([A-Z]+)\d+"/g, function(m, a, b){ return 'sqref="' + a + '3:' + b + last + '"'; });
        zip.file('xl/worksheets/sheet1.xml', xml);
        return zip.file('xl/tables/table1.xml').async('string').then(function(tx){
          tx = tx.replace(/ref="B2:O\d+"/g, 'ref="B2:O' + last + '"');
          zip.file('xl/tables/table1.xml', tx);
          return zip.file('xl/workbook.xml').async('string');
        }).then(function(wx){
          /* إكسل يعيد الحسابَ عند الفتح — وسلسلةُ الحساب القديمة تُحذَف لأن صفوفَها تغيّرت */
          wx = wx.replace(/<calcPr([^>]*)\/>/, function(m, a){ return '<calcPr' + a.replace(/ fullCalcOnLoad="[^"]*"/, '') + ' fullCalcOnLoad="1"/>'; });
          zip.file('xl/workbook.xml', wx);
          zip.remove('xl/calcChain.xml');
          return zip.file('[Content_Types].xml').async('string');
        }).then(function(ct){
          ct = ct.replace(/<Override[^>]*calcChain\.xml"[^>]*\/>/, '');
          zip.file('[Content_Types].xml', ct);
          return zip.file('xl/_rels/workbook.xml.rels').async('string');
        }).then(function(rl){
          rl = rl.replace(/<Relationship[^>]*calcChain\.xml"[^>]*\/>/, '');
          zip.file('xl/_rels/workbook.xml.rels', rl);
          return zip.generateAsync({ type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        });
      });
    });
  }).then(function(blob){
    if (!blob) return false;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'المهام — ' + dayKey(Date.now()) + '.xlsx';
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast(t('صُدّر الملفُّ بمعادلاته'));
    return true;
  }).catch(function(e){ softErr('تصدير الملف', e, 'تعذّر بناءُ الملف'); return false; });
}

function xlsExport(keys, fname){
  return xlsxLoad().then(function(ok){
    if (!ok){ toast('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة'); return false; }
    var wb = XLSX.utils.book_new(), n = 0;
    (keys || Object.keys(SHEETS)).forEach(function(k){
      if (!SHEETS[k]) return;
      var rows = SHEETS[k]();
      if (!rows || rows.length < 2) return;
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = rows[0].map(function(_, i){
        var w = 10;
        rows.forEach(function(r){ w = Math.max(w, Math.min(46, String(r[i]==null?'':r[i]).length + 2)); });
        return { wch:w };
      });
      XLSX.utils.book_append_sheet(wb, ws, (PV.SHEET_NAMES[k] || k).slice(0, 30));
      n++;
    });
    if (!n){ toast('لا بيانات للتصدير'); return false; }
    XLSX.writeFile(wb, fname || ('نسك-' + dayKey() + '.xlsx'));
    toast(nm(n) + ' ' + t('ورقةً صُدّرت'));
    return true;
  });
}

/* ── KMZ — ZIP مكتوبٌ بالكود بلا مكتبة ── */
function crc32(buf){
  var c, tbl = crc32.t;
  if (!tbl){
    tbl = crc32.t = new Int32Array(256);
    for (var n = 0; n < 256; n++){
      c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tbl[n] = c;
    }
  }
  var crc = -1;
  for (var i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ tbl[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}

function zipStore(name, bytes){
  var nb = new TextEncoder().encode(name), cr = crc32(bytes);
  function u32(v){ return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]; }
  function u16(v){ return [v&255,(v>>>8)&255]; }
  var lf = [].concat([80,75,3,4], u16(20), u16(0), u16(0), u16(0), u16(0),
                     u32(cr), u32(bytes.length), u32(bytes.length),
                     u16(nb.length), u16(0));
  var local = new Uint8Array(lf.length + nb.length + bytes.length);
  local.set(lf, 0); local.set(nb, lf.length); local.set(bytes, lf.length + nb.length);
  var cf = [].concat([80,75,1,2], u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
                     u32(cr), u32(bytes.length), u32(bytes.length),
                     u16(nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(0));
  var central = new Uint8Array(cf.length + nb.length);
  central.set(cf, 0); central.set(nb, cf.length);
  var end = [].concat([80,75,5,6], u16(0), u16(0), u16(1), u16(1),
                      u32(central.length), u32(local.length), u16(0));
  var out = new Uint8Array(local.length + central.length + end.length);
  out.set(local, 0); out.set(central, local.length);
  out.set(new Uint8Array(end), local.length + central.length);
  return out;
}

/* (V23.4) جدولُ كاميرات النقطة في وصف KMZ: الرقمُ والطرازُ والنوعُ والدقةُ والعنوانُ ورابطُ البثّ والوصلة */
function kmzCamTable(x){
  var c = camNetOf(x); if (!c || !c.cams || !c.cams.length) return '';
  var X = function(v){ return String(v == null ? '' : v).replace(/[<>&]/g, function(ch){ return ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&amp;'; }); };
  return '<br><b>Uplink:</b> ' + X([c.cpe ? 'CPE ' + c.cpe : '', c.ant, c.sector, c.secAnt].filter(Boolean).join(' · ')) + (c.status ? '<br><b>Status:</b> ' + X(c.status) : '')
    + '<table border="1" cellpadding="3" style="border-collapse:collapse;font-size:11px"><tr><th>CAM</th><th>Model</th><th>Type</th><th>Spec</th><th>IP</th><th>VLAN</th></tr>'
    + c.cams.map(function(k){ return '<tr><td>' + X(k.n) + '</td><td>' + X(k.model) + '</td><td>' + (k.kind === 'P' ? 'PTZ' : 'Fixed') + '</td><td>' + X(PV.CAM_SPEC[k.model] || '') + '</td><td>' + X(k.ip) + '</td><td>' + X(k.vlan) + '</td></tr>'
        + '<tr><td colspan="6">rtsp://' + X(k.ip) + ':554/cam/realmonitor?channel=1&amp;subtype=0</td></tr>'; }).join('') + '</table>';
}

function kmzBuild(filter, title){
  var X = function(s){ return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var K = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
    '<name>' + X(title) + '</name>',
    '<Style id="camp"><IconStyle><scale>0.8</scale><color>ff4ac9f9</color></IconStyle></Style>',
    '<Style id="cor"><IconStyle><scale>0.8</scale><color>ffa0d63a</color></IconStyle></Style>',
    '<Style id="cam"><IconStyle><scale>0.8</scale><color>ffff7dc7</color></IconStyle></Style>',
    '<Style id="stn"><IconStyle><scale>0.8</scale><color>ff60c9f2</color></IconStyle></Style>',
    '<Style id="jam"><IconStyle><scale>0.8</scale><color>ff3a87e8</color></IconStyle></Style>',
    '<Style id="gte"><IconStyle><scale>0.8</scale><color>ffacb238</color></IconStyle></Style>',
    '<Style id="bld"><IconStyle><scale>0.8</scale><color>ffbfc4b8</color></IconStyle></Style>'];
  var folders = {}, n = 0;
  STATE.sites.forEach(function(x){
    if (filter && !filter(x)) return;
    if (!x.lat || !x.lng) return;
    n++;
    var f = x.zone + ' — ' + x.type;
    if (!folders[f]) folders[f] = [];
    folders[f].push('<Placemark><name>' + X(x.id) + '</name>'
      + '<description><![CDATA[' + X(x.name)
      + (x.sign ? '<br>شاخص: ' + X(x.sign) : '')
      + (x.sq   ? '<br>مربع: '  + X(x.sq)   : '')
      + (x.co   ? '<br>' + X(x.co) : '') + kmzCamTable(x) + ']]></description>'
      + '<styleUrl>#' + (PV.KMZ_STY[x.type] || 'bld') + '</styleUrl>'
      + '<Point><coordinates>' + x.lng + ',' + x.lat + ',0</coordinates></Point></Placemark>');
  });
  Object.keys(folders).forEach(function(f){
    K.push('<Folder><name>' + X(f) + ' (' + folders[f].length + ')</name>');
    K.push(folders[f].join(''));
    K.push('</Folder>');
  });
  K.push('</Document></kml>');
  return { xml:K.join('\n'), count:n };
}

function kmiApply(){
  if (!PV.KMI || !may('edit')) return;
  var take = PV.KMI.rows.filter(function(r){ return r.take; });
  if (!take.length){ toast(t('لم تُحدَّد نقطةٌ للإضافة')); return; }
  var pre = zoneCode(PV.KMI_ZONE);
  var tp  = typeCode(PV.KMI_TYPE);
  var seq = STATE.sites.filter(function(x){ return String(x.id).indexOf('NSK-' + pre + '-' + tp + '-K') === 0; }).length;
  var n = 0;
  take.forEach(function(r){
    seq++; n++;
    var id = 'NSK-' + pre + '-' + tp + '-K' + String(seq).padStart(3, '0');
    var site = { id:id, name:r.p.name || (PV.KMI_ZONE + ' - ' + PV.KMI_TYPE + ' ' + seq),
      zone:PV.KMI_ZONE, type:PV.KMI_TYPE, work:PV.KMI_WORK,
      lat:+r.p.lat.toFixed(6), lng:+r.p.lng.toFixed(6),
      sq:r.p.sq || '', sign:r.p.sign || '', co:r.p.co || '',
      region:'منطقة ' + PV.KMI_ZONE, fstat:'لم يبدأ', inout:'',
      isNew:true, approved:false, src:'kmz', srcFile:PV.KMI.file || '',
      by:STATE.meta.name || '', at:Date.now() };
    STATE.sites.push(site);
    CORE.set('newsites', id, site);
  });
  SITE_IX = null; SITE_TOK = null;
  logEvent('استيرادُ KMZ — أُضيفت ' + n + ' نقطةً · ' + PV.KMI_ZONE + ' · ' + PV.KMI_TYPE);
  notifPush('نقاطٌ مستورَدة', nm(n) + ' ' + t('نقطةً أُضيفت من ملف') + ' — ' + PV.KMI_ZONE, { lv:'مهم' });
  statBump(); PV.KMI = null; toast(nm(n) + ' ' + t('نقطةً أُضيفت'));
  render(1);
}

function kmiCard(){
  if (!may('edit')) return '';
  var ZS = zoneOptions(), TS = Object.keys(typesList());   /* من سجلَّي المشاعر والأنواع لا قوائمَ ثانية (V17.60/V17.72) */
  var head = card('استيراد KMZ / KML من جوجل إيرث',
      '<p class="hint" style="margin:0 0 10px">'
    + esc(t('يُقرأ الملفُّ ويُعايَن قبل أن يُكتب شيء. النقطةُ التي تبعد خمسةَ عشرَ مترًا فأقلَّ عن نقطةٍ عندنا هي هي — مهما اختلف الاسم — فلا تُضاف. وما تجاوزها يُضاف بمعرِّفٍ من نظامنا وبالتصنيف الذي تختاره.'))
    + '</p><div class="grid cols-3">'
    +   '<div class="field"><label>' + esc(t('المشعر')) + '</label><select data-kmiz>'
    +     ZS.map(function(z){ return '<option value="' + esc(z) + '"' + (PV.KMI_ZONE === z ? ' selected' : '') + '>' + esc(t(z)) + '</option>'; }).join('') + '</select></div>'
    +   '<div class="field"><label>' + esc(t('النوع')) + '</label><select data-kmit>'
    +     TS.map(function(x){ return '<option value="' + esc(x) + '"' + (PV.KMI_TYPE === x ? ' selected' : '') + '>' + esc(typeShort(x)) + '</option>'; }).join('') + '</select></div>'
    +   '<div class="field"><label>' + esc(t('وجه العمل')) + '</label><input data-kmiw value="' + esc(PV.KMI_WORK) + '" dir="auto"></div>'
    + '</div>'
    + '<div class="actions" style="margin:8px 0 0">'
    +   '<label class="btn btn-primary btn-sm" style="cursor:pointer">\u2B06 ' + esc(t('اختر ملف KMZ أو KML'))
    +   '<input type="file" accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml" data-kmifile="1" style="display:none"></label>'
    +   (PV.KMI ? btn(t('إلغاء المعاينة'),'btn-quiet btn-sm',' data-kmix="1"') : '')
    + '</div>'
    + (PV.KMI_BUSY ? '<p class="hint" style="margin:8px 0 0">' + esc(t('يُقرأ الملف…')) + '</p>' : ''));
  if (!PV.KMI) return head;
  var R = PV.KMI.rows;
  var cnt = { same:0, doubt:0, new:0 };
  R.forEach(function(r){ cnt[r.st]++; });
  var take = R.filter(function(r){ return r.take; }).length;
  var rows = capList(R, 300).map(function(r, i){
    var p = r.p;
    var badge = r.st === 'same' ? pill('موجودة عندنا','ok') : (r.st === 'doubt' ? pill('مشكوكٌ فيها','wrn') : pill('جديدة','acc'));
    return ['<input type="checkbox" data-kmick="' + i + '"' + (r.take ? ' checked' : '') + ' style="width:18px;min-height:18px">',
            '<strong dir="auto">' + esc(p.name || '—') + '</strong>'
              + (p.shape !== 'point' ? '<br><span class="hint" style="margin:0">' + esc(t(p.shape === 'polygon' ? 'مضلّع — أُخذ مركزُه' : 'خط — أُخذ مركزُه')) + '</span>' : ''),
            '<span class="num">' + p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) + '</span>',
            badge,
            r.near ? ('<span class="num">' + esc(siteKey(r.near)) + '</span><br><span class="hint" style="margin:0">' + nm(Math.round(r.d)) + ' ' + esc(t('م')) + '</span>') : '—',
            esc((p.sign || p.sq || p.co || '').slice(0, 30))];
  });
  return head
    + stats([['في الملف', N(R.length)], ['جديدة', N(cnt['new']), 'acc'],
             ['موجودة عندنا', N(cnt.same), 'ok'], ['مشكوكٌ فيها', N(cnt.doubt), cnt.doubt ? 'wrn' : 'ok'],
             ['ستُضاف', N(take), take ? 'acc' : 'wrn']])
    + cardFlush(t('معاينةُ الملف') + ' \u2014 ' + esc(PV.KMI.file || ''),
        table(['', 'الاسم في الملف','الإحداثيات','الحكم','أقربُ نقطةٍ عندنا','حقولٌ قرأناها'], rows),
        '<div class="actions" style="margin:0">'
        + btn('\u2714 ' + t('أضِف المحدَّد') + ' (' + nm(take) + ')','btn-primary btn-sm',' data-kmigo="1"')
        + btn(t('حدّد الجديدةَ فقط'),'btn-quiet btn-sm',' data-kmiall="new"')
        + btn(t('ألغِ التحديد'),'btn-quiet btn-sm',' data-kmiall="none"')
        + '</div>')
    + '<p class="hint">' + esc(t('«موجودة عندنا» لا تُضاف افتراضًا — وإن أضفتها صارت نقطتين في موضعٍ واحد. و«مشكوكٌ فيها» قرارُك: قريبةٌ واسمُها يشبه، فراجعها على الخريطة قبل أن تقرّر.')) + '</p>';
}
