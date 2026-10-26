
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SideNav from '@/components/side-nav';
import { PNBLogo } from '@/components/pnb-logo';
import { useAppContext } from '@/hooks/use-app-store';

function HeaderComponent() {
  const { dispatch } = useAppContext();
  const router = useRouter();

  const handleLogout = React.useCallback(() => {
    dispatch({ type: 'LOGOUT_PENDING' });
    router.push('/');
  }, [dispatch, router]);

  return (
    <header className="flex items-center justify-between p-3 h-16 bg-gray-50 shadow-sm sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6 text-gray-700" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SideNav />
        </SheetContent>
      </Sheet>

      <div className="absolute left-1/2 -translate-x-1/2">
        <PNBLogo className="h-10 w-auto object-contain" />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Search className="h-6 w-6 text-gray-700" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-6 w-6 text-gray-700" />
        </Button>
      </div>
    </header>
  );
}

export const AppHeader = React.memo(HeaderComponent);
