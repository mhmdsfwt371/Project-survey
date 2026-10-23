/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-02-map-incremental.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-02-map-incremental.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : mapLocate
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function mapLocate(){
  if (!navigator.geolocation){ toast(t('تعذّر تحديد الموقع')); return; }
  toast(t('يُلتقَط موضعك…'));
  navigator.geolocation.getCurrentPosition(
    function(p){
      MYPOS = { lat:p.coords.latitude, lng:p.coords.longitude, at:Date.now() };
      if (MAP) MAP.setView([MYPOS.lat, MYPOS.lng], 17);
      if (MAP_3D && M3){ try { M3.flyTo({ center:[MYPOS.lng, MYPOS.lat], zoom:16, duration:900 }); } catch (e){ LS_ERR = e; } }
      /* ═══ علامةُ موضعك على لوح النقاط نفسِه — لا على لوحٍ فوقه ═══
         كانت تُضاف إلى الخريطة بلا لوحٍ معيَّن، فيُنشئ Leaflet لها لوحًا
         ثانيًا (canvas) يغطّي الخريطةَ كلَّها فوق لوح النقاط. واللوحُ الأعلى
         يلتقط كلَّ نقرةٍ ولا يمرّرها لما تحته — فمن ضغط «موقعي» مرةً واحدةً
         لم تُفتَح له نافذةُ أيِّ نقطةٍ بعدها حتى يُعيد تحميلَ التطبيق: يضغط
         المخيمَ فلا يقع شيء، ويظنُّ العطلَ في المخيمات. فصارت العلامةُ على
         اللوح نفسِه (MAP_CV) وغيرَ قابلةٍ للنقر — تُرى ولا تحجب. */
      try{
        if (MAP_ME) MAP.removeLayer(MAP_ME);
        MAP_ME = L.circleMarker([MYPOS.lat, MYPOS.lng], {
          renderer:MAP_CV, interactive:false,
          radius:8, color:'#fff', weight:3, fillColor:'#4FA3FF', fillOpacity:1
        }).addTo(MAP_TMP ? MAP_TMP : MAP);
        /* لوحُ النقاط يُمسَح في كلِّ رسمٍ — فتُعاد العلامةُ بعده */
        MAP_ME_LL = [MYPOS.lat, MYPOS.lng];
      }catch(e){}
      toast(t('موضعُك'));
      render(1);
    },
    function(){ toast(t('تعذّر تحديد الموقع')); },
    { enableHighAccuracy:true, timeout:10000 });
}
