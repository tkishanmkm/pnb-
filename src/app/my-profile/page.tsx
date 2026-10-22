
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Home, ChevronRight, User, KeyRound, ShieldCheck, Fingerprint, Languages, Building, XCircle } from 'lucide-react';

const options = [
    {
        title: 'My Account',
        icon: User,
        href: '/my-account',
    },
    {
        title: 'Set Account Nickname',
        icon: User,
        href: '#',
    },
    {
        title: 'Change MPIN',
        icon: KeyRound,
        href: '#',
    },
    {
        title: 'Check KYC Status',
        icon: ShieldCheck,
        href: '#',
    },
    {
        title: 'Enable Biometrics',
        icon: Fingerprint,
        href: '#',
    },
    {
        title: 'SMS Preferred Language',
        icon: Languages,
        href: '#',
    },
    {
        title: 'Register For IBS',
        icon: Building,
        href: '#',
    },
    {
        title: 'De-Activation',
        icon: XCircle,
        href: '#',
    },
];

export default function MyProfilePage() {
    const router = useRouter();

    const renderOption = (option: typeof options[0]) => (
        <div className="flex items-center p-4">
            <div className="mr-4 text-primary">
                <option.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{option.title}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">My Profile</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-2 space-y-2 overflow-y-auto">
                <Card className="shadow-sm">
                    <div className="p-0 divide-y">
                        {options.map((option, index) => (
                            <Link href={option.href} key={index} className="block hover:bg-gray-100 transition-colors">
                                {renderOption(option)}
                            </Link>
                        ))}
                    </div>
                </Card>
            </main>
        </div>
    );
}
