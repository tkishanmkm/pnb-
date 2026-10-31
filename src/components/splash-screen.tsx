"use client";

import React from "react";
import Image from "next/image";

/** Fixed, asset-based PNB ONE splash matched to the supplied original reference. */
export const SplashScreen = () => (
  <main aria-label="PNB ONE loading" className="pnb-reference-splash fixed inset-0 z-[200] overflow-hidden">
    <div className="pnb-reference-splash__stage">
      <div aria-hidden="true" className="pnb-reference-splash__circle" />
      <section className="pnb-reference-splash__center" aria-label="PNB ONE">
        <Image src="/pnb-splash/pnb-one-mark.png" alt="PNB ONE app logo" width={235} height={235} priority unoptimized className="pnb-reference-splash__app-logo" />
        <Image src="/pnb-splash/justoneapp.png" alt="#JustOneApp" width={2048} height={686} priority unoptimized className="pnb-reference-splash__tagline" />
      </section>
      <footer className="pnb-reference-splash__footer" aria-label="Punjab National Bank">
        <Image src="/pnb-splash/pnb-logo.png" alt="PNB" width={480} height={215} priority unoptimized className="pnb-reference-splash__bank-logo" />
        <Image src="/pnb-splash/punjab-national-bank.png" alt="Punjab National Bank" width={808} height={118} priority unoptimized className="pnb-reference-splash__bank-wordmark" />
        <Image src="/pnb-splash/pcidss.png" alt="PCI DSS compliant" width={751} height={332} priority unoptimized className="pnb-reference-splash__pcidss" />
      </footer>
    </div>
  </main>
);