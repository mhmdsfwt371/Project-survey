/* يُحمَّل قبل كلِّ جرد (NODE_OPTIONS=--require): يحقن ملفَ القاموس في نافذة JSDOM كي تعمل
   الترجمةُ في بيئة الفحص كما تعمل في المتصفح — بعد فصل القواميس (V21.6) */
const Module = require('module'), fs = require('fs'), path = require('path');
function dictSrc(){ try { const dir = path.join(process.cwd(), 'i18n'); const f = fs.readdirSync(dir).filter(x => /^dict-[0-9a-f]{10}\.js$/.test(x))[0]; return f ? fs.readFileSync(path.join(dir, f), 'utf8') : ''; } catch { return ''; } }
const origLoad = Module._load;
Module._load = function(request){
  const m = origLoad.apply(this, arguments);
  if (request === 'jsdom' && m && m.JSDOM && !m.JSDOM.__dictPatched){
    const O = m.JSDOM, src = dictSrc();
    class JSDOMWithDict extends O {
      constructor(html, opts){ opts = Object.assign({}, opts || {}); const bp = opts.beforeParse; opts.beforeParse = function(win){ win.__NSK_DICT_SRC = src; if (bp) bp(win); }; super(html, opts); }
    }
    JSDOMWithDict.__dictPatched = true; m.JSDOM = JSDOMWithDict;
  }
  return m;
};
