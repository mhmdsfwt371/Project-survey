# vendor/ — third-party code shipped with the app

The app loads its libraries from here first and falls back to the public CDN only if the local copy cannot load
(`libLoad(local, cdn)` in `src/01-core/01-core-registry-05-sync-scale.js`). The service worker keeps these files in the
persistent cache `nusuk-lib` (kept across app updates), so the app signs in and exports Excel/PDF with no network.
`scripts/audit-vendor.mjs` guards all of this in the gate.

| Library | Version | Files | Source | Licence |
|---|---|---|---|---|
| Firebase JS SDK (compat) | 9.23.0 | `firebase/9.23.0/firebase-{app,auth,firestore}-compat.js` | npm `firebase@9.23.0` (same as gstatic) | Apache-2.0 |
| SheetJS Community Edition | 0.20.3 | `xlsx/0.20.3/xlsx.full.min.js` (+ `SHA256`) | `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/` (official; not on npm) | Apache-2.0 |
| ExcelJS | 4.4.0 | `exceljs/4.4.0/exceljs.min.js` | npm `exceljs@4.4.0` (same as cdnjs) | MIT |
| JSZip | 3.10.1 | `jszip/3.10.1/jszip.min.js` | npm `jszip@3.10.1` (same as cdnjs) | MIT or GPLv3 (dual) |
| Readex Pro | Fontsource 5.3.0 | `fonts/readex-pro/*.woff2` (Arabic + Latin, 400/600/700) | npm `@fontsource/readex-pro` | SIL OFL 1.1 |
| three.js | 0.149.0 | `three/0.149.0/three.min.js` (+ `SHA256`, `LICENSE`) — the last release with a browser build; loaded only by the 3D map's twin engine, cached on first use | npm `three@0.149.0` | MIT |
| Leaflet, MapLibre, Protomaps | — | `leaflet/`, `maplibre/`, `protomaps/` | earlier releases | see each folder |

## Updating a library

1. Put the new version in a **new versioned folder** (never overwrite a path: the service worker caches by path).
2. Change the path in the loader (`libLoad('vendor/<lib>/<new>/…')`) and in `sw.js` (`LIB_BOOT` / `LIB_ALL`).
3. `node scripts/audit-vendor.mjs` must pass; the old version is pruned from `nusuk-lib` on the next activation.
4. SheetJS is not published on npm: fetch it from its official CDN (in CI if your network blocks it) and record
   `sha256sum` in `SHA256` next to the file — the audit compares them.
