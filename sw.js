/* شركة النجيب المتطورة لمعدات المغاسل والفنادق — Service Worker (self-healing) */
const VERSION = "najeeb-v6";
const RUNTIME = `${VERSION}-runtime`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (e) => {
  // Do NOT precache navigations — avoids ever getting stuck on the offline page.
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Race the network against a timeout so a slow server never looks "offline". */
function networkWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(req).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  // Never intercept auth / admin / payment / health traffic.
  if (/\/api\/(customer|admin|cart|orders|payment-settings|security|upload|health|demo)/.test(url.pathname)) return;

  // ---- Navigations: always try the network first (10s), cache as backup ----
  if (req.mode === "navigate") {
    event.respondWith(
      networkWithTimeout(req, 10000)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          // Only fall back when the network genuinely failed.
          const cached = await caches.match(req);
          if (cached) return cached;
          const home = await caches.match("/");
          if (home) return home;
          const off = await caches.match(OFFLINE_URL);
          if (off) return off;
          return fetch(OFFLINE_URL).catch(
            () =>
              new Response(
                "<!doctype html><html lang=ar dir=rtl><meta charset=utf-8><body style='background:#060709;color:#c5a059;font-family:system-ui;text-align:center;padding:60px'><h2>تعذر الاتصال بالخادم</h2><p style='color:#fff'>اضغط تحديث للمحاولة مرة أخرى.</p><a href='/' style='color:#060709;background:#c5a059;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:bold'>إعادة المحاولة</a></body></html>",
                { headers: { "Content-Type": "text/html; charset=utf-8" } },
              ),
          );
        }),
    );
    return;
  }

  // ---- Static assets & uploaded media: cache-first ----
  if (/\.(css|js|woff2?|png|jpe?g|webp|svg|gif|mp4|webm)$/.test(url.pathname) || url.pathname.startsWith("/api/media/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              if (res && res.ok) {
                const copy = res.clone();
                caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
              }
              return res;
            })
            .catch(() => hit),
      ),
    );
    return;
  }

  // ---- Catalogue APIs: network-first, cached copy as fallback ----
  if (/\/api\/(products|categories|ads|news)/.test(url.pathname)) {
    event.respondWith(
      networkWithTimeout(req, 8000)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || Response.error())),
    );
  }
});

self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
  if (e.data === "clearCaches") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
