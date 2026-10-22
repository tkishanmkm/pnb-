
"use client";

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { RupeeIcon } from '@/components/rupee-icon';

import * as numberToWords from 'number-to-words';

type Step = 'summary' | 'tpin';

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex justify-between items-start py-2">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="text-right">{children}</div>
    </div>
);

function ConfirmTransferPage() {
  const router = useRouter();
  const params = useParams();
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  
  const payeeId = params.id as string;
  const { currentTransfer, settings } = state;
  const payee = state.payees.find(p => p.id === payeeId);
  const account = state.accounts[0];
  const appLogo = settings.appLogo;

  const [step, setStep] = useState<Step>('summary');
  const [tpin, setTpin] = useState('');
  const tpinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'tpin') {
        tpinInputRef.current?.focus();
    }
  }, [step]);
  
  useEffect(() => {
    if (!payee || !currentTransfer.amount) {
        if (typeof window !== 'undefined') {
          router.push('/fund-transfer');
        }
    }
  }, [payee, currentTransfer, router]);


  if (!payee || !currentTransfer.amount) {
    return <div className="p-4">Transfer details are missing. Redirecting...</div>;
  }
  
  const handleTpinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,4}$/.test(value)) {
        setTpin(value);
        if (value.length === 4) {
            verifyTpin(value);
        }
    }
  };
  
  const verifyTpin = (enteredPin: string) => {
    if (enteredPin === state.user.tpin) {
      router.push(`/fund-transfer/verify/${payeeId}`);
    } else {
      toast({ variant: 'destructive', title: 'Invalid TPIN', description: 'The TPIN you entered is incorrect.' });
      setTpin('');
      tpinInputRef.current?.focus();
    }
  };


  const numericAmount = currentTransfer.amount;
  const amountInWords = numberToWords.toWords(numericAmount).replace(/\b\w/g, (l: string) => l.toUpperCase()) + ' Only';
  const formattedAmount = formatCurrency(numericAmount);
  const transferDate = new Date();

  const renderStep = () => {
    switch(step) {
      case 'tpin':
        const tpinDigits = tpin.padEnd(4, ' ').split('');
        return (
             <div className="flex flex-col h-screen bg-white">
                <header className="bg-primary text-primary-foreground p-4 flex items-center">
                    <button onClick={() => setStep('summary')}>
                        <ArrowLeft className="h-6 w-6 text-accent" />
                    </button>
                    <h1 className="text-xl font-semibold ml-4">Confirm your transfer</h1>
                </header>
                <main className="flex-1 flex flex-col justify-start items-start p-6 pt-16 text-left">
                    <div className="w-full max-w-xs">
                        <p className="text-base text-gray-700 mb-2">Please enter your 4 digit TPIN</p>
                        <div 
                            className="relative flex justify-start items-center gap-4 my-6 cursor-text"
                            onClick={() => tpinInputRef.current?.focus()}
                        >
                            {tpinDigits.map((digit, index) => (
                                <div key={index} className="w-12 h-12 flex flex-col items-center justify-center">
                                    <div className={cn("w-4 h-4 bg-gray-300 rounded-full", { "bg-primary": digit !== " " })} />
                                    <div className="w-full h-px bg-gray-400 mt-2" />
                                </div>
                            ))}
                             <input
                                ref={tpinInputRef}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                maxLength={4}
                                value={tpin}
                                onChange={handleTpinChange}
                                className="absolute inset-0 w-full h-full bg-transparent border-none outline-none text-transparent [caret-color:transparent]"
                            />
                        </div>
                        <Link href="#" className="text-sm font-semibold text-primary">
                            Forgot TPIN?
                        </Link>
                    </div>
                </main>
            </div>
        );
      case 'summary':
      default:
        return (
          <>
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold">Summary</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>
            <main className="flex-1 p-3 space-y-3">
                <p className="text-xs text-gray-700">Confirm below details to transfer funds</p>

                <Card>
                    <CardContent className="p-3 divide-y">
                        <DetailRow label="From">
                            <div>
                                <span className="font-semibold text-xs text-gray-800">{state.user.name}</span>
                                <div className="flex items-center justify-end gap-2 mt-1">
                                    <Image src={appLogo} alt="Bank Logo" width={16} height={16} />
                                    <span className="text-xs text-gray-600">....{account.accountNumber.slice(-4)}</span>
                                </div>
                            </div>
                        </DetailRow>

                        <DetailRow label="To">
                            <span className="font-semibold text-xs text-gray-800">{payee.name}</span>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                 <Landmark className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-gray-600">{payee.accountNumber}</span>
                            </div>
                        </DetailRow>

                        <DetailRow label="Amount">
                            <div>
                                <p className="font-bold text-base text-gray-900 flex items-center justify-end tracking-tighter"><RupeeIcon className="w-4 h-4 mr-0.5"/>{formattedAmount}</p>
                                <p className="text-[10px] text-gray-500 max-w-40 break-words text-right">{amountInWords}</p>
                            </div>
                        </DetailRow>

                        <DetailRow label="Remarks">
                            <span className="font-semibold text-xs text-gray-800">{currentTransfer.remarks || '-'}</span>
                        </DetailRow>

                        <DetailRow label="Transfer date">
                            <span className="font-semibold text-xs text-gray-800">{format(transferDate, 'dd MMM yyyy')}</span>
                        </DetailRow>
                    </CardContent>
                </Card>
            </main>

            <footer className="p-4 border-t bg-background fixed bottom-0 z-10 w-full max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="lg" onClick={() => router.back()}>Edit</Button>
                    <Button size="lg" onClick={() => setStep('tpin')}>Confirm</Button>
                </div>
            </footer>
          </>
        )
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
        {renderStep()}
    </div>
  );
}

export default function TransferSummaryPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmTransferPage />
        </Suspense>
    );
}
