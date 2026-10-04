/* فكُّ رابطي خرائط جوجل المختصرين (موقعا التفويج على طريق الهجرة) إلى إحداثيات — قراءةٌ فقط */
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('/tmp/exp', { recursive: true });
const L = ['https://maps.app.goo.gl/cT3Xjx2FHjphJp4h6', 'https://maps.app.goo.gl/kTkN6cBvwfkYxQmB9'];
const out = [];
for (const u of L){
  const hops = []; let cur = u;
  for (let i = 0; i < 6; i++){
    try { const r = await fetch(cur, { redirect:'manual', headers:{ 'User-Agent':'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36', 'Accept-Language':'ar,en' } });
      const loc = r.headers.get('location'); hops.push({ st:r.status, loc:loc ? loc.slice(0, 600) : '' });
      if (!loc) { const body = await r.text(); const m = body.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || body.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) || body.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/); hops.push({ bodyCoords: m ? [m[1], m[2]] : null, title:(body.match(/<title>([^<]*)<\/title>/) || [])[1] || '', meta:(body.match(/<meta content="([^"]{0,300})" property="og:title"/) || body.match(/property="og:title" content="([^"]{0,300})"/) || [])[1] || '' }); break; }
      cur = new URL(loc, cur).toString();
    } catch (e){ hops.push({ err:String(e).slice(0, 120) }); break; }
  }
  const all = JSON.stringify(hops);
  const m = all.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || all.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || all.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || all.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const m2 = all.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const place = (all.match(/\/place\/([^\/@?"]+)/) || [])[1] || '';
  out.push({ url:u, coords: m ? [+m[1], +m[2]] : null, pin: m2 ? [+m2[1], +m2[2]] : null, place: place ? decodeURIComponent(place.replace(/\+/g, ' ')) : '', hops });
}
writeFileSync('/tmp/exp/links.json', JSON.stringify(out));
console.log(JSON.stringify(out.map(o => [o.coords, o.pin, o.place])));
