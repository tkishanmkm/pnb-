
"use client";

import React from 'react';
import { useAppContext } from '@/hooks/use-app-store';
import Image from 'next/image';

const LoadingSpinner = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-400"
  >
    <path
      d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
      opacity=".25"
      fill="currentColor"
    />
    <path
      d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.5,1.5,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"
      fill="currentColor"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="0.75s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);


export const SplashScreen = () => {
    const { state } = useAppContext();
    const { pnbOneLogo, pnbBanner } = state.settings;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background p-8">
            <div />
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                {pnbOneLogo ? (
                    <Image src={pnbOneLogo} width={150} height={150} alt="PNB One Logo" data-ai-hint="pnb one logo"/>
                ) : (
                    <div className="w-[150px] h-[150px] bg-muted rounded-md" />
                )}
                <h2 className="text-3xl font-bold text-[#9D2536]">#JustOneApp</h2>
                <LoadingSpinner />
            </div>
            {pnbBanner ? (
                <Image src={pnbBanner} width={250} height={31} alt="Punjab National Bank" data-ai-hint="pnb bank banner"/>
            ) : (
                <div className="w-[250px] h-[31px] bg-muted rounded-md" />
            )}
        </div>
    );
};
