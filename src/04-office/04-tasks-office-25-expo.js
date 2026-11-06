/* ============================================================================
   FILE    : src/04-office/04-tasks-office-25-expo.js
   DOMAIN  : Office — the EXPO module (V45.3)
   PURPOSE : The EXPO command center link and the EXPO devices (type, name, VPN address, serial), each address a direct link, editable by the office
   DEFINES : PV.EXPO, PV.EXPO_URL, PV.EXPO_TYPES, expoLoad, expoSave, expoParse, expoDevHref, PAGE.expo, clickExpo
   NOTE    : Owner (6 Nov): «الإكسبو زي أدون — حاجة من فوق توديني على البورتال، وموديول فيه الـIPs كلها بأسمائها، وكل IP لينك أدخل
             عليه دايركت (بالـVPN)، وأقدر أعدّل الاسم والـIP». The addresses are internal (VPN) and live in settings/expo, never in this
             public code: the office reads and writes them, executives read them, nobody else — the rules say so. The list is loaded
             on opening the page (a single get), edited in place, and saved through the queue like any other settings document.
   ════════════════════════════════════════════════════════════════════════════════════════ */
PV.EXPO_URL = 'https://expo.nusukreaders.net/command-center';
PV.EXPO_TYPES = ['جيت واي', 'كاميرا', 'ريدر', 'أنتنا', 'أخرى'];
PV.EXPO = PV.EXPO || null;          /* { url, devs:[{ id, type, name, ip, sn }] } once loaded */
PV.EXPO_ED = '';                    /* the device id being edited ('new' for a new one) */

