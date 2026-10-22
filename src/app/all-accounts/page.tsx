
"use client";

import React from 'react';
import { useAppContext } from '@/hooks/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { RupeeIcon } from '@/components/rupee-icon';

export default function AllAccountsPage() {
  const { state } = useAppContext();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold font-headline mb-4">All Accounts</h1>
      <div className="space-y-4">
        {state.accounts.map((account) => (
          <Card key={account.id} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">{account.type} Account</CardTitle>
              <Banknote className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
              <p className="text-2xl font-bold font-headline mt-2 flex items-center tracking-tighter">
                <RupeeIcon className="h-5 w-5 mr-0.5" /> {formatCurrency(account.balance)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
