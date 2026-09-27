import { readFileSync, readdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dictSrc = readFileSync('i18n/' + readdirSync('i18n').find(f => f.startsWith('dict-')), 'utf8');
for (const lang of ['en', 'ur']){
  const vc = new VirtualConsole(); const errs = []; vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|Not implemented/.test(m)) errs.push(m.slice(0, 200)); });
  const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc,
    beforeParse(win){
      win.localStorage.setItem('nsk14.lang', lang); win.localStorage.setItem('nsk14.tour.x', '1');
      const orig = win.Node.prototype.appendChild;
      win.__loads = 0;
      win.Node.prototype.appendChild = function(el){
        if (el && el.tagName === 'SCRIPT' && /i18n\/dict-/.test(el.src || '')){ win.__loads++; setTimeout(() => { try { win.eval(dictSrc); } catch (e){ errs.push('dict eval ' + e.message); } if (el.onload) el.onload(); }, 400); return el; }
        return orig.call(this, el);
      };
    } });
  const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
  w.HTMLCanvasElement.prototype.getContext = () => null; w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  await wait(300);
  let renders = 0; const R0 = w.render; w.render = function(){ renders++; return R0.apply(this, arguments); };
  console.log(lang, 'LANG at boot:', w.LANG, '| I18N_STATE:', w.I18N_STATE, '| loads:', w.__loads, '| login title:', (d.getElementById('lgGo') || {}).textContent);
  await wait(800);
  console.log(lang, 'after dict: I18N_STATE', w.I18N_STATE, 'loads', w.__loads, 'renders(pre-login)', renders, '| login btn:', (d.getElementById('lgGo') || {}).textContent, '| app display:', d.getElementById('app').style.display);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'Eng' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  const m0 = process.memoryUsage().heapUsed; renders = 0;
  await wait(4000);
  console.log(lang, 'after login 4s: renders', renders, '| heap +MB', Math.round((process.memoryUsage().heapUsed - m0) / 1048576), '| nav en?', /Map|Tasks|Survey|نقشہ/.test(d.getElementById('nav').textContent), '| errs', errs.slice(0, 3));
  try { dom.window.close(); } catch {}
}
process.exit(0);
