# أسماءُ الشوارع والأماكن للمشاعر — من جواب Overpass إلى ملفٍ صغيرٍ تقرؤه طبقةُ الأسماء فوق القمر الصناعي (ODbL)
import json
d=json.load(open('/tmp/names-raw.json')); L=[]; P=[]
def ar(t):
    n=t.get('name:ar') or ''
    if not n:
        nm=t.get('name','')
        n=nm if any('\u0600'<=c<='\u06ff' for c in nm) else (t.get('name:en') and nm) or nm
    return n
for e in d['elements']:
    t=e.get('tags',{}); n=ar(t)
    if not n: continue
    if e['type']=='way' and t.get('highway') and e.get('geometry'):
        pts=[[round(p['lat'],5),round(p['lon'],5)] for p in e['geometry']]
        if len(pts)>1: L.append([n, t.get('highway',''), pts])
    elif e.get('center') or e['type']=='node':
        c=e.get('center') or e; kind=t.get('place') or ('peak' if t.get('natural')=='peak' else (t.get('amenity') or t.get('railway') or ''))
        P.append([n, kind, round(c['lat'],5), round(c['lon'],5)])
json.dump({'v':1,'src':'OpenStreetMap ODbL','bbox':[21.30,39.78,21.50,40.02],'lines':L,'points':P}, open('maps/mashaer-names.json','w',encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
print('names: lines', len(L), 'points', len(P))
