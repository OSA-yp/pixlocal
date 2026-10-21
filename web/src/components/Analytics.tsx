import { analyticsConfig } from "@/lib/config";

/**
 * GA4 в статическом HTML (не next/script + lazyOnload):
 * иначе при `output: "export"` код остаётся только в RSC-payload.
 * Один билд на .app и .ru — ID выбирается по hostname в браузере.
 * События: file_select, download, zip_download — web/src/lib/track.ts
 */
export function Analytics() {
  const { ga4Id, ga4IdRu } = analyticsConfig;

  if (!ga4Id && !ga4IdRu) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  var appId = ${JSON.stringify(ga4Id)};
  var ruId = ${JSON.stringify(ga4IdRu)};
  var host = (location.hostname || "").toLowerCase();
  var isRu = host === "pixlocal.ru" || host === "www.pixlocal.ru";
  var id = isRu ? (ruId || appId) : (appId || ruId);
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id);
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(s);
})();
`.trim(),
      }}
    />
  );
}
