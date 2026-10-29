/* Nusuk Survey — offline shell cache */
const CACHE = 'nusuk-survey-v42.3';
const SHELL = [
  './',
  './index.html',
  './app-office.js?v=42.3',   /* (V38.39) المجالاتُ المؤجَّلة — تُثبَّت مع الهيكل فتعمل بلا شبكة؛ الرقمُ يُحدَّث مع كلِّ نسخة */
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  /* الخريطةُ تعمل حيث يعمل التطبيق — لا اعتمادَ على شبكةٍ عامة */
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-shadow.png'
];
/* محرّكُ العرض الثلاثيّ لا يُخزَّن مع الهيكل: ثمانمئةُ كيلوبايتٍ لا يحتاجها
   الفنيُّ في المشاعر، ومن فتح الصفحةَ مرةً خُزِّن له عند أوّل طلب. */
/* (V38.54) vendored libraries — a persistent cache by file version, kept across app updates (like nusuk-basemap):
   the app updates many times a day and must not re-download ~750 KB of libraries each time. Firebase is boot-critical
   for every role, so it is fetched at install; the export libraries and the PDF font are warmed by the page for
   supervisors and up when online and idle, and cached on first use for everyone else. Change a version → new path. */
const LIB_CACHE = 'nusuk-lib';
const LIB_BOOT = [
  './vendor/firebase/9.23.0/firebase-app-compat.js',
  './vendor/firebase/9.23.0/firebase-auth-compat.js',
  './vendor/firebase/9.23.0/firebase-firestore-compat.js'
];
const LIB_ALL = LIB_BOOT.concat([
  './vendor/xlsx/0.20.3/xlsx.full.min.js',
  './vendor/exceljs/4.4.0/exceljs.min.js',
  './vendor/jszip/3.10.1/jszip.min.js',
  './vendor/fonts/readex-pro/readex-pro-arabic-400-normal.woff2',
  './vendor/fonts/readex-pro/readex-pro-arabic-600-normal.woff2',
  './vendor/fonts/readex-pro/readex-pro-arabic-700-normal.woff2',
  './vendor/fonts/readex-pro/readex-pro-latin-400-normal.woff2',
  './vendor/fonts/readex-pro/readex-pro-latin-600-normal.woff2',
  './vendor/fonts/readex-pro/readex-pro-latin-700-normal.woff2'
]);
const LIB_PATHS = ['/vendor/firebase/', '/vendor/xlsx/', '/vendor/exceljs/', '/vendor/jszip/', '/vendor/fonts/'];
function libMissing(c, list){ return Promise.all(list.map(function (u) { return c.match(u).then(function (h) { return h ? null : u; }); })).then(function (L) { return L.filter(Boolean); }); }

const LAZY = ['/vendor/maplibre/', '/vendor/three/', '/vendor/protomaps/', '/templates/', '/i18n/', '/layers/'];   /* والقاموسُ باسمه المبصوم (V21.6) */   /* وعارضُ خريطة المشاعر بلا شبكة (V18.0) */

self.addEventListener('install', function (e) {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE).then(function (c) {
        return Promise.all(SHELL.map(function (u) {
          return c.add(new Request(u, { cache: 'reload', credentials: 'same-origin' }))
                  .catch(function () { /* skip */ });
        }));
      }),
      /* (V38.54) boot libraries once per device — skipped when already in the persistent cache */
      caches.open(LIB_CACHE).then(function (c) {
        return libMissing(c, LIB_BOOT).then(function (miss) { return Promise.all(miss.map(function (u) { return c.add(u).catch(function () {}); })); });
      })
    ]).then(function () { return self.skipWaiting(); })
  );
});

/* (V24.9) مخزنُ خريطة الجهاز (nusuk-basemap) يبقى عبر التحديثات: كان التفعيلُ يمسح كلَّ مخزنٍ
   غيرَ الهيكل فتختفي الخريطةُ بلا شبكة مع كلِّ نسخةٍ ويُعاد تنزيلُها — وقد يمسحها في أوّل تثبيتٍ
   بعد تنزيلها بلحظة فلا تظهر في الجلسة كلِّها */
const KEEP = ['nusuk-basemap', LIB_CACHE];   /* (V38.54) and the vendored libraries */

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE && KEEP.indexOf(k) === -1; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () {
      /* (V38.54) the library cache keeps only the versions this release names (a version bump changes the path) */
      return caches.open(LIB_CACHE).then(function (c) { return c.keys().then(function (ks) {
        const want = LIB_ALL.map(function (u) { return new URL(u, self.registration.scope).pathname; });
        return Promise.all(ks.filter(function (r) { return want.indexOf(new URL(r.url).pathname) === -1; }).map(function (r) { return c.delete(r); }));
      }); }).catch(function () {});
    }).then(function () { return self.clients.claim(); })
  );
});

function fetchWithTimeout(req, ms) {
  return new Promise(function (resolve, reject) {
    const t = setTimeout(function () { reject(new Error('timeout')); }, ms);
    fetch(req).then(function (res) { clearTimeout(t); resolve(res); },
                    function (err) { clearTimeout(t); reject(err); });
  });
}

/* (V38.54) the page asks for the export libraries to be kept for offline (supervisors and up, online and idle) */
self.addEventListener('message', function (e) {
  if (!e.data || e.data.type !== 'nsk-warm-libs') return;
  e.waitUntil(caches.open(LIB_CACHE).then(function (c) {
    return libMissing(c, LIB_ALL).then(function (miss) { return Promise.all(miss.map(function (u) { return c.add(u).catch(function () {}); })).then(function () { return miss.length; }); });
  }).then(function (n) { if (e.source && e.source.postMessage) e.source.postMessage({ type:'nsk-libs-warm', fetched:n }); }));
});

