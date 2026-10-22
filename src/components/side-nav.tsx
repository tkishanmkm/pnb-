

"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    User, 
    MapPin, 
    Calculator, 
    Headphones, 
    UserPlus, 
    Star, 
    Users, 
    Info, 
    LogOut
} from 'lucide-react';
import { useAppContext } from '@/hooks/use-app-store';
import { SheetClose, SheetTitle, SheetDescription, SheetHeader } from './ui/sheet';

const navItems = [
  { href: '/my-profile', label: 'My Profile', icon: User },
  { href: '#', label: 'PNB Locations', icon: MapPin },
  { href: '#', label: 'Deposit Calculator', icon: Calculator },
  { href: '/contact-us', label: 'Contact Us', icon: Headphones },
  { href: '#', label: 'Invite & Refer', icon: UserPlus },
  { href: '/settings', label: 'Rate Us', icon: Star },
  { href: '#', label: 'My Relationship Manager', icon: Users },
  { href: '#', label: 'About App', icon: Info },
];

function SideNavComponent() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  const user = state.user;

  const handleLogout = React.useCallback(() => {
    dispatch({ type: 'LOGOUT_PENDING' });
  }, [dispatch]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-primary text-primary-foreground">
        <SheetHeader className="sr-only">
          <SheetTitle>Main Menu</SheetTitle>
          <SheetDescription>
            Navigation menu for PNB Bank application.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6 pt-12 bg-cover bg-center" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/rings-bg.png')"}}>
            <div>
              <p className="text-lg">Hello,</p>
              <h2 className="text-xl font-bold truncate">{user.name.toUpperCase()}</h2>
            </div>
        </div>
        
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {navItems.map(({ icon: Icon, label, href }) => (
              <SheetClose asChild key={label}>
                <Link href={href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/20 transition-colors">
                    <Icon className="h-6 w-6 text-accent" />
                    <span className="font-medium">{label}</span>
                </Link>
              </SheetClose>
            ))}
        </nav>

        <div className="p-4 border-t border-white/20">
          <SheetClose asChild>
            <button onClick={handleLogout} className="flex items-center gap-4 p-3 rounded-lg w-full text-left hover:bg-black/20 transition-colors">
                <LogOut className="h-6 w-6 text-accent" />
                <span className="font-medium">Logout</span>
            </button>
          </SheetClose>
        </div>
    </div>
  );
}

const SideNav = React.memo(SideNavComponent);
export default SideNav;
