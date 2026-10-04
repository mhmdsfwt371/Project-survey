# صورُ القمر الصناعي لمواقع التفويج الثلاثة — لعدّ المسارات والبوابات (مسودة يؤكدها المالك). المصدر: صور العالم من إسري (عامة).
import math, json, os, io, urllib.request
from PIL import Image, ImageDraw
os.makedirs('sat', exist_ok=True)
def tile_xy(lat, lng, z):
    n = 2 ** z; x = (lng + 180) / 360 * n; y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y
def fetch(z, x, y):
    url = f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 nusuk-survey-study'})
    with urllib.request.urlopen(req, timeout=30) as r: return Image.open(io.BytesIO(r.read())).convert('RGB')
def grab(key, lat, lng, z, nt):
    fx, fy = tile_xy(lat, lng, z); x0 = int(fx) - nt // 2; y0 = int(fy) - nt // 2
    im = Image.new('RGB', (256 * nt, 256 * nt))
    for i in range(nt):
        for j in range(nt):
            try: im.paste(fetch(z, x0 + i, y0 + j), (256 * i, 256 * j))
            except Exception as e: pass
    d = ImageDraw.Draw(im)
    # علامةُ المركز، وشبكةٌ كلَّ ١٠٠ متر بأرقام بكسلية لتحويل المواضع إلى إحداثيات
    cx, cy = (fx - x0) * 256, (fy - y0) * 256
    d.line([(cx - 12, cy), (cx + 12, cy)], fill=(255, 0, 0), width=3); d.line([(cx, cy - 12), (cx, cy + 12)], fill=(255, 0, 0), width=3)
    mpp = 156543.03392 * math.cos(math.radians(lat)) / (2 ** z)
    step = 100 / mpp
    k = 0; v = 0.0
    while v < im.width:
        d.line([(v, 0), (v, im.height)], fill=(255, 255, 0), width=1); d.text((v + 2, 2), str(k), fill=(255, 255, 0)); v += step; k += 1
    k = 0; v = 0.0
    while v < im.height:
        d.line([(0, v), (im.width, v)], fill=(255, 255, 0), width=1); d.text((2, v + 2), str(k), fill=(255, 255, 0)); v += step; k += 1
    im.save(f'sat/{key}.jpg', quality=82)
    return { 'key': key, 'z': z, 'x0': x0, 'y0': y0, 'nt': nt, 'mpp': mpp, 'center': [lat, lng], 'cpx': [round(cx, 1), round(cy, 1)], 'grid_m': 100 }
meta = []
meta.append(grab('zaidi_overview_z16', 21.4033, 39.7303, 16, 6))
meta.append(grab('zaidi_A_z18', 21.412247, 39.744221, 18, 6))
meta.append(grab('zaidi_B_z18', 21.394362, 39.716499, 18, 6))
meta.append(grab('hijraM_z17', 21.678187, 39.565172, 17, 5))
meta.append(grab('hijraM_z18', 21.678187, 39.565172, 18, 6))
meta.append(grab('hijraD_z17', 24.340387, 39.554609, 17, 5))
meta.append(grab('hijraD_z18', 24.340387, 39.554609, 18, 6))
json.dump(meta, open('sat/meta.json', 'w'))
print([ (m['key'], round(m['mpp'], 2)) for m in meta ])