/* (V39.8) a tap on a chat notice: the open app comes forward and opens the conversation; a closed one opens */
self.addEventListener('notificationclick', function (e) {
  var key = (e.notification && e.notification.data && e.notification.data.key) || '';
  if (e.notification) e.notification.close();
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function (L) {
    for (var i = 0; i < L.length; i++){ if ('focus' in L[i]){ L[i].postMessage({ type:'nsk-chat-open', key:key }); return L[i].focus(); } }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Firebase / Google APIs: network only, never cached (auth + live channels)
  if (req.url.indexOf('googleapis.com') !== -1 || req.url.indexOf('firebaseapp.com') !== -1 || req.url.indexOf('firebaseio.com') !== -1) {
    e.respondWith(fetch(req).catch(function () { return new Response('', { status: 504 }); }));
    return;
  }

  /* (V38.54) vendored libraries: from the persistent cache first, else the network into it */
  if (LIB_PATHS.some(function (p) { return req.url.indexOf(p) !== -1; })) {
    e.respondWith(caches.open(LIB_CACHE).then(function (c) {
      return c.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; })
          .catch(function () { return new Response('', { status: 504 }); });
      });
    }));
    return;
  }

  /* محرّكُ العرض الثلاثيّ: يُخزَّن عند أوّل طلبٍ ثم يُخدَم من التخزين — يفتح
     المكتبُ الصفحةَ مرةً فتعمل بعدها بلا شبكة، ولا يُثقَل تثبيتُ التطبيق به. */
  if (LAZY.some(function (p2) { return req.url.indexOf(p2) !== -1; })) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.ok) { const c2 = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, c2); }); }
        return res;
      }).catch(function () { return new Response('', { status: 504 }); });
    }));
    return;
  }

  // map tiles: network only, never cached — ومعها بلاطاتُ الثلاثيِّ (النمطُ
  // والتضاريس): للمكتب لا للميدان، ولا تُخزَّن فلا يمتلئ تخزينُ الجهاز بها
  if (req.url.indexOf('basemaps.cartocdn.com') !== -1 || req.url.indexOf('tiles.openfreemap.org') !== -1
      || req.url.indexOf('elevation-tiles-prod') !== -1) {
    e.respondWith(fetch(req).catch(function () { return new Response('', { status: 504 }); }));
    return;
  }

  /* ═══ الهيكلُ من الكاش أوّلًا (V17.95) ═══
     كان كلُّ فتحٍ وهو متّصلٌ يُنزِّل الصفحةَ كلَّها من الشبكة (نحو ٨٧٥ كيلوبايت
     مضغوطة) وينتظرها؛ ومهلةُ الثواني الثلاث والنصف تحمي أوّلَ الاستجابة لا
     التنزيلَ كلَّه، فعلى شبكةٍ رديئةٍ ينتظر الفنيُّ التنزيلَ حتى يكتمل. صار الهيكلُ
     يُخدَم من كاش النسخة الحالية فورًا، والجديدُ يصل بدورة العامل نفسِها: sw.js
     شبكةٌ فقط، ورقمُ الكاش يتبدّل، فيُثبَّت الجديدُ ويُنشَّط ويُعاد التحميل
     (مسارُ التحديث في التطبيق وزرُّ النسخة كما هما). وأوّلُ تثبيتٍ يجلب من الشبكة. */
  const isNav = req.mode === 'navigate' || req.url.indexOf('index.html') !== -1;
  const isShellPage = isNav || req.url.indexOf('manifest.webmanifest') !== -1;   /* اسم التطبيق وأيقونته */
  if (isShellPage) {
    e.respondWith(
      caches.match(req).then(function (hit) { return hit || (isNav ? caches.match('./index.html') : null); }).then(function (hit) {
        if (hit) return hit;
        return fetchWithTimeout(new Request(req.url, { cache: 'reload', credentials: 'same-origin' }), 15000).then(function (res) {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () { return new Response('', { status: 504 }); });
      })
    );
    return;
  }

  // ملفات docs: شبكة أولًا — الأدلة تتغيّر مع كل نسخة، والكاش يقدّم قديمًا
  if (req.url.indexOf('/docs/') !== -1) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'reload' }))
        .then(function (res) {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () { return caches.match(req).then(function (h) { return h || new Response('', { status: 504 }); }); })
    );
    return;
  }

  // sw.js نفسه: شبكة فقط، أبدًا من الكاش — فحص النسخة يعتمد عليه،
  // وتقديمه من الكاش يعني أن التطبيق لا يرى نسخة جديدة أبدًا.
  if (req.url.indexOf('sw.js') !== -1) {
    e.respondWith(fetch(new Request(req.url, { cache: 'reload' }))
      .catch(function () { return new Response('', { status: 504 }); }));
    return;
  }

  /* (V25.2) ملفُّ خريطة الجهاز وبيانُه من الشبكة وحدَها: التطبيقُ يحفظ الملفَّ بنفسه في nusuk-basemap،
     وكان «الكاشُ أوّلًا» هنا يعيد إلى التنزيل نسختَه القديمةَ (caches.match يبحث في كلِّ المخازن) فلا
     يصل الملفُّ الجديدُ أبدًا، ويكرّر الملفَّ كلَّه في مخزن الهيكل، ويُبقي البيانَ قديمًا حتى النسخة التالية */
  if (req.url.indexOf('/maps/') !== -1) {
    e.respondWith(fetch(new Request(req.url, { cache: 'reload' })).catch(function () { return new Response('', { status: 504 }); }));
    return;
  }

  // everything else (libs, icons): cache first, then network
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return new Response('', { status: 504 }); });
    })
  );
});
