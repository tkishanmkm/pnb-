
"use client";

import React, { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { RupeeIcon } from '@/components/rupee-icon';

type Step = 'summary' | 'tpin' | 'otp';

export default function ConfirmTransferPage() {
  const router = useRouter();
  const params = useParams();
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  
  const payeeId = params.id as string;
  const { currentTransfer } = state;
  const payee = state.payees.find(p => p.id === payeeId);
  const account = state.accounts[0];
  const transferAmount = currentTransfer.amount;

  const [step, setStep] = useState<Step>('summary');
  const [tpin, setTpin] = useState('');
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!account || !payee || typeof transferAmount !== 'number' || !Number.isFinite(transferAmount) || transferAmount <= 0) {
    // This should ideally not happen if the flow is correct.
    // Redirecting to the start of the flow.
    if (typeof window !== 'undefined') {
      router.push('/fund-transfer/beneficiary');
    }
    return <div className="p-4">Transfer details are missing. Redirecting...</div>;
  }
  
  const handleConfirm = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
        const newTransaction = {
            type: 'debit' as 'debit',
            amount: -transferAmount,
            description: `Fund Transfer to ${payee.name}`,
            date: new Date().toISOString(),
            payee: payee.name,
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        const transactionIdForRoute = `txn-${Date.now()}`; // The reducer will create its own ID. This is for the URL.
        toast({ title: 'Success', description: 'Fund transfer completed successfully.' });
        router.push(`/fund-transfer/success/${transactionIdForRoute}`);
        setIsProcessing(false);
    }, 1000);
  };

  const verifyTpin = () => {
    if (tpin === state.user.tpin) {
      toast({ title: "TPIN Verified", description: "An OTP has been sent to your registered number." });
      setStep('otp');
    } else {
      toast({ variant: 'destructive', title: 'Invalid TPIN', description: 'The TPIN you entered is incorrect.' });
    }
  };

  const verifyOtp = () => {
    if (otp === '123456') { // Demo OTP
      toast({ title: "OTP Verified", description: "Processing your transaction." });
      handleConfirm();
    } else {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: 'The OTP you entered is incorrect.' });
    }
  };

  const renderStep = () => {
    switch(step) {
      case 'tpin':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Enter TPIN</h2>
            <p className="text-center text-muted-foreground text-sm">Enter your 4-digit Transaction PIN to proceed.</p>
            <Input type="password" placeholder="****" value={tpin} onChange={e => setTpin(e.target.value)} maxLength={4} className="text-center" />
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('summary')} className="w-full">Back</Button>
                <Button onClick={verifyTpin} className="w-full">Verify TPIN</Button>
            </div>
          </div>
        );
      case 'otp':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Enter OTP</h2>
            <p className="text-center text-muted-foreground text-sm">Enter the 6-digit One-Time Password sent to your mobile number.</p>
            <Input type="text" placeholder="------" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="text-center" />
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('tpin')} className="w-full">Back</Button>
                <Button onClick={verifyOtp} disabled={isProcessing} className="w-full">{isProcessing ? "Processing..." : "Confirm Transfer"}</Button>
            </div>
          </div>
        );
      case 'summary':
      default:
        return (
          <>
            <CardHeader>
              <CardTitle>Confirm Transfer</CardTitle>
              <CardDescription>Please review the details below before confirming.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">From</span><span>{account.type} ({account.accountNumber})</span></div>
                <Separator/>
                <div className="flex justify-between"><span className="text-muted-foreground">To</span><span>{payee.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{payee.bank}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Account No.</span><span>{payee.accountNumber}</span></div>
                <Separator/>
                <div className="flex justify-between"><span className="text-muted-foreground">Remarks</span><span>{currentTransfer.remarks || 'N/A'}</span></div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Amount</span>
                <span className="text-2xl font-bold font-headline text-primary flex items-center tracking-tighter"><RupeeIcon className="w-5 h-5 mr-0.5" /> {transferAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
              <Button onClick={() => setStep('tpin')} className="w-full">
                Confirm
              </Button>
            </CardContent>
          </>
        )
    }
  }

  return (
    <div className="p-4">
      <Card>
        {renderStep()}
      </Card>
    </div>
  );
}
