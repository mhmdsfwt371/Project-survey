/* (V38.90) moved by scripts/split-late.mjs from src/05-map/05-lifecycle-map-05-geojson-basemap-layers.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
/* ═══ التصديرُ القياسي GeoJSON (V18.0) ═══
   ملفٌّ يفتحه أيُّ نظامٍ جغرافي: FeatureCollection وفق RFC 7946 (WGS84،
   الترتيبُ خطُّ الطول ثم خطُّ العرض)، ولكلِّ نقطةٍ حالتُها من دورة الحياة نفسِها
   (lifeOf) وتواريخُها المفصلية. بحسب الدور: ما تصدّره الوزارةُ بلا جوالاتٍ ولا
   أسماءِ أشخاصٍ ولا ملاحظاتٍ داخلية. المخطّطُ في docs/schema/. */
function geoJsonBuild(){
  var viewer = effRole(ROLE) === 'viewer', full = !viewer;
  var feats = [];
  (STATE.sites || []).forEach(function(x){
    if (!(+x.lat) || !(+x.lng)) return;
    var r = STATE.recs[x.id], ins = STATE.inss[x.id], dis = STATE.diss && STATE.diss[x.id], hd = (typeof handOf === 'function') ? handOf(x.id) : null;
    var life = lifeOf(x);
    var p = { id:x.id, name:x.name || '', zone:x.zone || '', type:x.type || '', camera_kind:camKind(x) || null, block:x.sq || '', sign:x.sign || '', company:x.co || '',
              status:life, status_label:(LIFE[life] || LIFE.todo).n,
              surveyed_at: svVisited(r) ? new Date(+r.at).toISOString() : null,   /* (V32.6) */
              installed_at: ins && ins.status === 'مُركّب' ? new Date(+ins.at).toISOString() : null,
              handed_at: hd && hd.at ? new Date(+hd.at).toISOString() : null,
              dismantled_at: dis && dis.status === 'تم الفك' ? new Date(+dis.at).toISOString() : null };
    if (full){
      p.surveyed_by = r ? (r.by || '') : '';
      p.challenges = r ? chalKeys(r.chals) : [];
      p.note = r ? String(r.note || '') : '';
    }
    feats.push({ type:'Feature', id:x.id, geometry:{ type:'Point', coordinates:[+x.lng, +x.lat] }, properties:p });
  });
  return { type:'FeatureCollection', name:'afaqy-readers-1448', generated_at:new Date().toISOString(), version:appVer(), features:feats };
}

function geoJsonExport(){
  var g = geoJsonBuild();
  var ok = dl(new Blob([JSON.stringify(g)], { type:'application/geo+json' }), 'afaqy-readers-' + dayKey() + '.geojson');
  toast(ok ? (nm(g.features.length) + ' ' + t('نقطةً في الملف')) : t('تعذّر التنزيل'));
  return ok;
}

function poiLoad(){
  if (POIL.data || POIL.busy || typeof fetch !== 'function') return;
  POIL.busy = true;
  fetch('layers/poi.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ POIL.busy = false; if (!d) return; POIL.data = d; poiPaint(); }).catch(function(e){ POIL.busy = false; LS_ERR = e; });
}

/* ═══ تعديلُ حدود المخيم بسحب الزوايا (V25.9) — قرارُ المالك ═══
   كان تعديلُ الحدود إعادةَ رسمٍ كاملة بأداة «مساحة بنقاط». صار من نافذة المخيم «عدّل الحدود»: زوايا الحدود
   الحالية مقابضُ تُسحَب، ونقطةٌ صغيرةٌ بين كلِّ زاويتين تُضيف زاويةً عندها، والزاويةُ المحدَّدةُ تُحذَف (ثلاثٌ حدًّا
   أدنى)، و«رجوع للحدود الأصلية» يُعيد حدودَ السجل. الحفظُ بصيغة الرسم القائمة نفسِها (poly مسطّحًا في وثيقة
   الموقع أو المضاف) فتصل الأجهزةَ ويقرؤها المحرّكان والثلاثي، ويُسجَّل في الأحداث. للمهندس فما فوق كتعديل البيانات. */
function iotLoad(){
  if (IOT.data || IOT.busy || typeof fetch !== 'function') return;
  IOT.busy = true;
  fetch('layers/mina-sensors.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ IOT.busy = false; if (!d) return; IOT.data = d; iotPaint(); }).catch(function(e){ IOT.busy = false; LS_ERR = e; });
}
