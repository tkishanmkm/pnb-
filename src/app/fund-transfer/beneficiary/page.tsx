
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { ChevronDown, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { RupeeIcon } from '@/components/rupee-icon';

const PNBIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#F58220"/>
        <path d="M10.2941 17.6569V6.34314H13.6275C14.9314 6.34314 15.9118 6.62745 16.5686 7.19608C17.2255 7.76471 17.5539 8.58824 17.5539 9.66667C17.5539 10.7059 17.2402 11.549 16.6127 12.1961C15.9853 12.8431 15.0686 13.1373 13.8627 13.1863H11.8333V17.6569H10.2941ZM11.8333 11.8137H13.2647C13.9706 11.8137 14.5098 11.6667 14.8824 11.3725C15.2549 11.0784 15.4412 10.652 15.4412 10.0902C15.4412 9.5 15.2549 9.04902 14.8824 8.73725C14.5098 8.42549 13.9706 8.26863 13.2647 8.26863H11.8333V11.8137Z" fill="white"/>
    </svg>
);

export default function BeneficiaryTransferPage() {
    const { state } = useAppContext();
    const router = useRouter();
    const account = state.accounts[0];

    return (
        <div className="flex flex-col h-screen bg-gray-50">
             <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold">Transfer Funds to Beneficiary</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-4 space-y-6">
                <h1 className="text-lg font-semibold text-gray-800">Transfer Details</h1>
                
                <div className="space-y-4">
                    {/* Transfer From */}
                    <div>
                        <p className="text-xs text-muted-foreground px-1 mb-1">Transfer from</p>
                        <div className="bg-white p-3 rounded-lg border flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <PNBIcon/>
                                <div>
                                    <p className="font-semibold text-sm">{state.user.name}</p>
                                    <p className="text-xs text-muted-foreground">....{account.accountNumber.slice(-4)}</p>
                                </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1 flex items-center tracking-tighter">Available Balance: <RupeeIcon className="w-3 h-3 mx-0.5" />{formatCurrency(account.balance)}</p>
                    </div>
                    
                    {/* Transfer To */}
                    <div>
                        <p className="text-xs text-muted-foreground px-1 mb-1">Transfer to</p>
                        <div 
                            className="bg-white p-3 rounded-lg border flex justify-between items-center cursor-pointer"
                            onClick={() => router.push('/fund-transfer/beneficiary/list')}
                        >
                            <p className="text-sm text-gray-700">Select Beneficiary</p>
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
