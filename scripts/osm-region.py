# أسماءُ الإقليم للتكبير البعيد — مدنٌ وقرى ومطاراتٌ وجبال، وطرقٌ رئيسية بأرقامها وأسمائها، مبسَّطةُ الهندسة (ODbL)
import json, glob, math
def ar(t):
    n=t.get('name:ar') or ''
    if not n:
        nm=t.get('name','')
        n=nm if any('\u0600'<=c<='\u06ff' for c in nm) else nm
    return n
def simplify(pts, tol):
    # دوجلاس-بويكر على درجاتٍ (التسامحُ بالدرجات ~ ٥٠ م = ٠٫٠٠٠٤٥)
    if len(pts)<=2: return pts
    def d(p,a,b):
        ax,ay=a; bx,by=b; px,py=p; dx,dy=bx-ax,by-ay
        if dx==0 and dy==0: return math.hypot(px-ax,py-ay)
        t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))); return math.hypot(px-(ax+t*dx),py-(ay+t*dy))
    stack=[(0,len(pts)-1)]; keep=[False]*len(pts); keep[0]=keep[-1]=True
    while stack:
        i,j=stack.pop()
        if j<=i+1: continue
        mx,mi=-1,-1
        for k in range(i+1,j):
            dd=d(pts[k],pts[i],pts[j])
            if dd>mx: mx,mi=dd,k
        if mx>tol: keep[mi]=True; stack.append((i,mi)); stack.append((mi,j))
    return [p for p,k in zip(pts,keep) if k]
L=[]; P=[]; seen=set()
for f in sorted(glob.glob('/tmp/rg/*.json')):
    try: d=json.load(open(f))
    except Exception: continue
    for e in d.get('elements',[]):
        k=(e['type'],e['id'])
        if k in seen: continue
        seen.add(k); t=e.get('tags',{})
        if e['type']=='way' and t.get('highway') and e.get('geometry'):
            n=ar(t); ref=t.get('ref','').split(';')[0].strip()
            if not n and not ref: continue
            pts=simplify([[round(p['lat'],4),round(p['lon'],4)] for p in e['geometry']], 0.00045)
            if len(pts)>1: L.append([n, t.get('highway',''), pts, ref])
        elif e.get('center') or e['type']=='node':
            n=ar(t)
            if not n: continue
            c=e.get('center') or e; kind=t.get('place') or ('airport' if t.get('aeroway') else ('peak' if t.get('natural')=='peak' else ''))
            P.append([n, kind, round(c['lat'],4), round(c['lon'],4)])
if L or P:
    json.dump({'v':1,'src':'OpenStreetMap ODbL','lines':L,'points':P}, open('maps/region-names.json','w',encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
print('region: lines', len(L), 'points', len(P))
