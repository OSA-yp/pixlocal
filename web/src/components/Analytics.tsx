import Script from "next/script";
import { analyticsConfig } from "@/lib/config";

export function Analytics() {
  const { yandexMetrikaId, ga4Id } = analyticsConfig;

  return (
    <>
      {yandexMetrikaId ? (
        <Script id="ym" strategy="afterInteractive">{`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(${JSON.stringify(yandexMetrikaId)}, "init", {
            clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true
          });
        `}</Script>
      ) : null}
      {ga4Id ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">{`
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
