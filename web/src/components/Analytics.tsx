import Script from "next/script";
import { analyticsConfig } from "@/lib/config";

/** Счётчики. Цели: file_select, download, zip_download — web/src/lib/track.ts */
export function Analytics() {
  const { yandexMetrikaId, ga4Id } = analyticsConfig;
  const ymSrc = yandexMetrikaId
    ? `https://mc.yandex.ru/metrika/tag.js?id=${encodeURIComponent(yandexMetrikaId)}`
    : "";

  return (
    <>
      {yandexMetrikaId ? (
        <>
          <Script id="ym" strategy="lazyOnload">{`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", ${JSON.stringify(ymSrc)}, "ym");
            ym(${JSON.stringify(yandexMetrikaId)}, "init", {
              ssr:true,
              webvisor:true,
              clickmap:true,
              referrer: document.referrer,
              url: location.href,
              accurateTrackBounce:true,
              trackLinks:true
            });
          `}</Script>
          <noscript>
            <div>
              {/* Пиксель Метрики для пользователей без JS */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
      ) : null}
      {ga4Id ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="lazyOnload"
          />
          <Script id="ga4" strategy="lazyOnload">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(ga4Id)});
          `}</Script>
        </>
      ) : null}
    </>
  );
}
