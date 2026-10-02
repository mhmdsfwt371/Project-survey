# شبكةُ الشوارع للمشاعر: منى (maps/mina-osm.json) + مزدلفة وعرفات (/tmp/st/*.json) — عقدٌ وأضلاعٌ مضغوطة (ODbL)
import json, glob
ways=[]
try:
    d=json.load(open('maps/mina-osm.json'))
    for e in d.get('elements',[]):
        t=e.get('tags',{}); h=t.get('highway','')
        if e['type']=='way' and h and h not in ('motorway','motorway_link','construction','proposed','raceway') and e.get('geometry'): ways.append(e)
except Exception as ex: print('mina skip', ex)
seen=set(w['id'] for w in ways)
for f in sorted(glob.glob('/tmp/st/*.json')):
    try: d=json.load(open(f))
    except Exception: continue
    for e in d.get('elements',[]):
        if e['type']=='way' and e.get('geometry') and e['id'] not in seen: seen.add(e['id']); ways.append(e)
idx={}; N=[]; E=set()
def k(p):
    key=(round(p['lat'],6), round(p['lon'],6))
    if key not in idx: idx[key]=len(N); N.append([key[0], key[1]])
    return idx[key]
for w in ways:
    g=w['geometry']; prev=None
    for p in g:
        if p is None: prev=None; continue
        i=k(p)
        if prev is not None and prev!=i: E.add((min(prev,i), max(prev,i)))
        prev=i
json.dump({'v':2,'src':'OpenStreetMap ODbL — Mina + Muzdalifah + Arafat','n':N,'e':sorted(E)}, open('maps/mashaer-streets.json','w'), separators=(',',':'))
print('streets: ways', len(ways), 'nodes', len(N), 'edges', len(E))
