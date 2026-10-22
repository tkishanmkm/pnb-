
import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/hooks/use-app-store';

export const PNBLogo = ({ className }: { className?: string }) => {
  const { state } = useAppContext();
  
  if (!state.settings.appLogo) return null;

  return (
    <Image 
      src={state.settings.appLogo} 
      alt="PNB eBank Logo" 
      width={120} 
      height={40} 
      className={className} 
      priority
    />
  );
};
