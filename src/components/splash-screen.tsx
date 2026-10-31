"use client";

import React from "react";
import Image from "next/image";
import { useAppContext } from "@/hooks/use-app-store";

/** PNB ONE splash layout using the original artwork, with settings overrides. */
export const SplashScreen = () => {
  const { state } = useAppContext();
  const settings = state.settings;
  const centerLogo = settings.pnbOneLogo || settings.appLogo;

  return (
    <main aria-label="PNB ONE loading" className="pnb-reference-splash fixed inset-0 z-[200] overflow-hidden">
      <div aria-hidden="true" className="pnb-reference-splash__circle" />
      <section className="pnb-reference-splash__center" aria-label="PNB ONE">
        {centerLogo ? (
          <Image src={centerLogo} alt="PNB ONE app logo" width={220} height={220} priority unoptimized className="pnb-reference-splash__app-logo" />
        ) : (
          <div aria-hidden="true" className="pnb-reference-splash__app-logo-placeholder" />
        )}
        <Image src={settings.splashJustOneAppAsset || "/pnb-splash/justoneapp.png"} alt="#JustOneApp" width={2048} height={686} priority unoptimized className="pnb-reference-splash__tagline" />
      </section>
      <footer className="pnb-reference-splash__footer" aria-label="Punjab National Bank">
        <Image src={settings.splashPnbLogoAsset || "/pnb-splash/pnb-logo.png"} alt="PNB" width={480} height={215} priority unoptimized className="pnb-reference-splash__bank-logo" />
        <Image src={settings.splashBankWordmarkAsset || "/pnb-splash/punjab-national-bank.png"} alt="Punjab National Bank" width={808} height={118} priority unoptimized className="pnb-reference-splash__bank-wordmark" />
        <Image src={settings.splashPciDssAsset || "/pnb-splash/pcidss.png"} alt="PCI DSS compliant" width={751} height={332} priority unoptimized className="pnb-reference-splash__pcidss" />
      </footer>
    </main>
  );
};
