"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

export default function SeoAnalyticsScripts({ gaId, gaEnabled, customScripts }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (gaEnabled && gaId && typeof window.gtag === 'function') {
      window.gtag('config', gaId, {
        page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''),
      });
    }
  }, [pathname, searchParams, gaId, gaEnabled]);

  if (!gaEnabled || !gaId || gaId === "G-XXXXXXXXXX") {
    return (
        <>
            {customScripts && <div dangerouslySetInnerHTML={{ __html: customScripts }} />}
        </>
    );
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      {customScripts && <div dangerouslySetInnerHTML={{ __html: customScripts }} />}
    </>
  );
}
