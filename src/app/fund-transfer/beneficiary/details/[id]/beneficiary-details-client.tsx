
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Home, Edit, Trash2, Landmark } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { RupeeIcon } from '@/components/rupee-icon';

const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-right">{value || '-'}</span>
    </div>
);

export default function BeneficiaryDetailsClient({ payeeId }: { payeeId: string }) {
    const router = useRouter();
    const { state, dispatch } = useAppContext();
    const payee = state.payees.find(p => p.id === payeeId);

    if (!payee) {
        return (
            <div className="p-4">
                <p>Beneficiary not found.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }
    
    const lastTransaction = state.transactions
        .filter(t => t.payeeId === payee.id && t.type === 'debit')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const handleDelete = () => {
        dispatch({ type: 'DELETE_PAYEE', payload: { id: payeeId }});
        router.push('/fund-transfer/beneficiary/list');
    };

    const handleSendMoney = () => {
        dispatch({ type: 'SET_TRANSFER_DETAILS', payload: { payeeId: payee.id } });
        router.push(`/fund-transfer/to-beneficiary/${payee.id}`);
    }
    
    const getViewReceiptUrl = (tx: Transaction) => {
         const queryParams = new URLSearchParams({
            payeeId: tx.payeeId!,
            amount: Math.abs(tx.amount).toString(),
            remarks: tx.remarks || '',
            transferDate: tx.date,
            referenceId: tx.id,
            rrn: tx.reference || ''
        }).toString();
        return `/fund-transfer/success?${queryParams}`;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">{payee.nickname || payee.name}</h1>
                <div className="flex items-center gap-4">
                    <button><Edit className="h-5 w-5 text-accent" /></button>
                    <button onClick={handleDelete}><Trash2 className="h-5 w-5 text-accent" /></button>
                </div>
            </header>

            <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                             <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                               <Landmark className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">{payee.name}</p>
                                {payee.nickname && <p className="text-sm text-muted-foreground">{payee.nickname}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Beneficiary Details</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <DetailRow label="Account Number" value={payee.accountNumber} />
                        <DetailRow label="Bank Name" value={payee.bank} />
                        <DetailRow label="IFSC Code" value={payee.ifsc} />
                    </CardContent>
                </Card>
                
                {lastTransaction && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Last Transaction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-lg text-primary flex items-center tracking-tighter">
                                        <RupeeIcon className="h-4 w-4 mr-0.5" />
                                        {formatCurrency(Math.abs(lastTransaction.amount))}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(lastTransaction.date), "dd MMM yyyy, h:mm a")}</p>
                                </div>
                                <Link href={getViewReceiptUrl(lastTransaction)}>
                                    <Button variant="link">View Receipt</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
            
             <footer className="p-4 border-t bg-background fixed bottom-0 z-10 w-full max-w-md mx-auto">
                <Button className="w-full" size="lg" onClick={handleSendMoney}>
                    Send Money
                </Button>
            </footer>
        </div>
    );
}
