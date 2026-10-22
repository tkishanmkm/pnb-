
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Share2, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { RupeeIcon } from '@/components/rupee-icon';

export default function TransferSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const { state, dispatch } = useAppContext();
  
  // The ID from the route is just for navigation, the actual transaction is the latest one.
  const transactionId = params.id as string; 
  const transaction = state.transactions[0]; // Assuming the latest transaction is the one just made
  
  const payeeName = transaction?.payee;
  const account = state.accounts[0];
  
  useEffect(() => {
    // Clear the transfer details from the state after success
    dispatch({ type: 'CLEAR_TRANSFER' });
  }, [dispatch]);

  if (!transaction) {
    return <div className="p-4">Transaction not found or you have refreshed the page.</div>;
  }
  
  const handleNewTransfer = () => {
    router.push('/fund-transfer/beneficiary');
  }

  const handleGoHome = () => {
    router.push('/dashboard');
  }
  
  return (
    <div className="p-4 flex flex-col items-center justify-center text-center h-full">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold font-headline mb-2">Transfer Successful!</h1>
      <p className="text-muted-foreground mb-6">You have successfully sent money.</p>
      
      <Card className="w-full text-left">
        <CardHeader>
          <CardTitle>Transaction Receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Sent</span>
            <span className="font-bold text-primary flex items-center tracking-tighter"><RupeeIcon className="w-3.5 h-3.5 mr-0.5" /> {Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-semibold">{payeeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">From Account</span>
            <span className="font-semibold">{account.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction Date</span>
            <span className="font-semibold">{format(new Date(transaction.date), 'MMM dd, yyyy - hh:mm a')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference No.</span>
            <span className="font-semibold">{transaction.id}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="w-full space-y-2 mt-6">
        <Button className="w-full" variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Receipt</Button>
        <Button className="w-full" onClick={handleNewTransfer}><Repeat className="mr-2 h-4 w-4" /> Make Another Transfer</Button>
        <Button className="w-full" variant="ghost" onClick={handleGoHome}>Back to Home</Button>
      </div>
    </div>
  );
}
