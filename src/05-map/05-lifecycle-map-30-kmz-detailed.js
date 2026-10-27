/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-30-kmz-detailed.js
   DOMAIN  : Map & lifecycle — exports
   PURPOSE : A detailed KMZ for Google Earth: every planned point, once per app filter as folders, with a full balloon.
   DEFINES : kmzColor, kmzRow, kmzFullBuild, zipDeflate, kmzFull
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             design notes.
   ============================================================================ */
/* (V39.78) owner: «عاوز ملف KMZ مفصّل بكل النقاط المخطط ليها تركيب، بكل الفلاتر تبقى موجودة في الـKMZ عشان يبقى سهل
   عليّا أدوّر عليها في جوجل إيرث». The main tree (المشعر ← النوع ← الحالة) is on; every other filter of the app is a
   folder group of its own, off by default — tick one to see that cut alone. Names carry the point's name and its id, so
   Google Earth's search finds either; the balloon holds every field. Compressed when the browser can. */
function kmzColor(hex){ var h = String(hex || '#8A939D').replace('#', ''); if (h.length !== 6) h = '8A939D'; return 'ff' + h.slice(4, 6) + h.slice(2, 4) + h.slice(0, 2); }
function kmzRow(k, v){ return v === '' || v == null ? '' : '<tr><td style="color:#666;padding:2px 8px;white-space:nowrap">' + k + '</td><td style="padding:2px 8px"><b>' + v + '</b></td></tr>'; }
function kmzFullBuild(){
  var X = function(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var pts = (STATE.sites || []).filter(function(x){ return x && x.lat && x.lng && !x.dupOf; });
  var styles = {}, P = {}, G = {};
  var groups = [['zone', 'حسب المشعر'], ['type', 'حسب نوع النقطة'], ['life', 'حسب الحالة'], ['exec', 'حسب التحديات'], ['ccg', 'حسب معالجة التحديات'],
                ['work', 'حسب وجه العمل'], ['co', 'حسب الشركة'], ['route', 'حسب المسار'], ['floor', 'أدوار منشأة الجمرات'], ['tard', 'المخيمات الترددية']];
  groups.forEach(function(g){ G[g[0]] = {}; });
  var put = function(g, v, id){ if (v === '' || v == null) return; (G[g][v] = G[g][v] || []).push(id); };
  var tree = {};
  pts.forEach(function(x){
    var tx = typeof taxOf === 'function' ? taxOf(x) : { g:x.zone, t:x.type }, life = typeof lifeOf === 'function' ? lifeOf(x) : '';
    var L = (typeof LIFE !== 'undefined' && LIFE[life]) || { n:life, c:'#8A939D' };
    var ex = (typeof execStatusMemo === 'function' && typeof execLabelOf === 'function') ? execLabelOf(execStatusMemo(x)) : '';
    var gs = typeof ccGroupsOfSite === 'function' ? ccGroupsOfSite(x) : [];
    var gn = gs.map(function(g){ var d = (typeof CC_GROUPS !== 'undefined' ? CC_GROUPS : []).filter(function(c){ return c.g === g; })[0]; return d ? d.n : g; });
    var fl = typeof siteFloor === 'function' ? siteFloor(x) : null, fln = fl == null ? '' : floorName(fl);
    var tard = typeof siteTard === 'function' && siteTard(x), tbar = tard && typeof siteTbar === 'function' ? siteTbar(x) : '';
    var r = (STATE.recs || {})[x.id] || {}, sid = 's' + String(life || 'x').replace(/[^\w]/g, '') + (L.c || '').replace('#', '');
    if (!styles[sid]) styles[sid] = '<Style id="' + sid + '"><IconStyle><scale>0.9</scale><color>' + kmzColor(L.c) + '</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle><LabelStyle><scale>0.7</scale></LabelStyle></Style>';
    var typeL = (typeof TAX_DEF !== 'undefined' && TAX_DEF[tx.t] && TAX_DEF[tx.t].l) || tx.t || x.type;
    var desc = '<div dir="rtl" style="font-family:Tahoma,Arial;font-size:13px"><table>'
      + kmzRow('المعرّف', X(x.id)) + kmzRow('الاسم', X(x.name)) + kmzRow('المشعر', X(tx.g || x.zone)) + kmzRow('نوع النقطة', X(typeL))
      + kmzRow('المربع', X(x.sq)) + kmzRow('الشاخص', X(x.sign)) + kmzRow('الشركة', X(x.co)) + kmzRow('وجه العمل', X(x.work))
      + kmzRow('الحالة', '<span style="color:' + X(L.c) + '">\u25CF</span> ' + X(L.n)) + kmzRow('التحديات', X(ex)) + kmzRow('معالجة التحديات', X(gn.join('، ')))
      + kmzRow('الدور', X(fln)) + kmzRow('المسار', X(x.route)) + kmzRow('نوع المخيم', tard ? 'ترددي' + (tbar ? ' — ' + X(tbar) + ' بوابة' : '') : '')
      + kmzRow('الزيارة', r.at ? X((typeof dispName === 'function' ? dispName(r.by) : r.by) || '') + ' · ' + X(typeof fmtDT === 'function' ? fmtDT(r.at) : '') : '')
      + kmzRow('الإحداثيات', X((+x.lat).toFixed(6) + ', ' + (+x.lng).toFixed(6)))
      + '</table><p><a href="https://www.google.com/maps?q=' + (+x.lat) + ',' + (+x.lng) + '">\u{1F4CD} خرائط جوجل</a></p></div>';
    P[x.id] = '<Placemark><name>' + X((x.name ? x.name + ' · ' : '') + x.id) + '</name><styleUrl>#' + sid + '</styleUrl>'
      + '<description><![CDATA[' + desc + ']]></description>'
      + '<ExtendedData><Data name="المشعر"><value>' + X(tx.g || x.zone) + '</value></Data><Data name="النوع"><value>' + X(typeL) + '</value></Data><Data name="الحالة"><value>' + X(L.n) + '</value></Data><Data name="التحديات"><value>' + X(ex) + '</value></Data></ExtendedData>'
      + '<Point><coordinates>' + (+x.lng) + ',' + (+x.lat) + ',0</coordinates></Point></Placemark>';
    var z = tx.g || x.zone || '—';
    ((tree[z] = tree[z] || {})[typeL] = tree[z][typeL] || {}); (tree[z][typeL][L.n] = tree[z][typeL][L.n] || []).push(x.id);
    put('zone', z, x.id); put('type', typeL, x.id); put('life', L.n, x.id); put('exec', ex, x.id);
    gn.forEach(function(n){ put('ccg', n, x.id); }); put('work', x.work, x.id); put('co', x.co, x.id); put('route', x.route, x.id); put('floor', fln, x.id);
    if (tard) put('tard', tbar ? 'بعدد بوابات' : 'بلا عدد بوابات بعد', x.id);
  });
  var F = function(name, inner, vis, n){ return '<Folder><name>' + X(name) + (n != null ? ' (' + n + ')' : '') + '</name>' + (vis ? '' : '<visibility>0</visibility>') + inner + '</Folder>'; };
  var leaf = function(ids, vis){ return ids.map(function(id){ return vis ? P[id] : P[id].replace('<Placemark>', '<Placemark><visibility>0</visibility>'); }).join(''); };
  var count = function(o){ return Object.keys(o).reduce(function(n, k){ return n + (Array.isArray(o[k]) ? o[k].length : count(o[k])); }, 0); };
  var main = Object.keys(tree).sort().map(function(z){
    return F(z, Object.keys(tree[z]).sort().map(function(ty){
      return F(ty, Object.keys(tree[z][ty]).map(function(ln){ return F(ln, leaf(tree[z][ty][ln], true), true, tree[z][ty][ln].length); }).join(''), true, count(tree[z][ty]));
    }).join(''), true, count(tree[z]));
  }).join('');
  var rest = groups.filter(function(g){ return Object.keys(G[g[0]]).length; }).map(function(g){
    var o = G[g[0]];
    return F('\u{1F50E} ' + g[1], Object.keys(o).sort(function(a, b){ return o[b].length - o[a].length; }).map(function(v){ return F(v, leaf(o[v], false), false, o[v].length); }).join(''), false);
  }).join('');
  var when = typeof fmtDT === 'function' ? fmtDT(Date.now()) : new Date().toISOString();
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>' + X('أفاقي — قارئات نسك ١٤٤٨هـ · كل النقاط المخطط تركيبها · ' + when) + '</name>'
    + '<description><![CDATA[<div dir="rtl">الشجرةُ الأولى ظاهرة: المشعر ← النوع ← الحالة. وكلُّ فلترٍ من فلاتر التطبيق مجلّدٌ تحتها مطفأ — علّم عليه ليظهر وحده. ابحث باسم النقطة أو معرّفها.</div>]]></description>'
    + Object.keys(styles).map(function(k){ return styles[k]; }).join('')
    + F('\u{1F5FA} كل النقاط — المشعر ← النوع ← الحالة', main, true, pts.length) + rest + '</Document></kml>';
  return { xml:xml, count:pts.length };
}
/* a compressed ZIP (deflate) when the browser offers CompressionStream; the plain one otherwise */
function zipDeflate(name, bytes){
  if (typeof CompressionStream !== 'function') return Promise.resolve(zipStore(name, bytes));
  return new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer().then(function(buf){
    var c = new Uint8Array(buf), nb = new TextEncoder().encode(name), cr = crc32(bytes);
    var u32 = function(v){ return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }, u16 = function(v){ return [v & 255, (v >>> 8) & 255]; };
    var lf = [].concat([80, 75, 3, 4], u16(20), u16(0x0800), u16(8), u16(0), u16(0), u32(cr), u32(c.length), u32(bytes.length), u16(nb.length), u16(0));
    var cf = [].concat([80, 75, 1, 2], u16(20), u16(20), u16(0x0800), u16(8), u16(0), u16(0), u32(cr), u32(c.length), u32(bytes.length), u16(nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(0));
    var localLen = lf.length + nb.length + c.length, centralLen = cf.length + nb.length;
    var end = [].concat([80, 75, 5, 6], u16(0), u16(0), u16(1), u16(1), u32(centralLen), u32(localLen), u16(0));
    var out = new Uint8Array(localLen + centralLen + end.length), o = 0;
    out.set(lf, o); o += lf.length; out.set(nb, o); o += nb.length; out.set(c, o); o += c.length;
    out.set(cf, o); o += cf.length; out.set(nb, o); o += nb.length; out.set(end, o);
    return out;
  }).catch(function(){ return zipStore(name, bytes); });
}
function kmzFull(){
  toast(t('يُجهَّز ملفُّ جوجل إيرث…'));
  var b = kmzFullBuild();
  if (!b.count){ toast(t('لا نقاط')); return false; }
  zipDeflate('doc.kml', new TextEncoder().encode(b.xml)).then(function(zip){
    var d = new Date(), stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var ok = dl(new Blob([zip], { type:'application/vnd.google-earth.kmz' }), 'nusuk-planned-all-filters-' + stamp + '.kmz');
    toast(ok ? nm(b.count) + ' ' + t('نقطةً في الملف — بكل الفلاتر') : t('تعذّر التنزيل'));
    if (ok && typeof logEvent === 'function') logEvent('تصدير KMZ مفصّل — ' + b.count + ' نقطة', '');
  });
  return true;
}
