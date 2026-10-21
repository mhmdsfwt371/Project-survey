import { JSDOM, VirtualConsole } from 'jsdom'; import { appHtml } from './scripts/lib/src.mjs';
const errs=[]; const vc=new VirtualConsole().on('jsdomError', e=>errs.push(String(e.message||e).slice(0,200)));
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', url:'https://x.test/', pretendToBeVisual:true, virtualConsole:vc });
const w = dom.window, d = w.document; w.fetch = () => Promise.reject(new Error('net')); w.confirm = () => true; w.prompt = () => ''; await new Promise(r=>setTimeout(r,1800));
w.__t=[]; w.toast = m => w.__t.push(String(m));
const fs = await import('fs'); const sc = d.createElement('script'); sc.textContent = fs.readFileSync('app-office.js','utf8'); d.body.appendChild(sc); await new Promise(r=>setTimeout(r,400));
console.log('ROLES', w.eval('JSON.stringify(Object.keys(ROLES))'));
const out = w.eval(`(function(){
  FB.ready = true; FB.db = { collection:function(){ var c = { doc:function(){ return { get:function(){ return Promise.resolve({ exists:false }); }, set:function(){ return Promise.resolve(); } }; }, where:function(){ return c; }, orderBy:function(){ return c; }, limit:function(){ return c; }, get:function(){ return Promise.resolve({ size:0, forEach:function(){}, docs:[] }); }, onSnapshot:function(){ return function(){}; } }; return c; } };
  var bad = /\\bundefined\\b|\\bNaN\\b|\\[object Object\\]|\\bInfinity\\b|\\bnull\\b/;
  var found = [], thrown = [], pages = 0;
  Object.keys(ROLES).forEach(function(role){
    ROLE = role; STATE.meta.role = role; STATE.meta.name = 'جولة ' + role;
    Object.keys(PAGE).forEach(function(pid){
      if (!seesPage(pid)) return;
      var tabs = (TABS[pid] || []).filter(function(tb){ var f = tb[4] && TAB_SEE[tb[4]]; return f ? f(pid) : seesRaw(tb[0]); }).map(function(tb){ return tb[0]; });
      (tabs.length ? tabs : ['']).forEach(function(tb){
        pages++;
        try { CUR = pid; if (tb) PTAB[pid] = tb; render(1); var el = document.getElementById('content'); var tx = el ? el.textContent : '';
          var m = bad.exec(tx); if (m) found.push(role + ' ' + pid + (tb ? ':' + tb : '') + ' → «' + tx.slice(Math.max(0, m.index - 40), m.index + 20).replace(/\\s+/g, ' ') + '»');
        } catch (e){ thrown.push(role + ' ' + pid + (tb ? ':' + tb : '') + ' → ' + e.message); }
      });
    });
  });
  return JSON.stringify({ pages:pages, found:found.slice(0, 25), nFound:found.length, thrown:thrown.slice(0, 15), nThrown:thrown.length });
})()`);
console.log(out); process.exit(0);
