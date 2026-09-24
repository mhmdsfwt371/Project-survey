# خريطةُ المشاعر بلا شبكة — وصفةُ البناء

> تُبنى مرةً كلَّ موسمٍ على جهازٍ له شبكة (هذا الجزءُ لا يُنفَّذ في السحابة ولا في بيئة المساعد لأن تنزيلَ بيانات OpenStreetMap محجوبٌ فيهما). الناتجُ ملفٌّ واحد `maps/mashaer.pmtiles` ≤ ٣٠ ميجابايت يُلتزَم مرةً ويُخدَم من Pages، ويُنزِّله الفنيُّ بموافقةٍ من الأدوات.

## الأدوات (مجانيةٌ مفتوحةُ المصدر)
- Java 21.
- **planetiler-basemaps** من مشروع Protomaps (يُنتج مخطّطَ Protomaps الأساسي الذي يرسمه `protomaps-leaflet`): `https://github.com/protomaps/basemaps` — الإصدار المثبَّت: **v4.x** (اكتب رقمَ الإصدار الذي بُني به هنا عند التنفيذ).
- `pmtiles` CLI (اختياري) للفحص: `pmtiles show mashaer.pmtiles`.

## النطاق
مربعٌ يشمل منى ومزدلفة وعرفات والجمرات ومسارَ قطار المشاعر مع هامش: **غربًا ٣٩٫٨٤ · جنوبًا ٢١٫٣٣ · شرقًا ٤٠٫٠٣ · شمالًا ٢١٫٤٨** (خطُّ الطول ثم العرض).

## الأمر
```bash
# ١ · مقتطعُ السعودية من Geofabrik (نحو ٣٠٠ ميجابايت) — يُنزَّل مرةً
curl -L -o saudi-arabia-latest.osm.pbf https://download.geofabrik.de/asia/gcc-states-latest.osm.pbf
# ٢ · البناء — الطبقاتُ الأساسيةُ حتى مستوى التكبير ١٥ داخل النطاق
java -Xmx4g -jar planetiler-basemaps.jar \
  --osm_path=gcc-states-latest.osm.pbf \
  --bounds=39.84,21.33,40.03,21.48 --maxzoom=15 \
  --output=mashaer.pmtiles
# ٣ · الفحص
ls -la mashaer.pmtiles          # ≤ 30 MB
pmtiles show mashaer.pmtiles    # الطبقاتُ والنطاق
```

## بعد البناء
1. انسخ الملفَّ إلى `maps/mashaer.pmtiles` واكتب حجمَه ورقمَ إصدار الأداة في `maps/manifest.json` (`{"file":"mashaer.pmtiles","bytes":…,"built":"YYYY-MM-DD","tool":"planetiler-basemaps vX.Y"}`).
2. الالتزامُ مرةً واحدة (الملفُّ ثنائيٌّ — لا يُعاد التزامُه مع كلِّ نسخة). سجّل أثرَ الحجم في السجل.
3. الجردُ `scripts/audit-basemap.mjs` يفحص الحجمَ وبوابةَ الموافقة والإسنادَ والعودةَ إلى الشبكة.

## في التطبيق
- **الأدوات ← «نزّل خريطة المشاعر — N ميجا»**: يُنزَّل بموافقةٍ صريحةٍ (ويُنصَح بواي فاي) ويُحفَظ في Cache Storage، ويُقرأ عبر رابط Blob فلا يحتاج عاملُ الخدمة إلى نطاقات بايت.
- العارضُ المضمَّن: `vendor/protomaps/` (pmtiles + protomaps-leaflet، BSD-3) — يُحمَّل عند الحاجة فقط.
- الإسناد: «© OpenStreetMap contributors» ظاهرٌ على الخريطة. القمرُ الصناعيُّ يبقى عبر الشبكة كما هو.
