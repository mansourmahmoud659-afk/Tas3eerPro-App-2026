/**
 * تسجيل Service Worker لعمل التطبيق أوفلاين.
 * لا يتم التسجيل داخل معاينة Lovable أو أثناء التطوير — فقط في النسخة المنشورة/المُصدَّرة.
 */

const PREVIEW_HOSTS = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
] as const;

function isPreviewHost(hostname: string) {
  return PREVIEW_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

function shouldRefuse(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const { hostname, search } = window.location;
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (isPreviewHost(hostname)) return true;
  if (new URLSearchParams(search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").includes("/sw.js"))
      .map((r) => r.unregister()),
  );
}

export function setupOfflineSupport() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  if (shouldRefuse()) {
    void unregisterAppWorkers();
    return;
  }

  void import("virtual:pwa-register")
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {
      /* التطبيق يعمل طبيعياً حتى لو فشل التسجيل */
    });
}