function expoLoad(force){
  if (PV.EXPO && !force) return Promise.resolve(PV.EXPO);
  if (typeof FB === 'undefined' || !FB.ready || !FB.db){ PV.EXPO = PV.EXPO || { url:PV.EXPO_URL, devs:[], off:1 }; return Promise.resolve(PV.EXPO); }
  return DB.col('settings').doc('expo').get().then(function(d){
    var v = (d && d.exists && d.data()) || {};
    PV.EXPO = { url: v.url || PV.EXPO_URL, devs: Array.isArray(v.devs) ? v.devs : [] };
    return PV.EXPO;
  }).catch(function(e){ softErr('الإكسبو', e, t('تعذّر تحميل أجهزة الإكسبو')); PV.EXPO = { url:PV.EXPO_URL, devs:[], err:1 }; return PV.EXPO; });
}
function expoSave(){
  if (!PV.EXPO) return;
  var v = { url: PV.EXPO.url || PV.EXPO_URL, devs: PV.EXPO.devs, at: Date.now() };
  CORE.set('cfg', 'expo', v);
  logEvent('تعديل أجهزة الإكسبو — ' + v.devs.length);
}
/* one device per line: «النوع، الاسم، IP، السيريال» — commas, tabs or a copied table row; the IP is found wherever it sits */
function expoParse(text){
  var out = [];
  String(text || '').split(/\r?\n/).forEach(function(line){
    var ln = line.trim(); if (!ln) return;
    var ipm = ln.match(/\b(\d{1,3}(?:\.\d{1,3}){3})(?::\d{1,5})?\b/); if (!ipm) return;
    var cells = ln.split(/\t|,|،|\s{2,}|\|/).map(function(c){ return c.trim(); }).filter(Boolean);
    var type = cells.filter(function(c){ return PV.EXPO_TYPES.indexOf(c) > -1; })[0] || '';
    var rest = cells.filter(function(c){ return c !== type && c.indexOf(ipm[1]) < 0 && !/^\d{1,2}$/.test(c) && !/^[٠-٩]{1,2}$/.test(c); });
    var name = rest.filter(function(c){ return /[A-Za-z\u0600-\u06FF]/.test(c) && !/^[A-Z0-9]{8,}$/.test(c); })[0] || ipm[1];
    var sn = rest.filter(function(c){ return /^[A-Z0-9]{8,}$/i.test(c) && c !== name; })[0] || '';
    out.push({ id: uid36(), type: type || (/^ANT/i.test(name) ? 'أنتنا' : /reader/i.test(name) ? 'ريدر' : /^GW/i.test(name) ? 'جيت واي' : 'أخرى'), name: name, ip: ipm[0], sn: sn });
  });
  return out;
}
function expoDevHref(ip){ ip = String(ip || '').trim(); if (!ip) return ''; return /^https?:\/\//i.test(ip) ? ip : 'http://' + ip; }

PAGE.expo = { m:'المتابعة', t:'الإكسبو',
  l:'بوابةُ مركز القيادة وأجهزةُ الإكسبو بعناوينها — كلُّ عنوانٍ رابطٌ يُفتح مباشرةً على شبكة الـVPN.',
  body:function(){
    if (!PV.EXPO){ expoLoad().then(function(){ render(1); }); return '<p class="hint">' + esc(t('جارٍ التحميل…')) + '</p>'; }
    var E = PV.EXPO, ed = may('settings') || effRole(ROLE) === 'engineer' || effRole(ROLE) === 'admin', q = (PV.EXPO_Q || '').toLowerCase();
    var groups = {}; E.devs.forEach(function(d){ var k = d.type || 'أخرى'; (groups[k] = groups[k] || []).push(d); });
    var row = function(d){
      if (PV.EXPO_ED === d.id) return expoEditRow(d);
      return '<tr><td><b>' + esc(d.name || '') + '</b>' + (d.sn ? '<div class="hint" style="margin:0"><bdi dir="ltr">' + esc(d.sn) + '</bdi></div>' : '') + '</td>'
        + '<td><a href="' + esc(expoDevHref(d.ip)) + '" target="_blank" rel="noopener" style="font-weight:700"><bdi dir="ltr">' + esc(d.ip) + '</bdi> \u2197</a></td>'
        + '<td style="white-space:nowrap">' + (ed ? btn('\u270E ' + t('تعديل'), 'btn-quiet btn-sm', ' data-expoed="' + esc(d.id) + '"') : '') + '</td></tr>';
    };
    var types = PV.EXPO_TYPES.filter(function(k){ return groups[k]; }).concat(Object.keys(groups).filter(function(k){ return PV.EXPO_TYPES.indexOf(k) < 0; }));
    var h = '<div class="card" style="margin:0 0 12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">'
      + '<div style="flex:1 1 260px"><b style="font-size:16px">' + esc(t('مركز قيادة الإكسبو')) + '</b><div class="hint" style="margin:2px 0 0"><bdi dir="ltr">' + esc(E.url) + '</bdi></div></div>'
      + '<a class="btn btn-primary" href="' + esc(E.url) + '" target="_blank" rel="noopener">\u2197 ' + esc(t('افتح البوابة')) + '</a>'
      + (ed ? btn('\u270E ' + t('تعديل الرابط'), 'btn-secondary btn-sm', ' data-expourl="1"') : '') + '</div>'
      + (PV.EXPO_URLED ? '<div class="card" style="margin:0 0 12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><input id="expoU" dir="ltr" value="' + esc(E.url) + '" style="flex:1 1 280px">' + btn('\u2713 ' + t('حفظ'), 'btn-primary btn-sm', ' data-expourlsave="1"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-expourl="0"') + '</div>' : '')
      + '<div class="hint" style="margin:0 0 10px">' + esc(t('العناوينُ داخل شبكة الـVPN: شغّل الـVPN على جهازك ثم اضغط العنوان فيفتح الجهازُ مباشرةً.')) + '</div>';
    if (E.err) h += '<p class="hint" style="color:#E5484D">' + esc(t('تعذّر تحميل أجهزة الإكسبو')) + ' — ' + btn(t('أعد المحاولة'), 'btn-quiet btn-sm', ' data-exporeload="1"') + '</p>';
    h += stats([['الأجهزة', nm(E.devs.length)]].concat(types.map(function(k){ return [k, nm(groups[k].length)]; })));
    h += '<div class="actions" style="margin:0 0 10px;gap:8px;flex-wrap:wrap"><input type="search" id="expoQ" placeholder="' + esc(t('ابحث باسمٍ أو عنوان')) + '" value="' + esc(PV.EXPO_Q || '') + '" style="flex:1 1 220px">'
      + (ed ? btn('\u2795 ' + t('إضافة جهاز'), 'btn-secondary btn-sm', ' data-expoed="new"') + btn('\u{1F4CB} ' + t('لصق قائمة'), 'btn-secondary btn-sm', ' data-expopaste="1"') : '') + '</div>';
    if (PV.EXPO_ED === 'new') h += '<div class="card" style="margin:0 0 10px"><table class="tbl" style="width:100%"><tbody>' + expoEditRow({ id:'new', type:'كاميرا', name:'', ip:'', sn:'' }) + '</tbody></table></div>';
    if (PV.EXPO_PASTE) h += '<div class="card" style="margin:0 0 10px"><b>' + esc(t('لصق قائمة')) + '</b><div class="hint" style="margin:4px 0 6px">' + esc(t('سطرٌ لكل جهاز: النوع، الاسم، العنوان، السيريال — أو انسخ صفوفَ الجدول كما هي. تُضاف إلى الموجود، والمكرَّرُ بالاسم والعنوان نفسيهما يُتخطّى.')) + '</div>'
      + '<textarea id="expoPasteT" rows="8" style="width:100%;direction:ltr"></textarea><div class="actions" style="margin:6px 0 0">' + btn(t('أضف'), 'btn-primary btn-sm', ' data-expopasteok="1"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-expopaste="0"') + '</div></div>';
    if (!E.devs.length && !PV.EXPO_PASTE && PV.EXPO_ED !== 'new') h += '<p class="hint">' + esc(t('لا أجهزةَ مسجّلةً بعد — أضفها بـ«لصق قائمة» أو «إضافة جهاز».')) + '</p>';
    types.forEach(function(k){
      var L = groups[k].filter(function(d){ return !q || (d.name + ' ' + d.ip + ' ' + (d.sn || '')).toLowerCase().indexOf(q) > -1; });
      if (!L.length) return;
      h += '<h4 style="margin:12px 0 6px">' + esc(t(k)) + ' <span class="hint" style="margin:0">' + nm(L.length) + '</span></h4>'
        + '<div style="overflow-x:auto"><table class="tbl" style="width:100%"><thead><tr><th>' + esc(t('الاسم')) + '</th><th>' + esc(t('العنوان')) + '</th><th></th></tr></thead><tbody>' + L.map(row).join('') + '</tbody></table></div>';
    });
    return h;
  }
};
function expoEditRow(d){
  return '<tr><td colspan="3"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
    + '<select id="expoT">' + PV.EXPO_TYPES.map(function(k){ return '<option value="' + esc(k) + '"' + (d.type === k ? ' selected' : '') + '>' + esc(t(k)) + '</option>'; }).join('') + '</select>'
    + '<input id="expoN" value="' + esc(d.name || '') + '" placeholder="' + esc(t('الاسم')) + '" style="flex:1 1 160px">'
    + '<input id="expoI" value="' + esc(d.ip || '') + '" placeholder="172.20.11.4" dir="ltr" style="flex:0 1 150px">'
    + '<input id="expoS" value="' + esc(d.sn || '') + '" placeholder="' + esc(t('السيريال')) + '" dir="ltr" style="flex:0 1 170px">'
    + btn('\u2713 ' + t('حفظ'), 'btn-primary btn-sm', ' data-exposave="' + esc(d.id) + '"')
    + (d.id !== 'new' ? btn('\u2715 ' + t('حذف'), 'btn-quiet btn-sm', ' data-expodel="' + esc(d.id) + '" style="color:#E5484D"') : '')
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-expoed=""') + '</div></td></tr>';
}
/* named click… so the global guard (actList) reads its attributes */
function clickExpo(e){
  var el;
  if ((el = e.target.closest('[data-expoed]'))){ PV.EXPO_ED = el.getAttribute('data-expoed'); PV.EXPO_PASTE = 0; render(1); return true; }
  if ((el = e.target.closest('[data-expopaste]'))){ PV.EXPO_PASTE = el.getAttribute('data-expopaste') === '1' ? 1 : 0; PV.EXPO_ED = ''; render(1); return true; }
  if (e.target.closest('[data-exporeload]')){ PV.EXPO = null; expoLoad(1).then(function(){ render(1); }); return true; }
  if (e.target.closest('[data-expopasteok]')){
    var ta = document.getElementById('expoPasteT'), add = expoParse(ta ? ta.value : ''), have = {};
    PV.EXPO.devs.forEach(function(d){ have[(d.name + '|' + d.ip).toLowerCase()] = 1; });
    var fresh = add.filter(function(d){ var k = (d.name + '|' + d.ip).toLowerCase(); if (have[k]) return false; have[k] = 1; return true; });
    if (!fresh.length){ toast(t('لم يُعثَر على عناوين جديدة في النص')); return true; }
    PV.EXPO.devs = PV.EXPO.devs.concat(fresh); PV.EXPO_PASTE = 0; expoSave(); render(1); toast(t('أُضيف') + ' ' + nm(fresh.length)); return true; }
  if ((el = e.target.closest('[data-exposave]'))){
    var id = el.getAttribute('data-exposave'), g = function(k){ var n = document.getElementById(k); return n ? String(n.value || '').trim() : ''; };
    var v = { type:g('expoT'), name:g('expoN'), ip:g('expoI'), sn:g('expoS') };
    if (!v.name || !/^(https?:\/\/)?[\w.-]+(:\d{1,5})?(\/.*)?$/.test(v.ip)){ toast(t('اكتب الاسمَ وعنوانًا صحيحًا')); return true; }
    if (id === 'new') PV.EXPO.devs.push(Object.assign({ id:uid36() }, v));
    else PV.EXPO.devs = PV.EXPO.devs.map(function(d){ return d.id === id ? Object.assign({}, d, v) : d; });
    PV.EXPO_ED = ''; expoSave(); render(1); toast(t('حُفظ')); return true; }
  if ((el = e.target.closest('[data-expodel]'))){
    var did = el.getAttribute('data-expodel'); if (!confirm(t('حذفُ هذا الجهاز من القائمة؟'))) return true;
    PV.EXPO.devs = PV.EXPO.devs.filter(function(d){ return d.id !== did; }); PV.EXPO_ED = ''; expoSave(); render(1); return true; }
  if ((el = e.target.closest('[data-expourl]'))){ PV.EXPO_URLED = el.getAttribute('data-expourl') === '1' ? 1 : 0; render(1); return true; }
  if (e.target.closest('[data-expourlsave]')){
    var un = document.getElementById('expoU'), u = un ? String(un.value || '').trim() : '';
    if (!/^https:\/\/\S+$/.test(u)){ toast(t('اكتب رابطًا يبدأ بـ https://')); return true; }
    PV.EXPO.url = u; PV.EXPO_URLED = 0; expoSave(); render(1); toast(t('حُفظ')); return true; }
  return false;
}
