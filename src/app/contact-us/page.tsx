"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Phone, MessageSquare, ChevronRight, Home, HelpCircle } from 'lucide-react';

const options = [
    {
        title: 'Call Us',
        description: 'Speak to a customer service representative.',
        icon: Phone,
        href: 'tel:18001800',
        isExternal: true,
    },
    {
        title: 'Live Chat',
        description: 'Chat with an agent for quick help.',
        icon: MessageSquare,
        href: '/agent-live-chat',
        isExternal: false,
    },
    {
        title: 'FAQ',
        description: 'Frequently asked questions about our services.',
        icon: HelpCircle,
        href: '/faq',
        isExternal: false,
    },
];

export default function ContactUsPage() {
    const router = useRouter();

    const renderOption = (option: typeof options[0]) => (
        <div className="flex items-center p-4">
            <div className="mr-4 text-primary">
                <option.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{option.title}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
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
                <h1 className="text-xl font-semibold">Contact Us</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-2 space-y-2 overflow-y-auto">
                <Card className="shadow-none">
                    <div className="p-0 divide-y">
                        {options.map((option, index) => {
                            if (option.isExternal) {
                                return (
                                    <a href={option.href} key={index} className="block hover:bg-gray-100 transition-colors">
                                        {renderOption(option)}
                                    </a>
                                );
                            }
                            return (
                                <Link href={option.href} key={index} className="block hover:bg-gray-100 transition-colors">
                                    {renderOption(option)}
                                </Link>
                            );
                        })}
                    </div>
                </Card>
            </main>
        </div>
    );
}
