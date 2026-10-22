
'use client';

import React from 'react';
import { useAppContext } from '@/hooks/use-app-store';
import type { IconAssets } from '@/lib/types';
import Image from 'next/image';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  iconKey: keyof IconAssets;
  fallback: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ iconKey, fallback: Fallback, className, ...props }) => {
  const { state } = useAppContext();
  const customIconSrc = state.settings.iconAssets?.[iconKey];

  if (customIconSrc) {
    // Render an <img> tag if a custom icon source (data URI) is available.
    // The className is passed to allow for sizing from Tailwind classes.
    return <img src={customIconSrc} alt={`${iconKey} icon`} className={className} />;
  }

  // Otherwise, render the default fallback SVG component
  return <Fallback className={className} {...props} />;
};

export default DynamicIcon;
