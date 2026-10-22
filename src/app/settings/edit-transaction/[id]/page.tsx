
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function EditTransactionPage() {
    const router = useRouter();
    const params = useParams();
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();

    const transactionId = params.id as string;
    const [transaction, setTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        const txToEdit = state.transactions.find(t => t.id === transactionId);
        if (txToEdit) {
            setTransaction(txToEdit);
        } else {
            toast({ variant: 'destructive', title: "Error", description: "Transaction not found." });
            router.back();
        }
    }, [transactionId, state.transactions, toast, router]);

    const handleUpdate = (field: keyof Transaction, value: string) => {
        if (transaction) {
            const newTransaction = { ...transaction, [field]: value };
            // If amount or type is changed, ensure they are consistent
            if (field === 'amount') {
                const newAmount = parseFloat(value);
                if (newTransaction.type === 'debit') {
                    newTransaction.amount = -Math.abs(newAmount);
                } else {
                    newTransaction.amount = Math.abs(newAmount);
                }
            }
            if (field === 'type') {
                newTransaction.amount = value === 'debit' ? -Math.abs(newTransaction.amount) : Math.abs(newTransaction.amount);
            }
            setTransaction(newTransaction);
        }
    };

    const handleSave = () => {
        if (transaction) {
            dispatch({ type: 'UPDATE_TRANSACTION', payload: { originalId: transactionId, updatedTransaction: transaction } });
            toast({ title: "Success", description: "Transaction updated successfully." });
            router.push('/settings?tab=data');
        } else {
            toast({ variant: 'destructive', title: "Error", description: "No transaction to update." });
        }
    };

    if (!transaction) {
        return (
            <div className="p-4">
                <p>Loading transaction...</p>
            </div>
        );
    }
    
    const formatToISTForInput = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            // Format to YYYY-MM-DDTHH:mm in IST by creating a new date object with the UTC values and treating them as local
            const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
            const year = istDate.getUTCFullYear();
            const month = (istDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = istDate.getUTCDate().toString().padStart(2, '0');
            const hours = istDate.getUTCHours().toString().padStart(2, '0');
            const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
    
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error("Error formatting date to IST:", error);
            return '';
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const localDateString = e.target.value;
        if (localDateString) {
            try {
                // The input is already in IST, so we parse it as such and convert to UTC ISO string
                const localDate = new Date(localDateString + ':00.000+05:30');
                const utcDateString = localDate.toISOString();
                handleUpdate('date', utcDateString);
            } catch (error) {
                 console.error("Error parsing date:", error);
            }
        }
    };


    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/settings?tab=data')}>
                            <ArrowLeft />
                        </Button>
                        <div>
                            <CardTitle>Edit Transaction</CardTitle>
                            <CardDescription>
                                Modify the details of the transaction receipt.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Transaction ID (Reference ID)</Label>
                        <Input 
                            value={transaction.id}
                            onChange={e => handleUpdate('id', e.target.value)}
                        />
                         <p className="text-xs text-muted-foreground">This is the main reference ID for the transaction.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <RadioGroup 
                            value={transaction.type} 
                            onValueChange={(value) => handleUpdate('type', value)} 
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="credit" id="credit" />
                                <Label htmlFor="credit">Credit</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="debit" id="debit" />
                                <Label htmlFor="debit">Debit</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input 
                            type="number" 
                            value={Math.abs(transaction.amount)}
                            onChange={e => handleUpdate('amount', e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Beneficiary</Label>
                         <Select 
                            value={transaction.payeeId} 
                            onValueChange={(value) => {
                                const payee = state.payees.find(p => p.id === value);
                                if (payee) {
                                    handleUpdate('payeeId', value);
                                    handleUpdate('payee', payee.name);
                                }
                            }}
                         >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a beneficiary" />
                            </SelectTrigger>
                            <SelectContent>
                                {state.payees.map(payee => (
                                    <SelectItem key={payee.id} value={payee.id}>{payee.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                     <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Input 
                            value={transaction.remarks || ''}
                            onChange={e => handleUpdate('remarks', e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Reference Number (RRN)</Label>
                        <Input 
                            value={transaction.reference || ''}
                            onChange={e => handleUpdate('reference', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                            value={transaction.description}
                            onChange={e => handleUpdate('description', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Transaction Date (IST)</Label>
                        <Input 
                            type="datetime-local"
                            value={formatToISTForInput(transaction.date)}
                            onChange={handleDateChange}
                        />
                    </div>
                    <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </CardContent>
            </Card>
        </div>
    )
}

    