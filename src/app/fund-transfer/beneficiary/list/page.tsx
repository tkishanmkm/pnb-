
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Search, Plus, ArrowLeft, Home, Landmark } from 'lucide-react';
import Link from 'next/link';

import { useAppContext } from '@/hooks/use-app-store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Payee } from "@/lib/types";
import { RupeeIcon } from '@/components/rupee-icon';

export default function BeneficiaryListPage() {
    const { state, dispatch } = useAppContext();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const form = useForm<Payee>({
        defaultValues: { id: `payee-${Date.now()}`, name: "", nickname: "", accountNumber: "", bank: "", ifsc: "" },
    });

    const filteredPayees = useMemo(() => {
        if (!searchQuery) return state.payees;
        return state.payees.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.accountNumber.includes(searchQuery)
        );
    }, [state.payees, searchQuery]);

    const handleAddPayee = (values: Payee) => {
        const newPayee: Payee = {
            ...values,
            id: values.id || `payee-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Ensure ID is never empty
        };
        dispatch({ type: 'ADD_PAYEE', payload: newPayee });
        // Reset the form with a new unique ID for the next entry
        form.reset({ id: `payee-${Date.now()}`, name: "", nickname: "", accountNumber: "", bank: "", ifsc: "" });
        setIsAddDialogOpen(false);
    };
    
    const handleSelectPayee = (payee: Payee) => {
        router.push(`/fund-transfer/beneficiary/details/${payee.id}`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">Manage Beneficiaries</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                        placeholder="Search all beneficiaries"
                        className="pl-10 bg-white"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full bg-white justify-start text-gray-700 font-normal">
                           <Plus className="mr-2 h-4 w-4"/> Add Beneficiary
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Payee</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleAddPayee)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Payee Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="nickname" render={({ field }) => (
                                    <FormItem><FormLabel>Nickname (Optional)</FormLabel><FormControl><Input placeholder="e.g., Landlord" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="Enter account number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="bank" render={({ field }) => (
                                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g., PNB Bank" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="ifsc" render={({ field }) => (
                                    <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="Enter 11-digit IFSC" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                    <Button type="submit">Add Payee</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                <div className="space-y-2">
                    {filteredPayees.length > 0 ? (
                        filteredPayees.map(payee => (
                           <div 
                                key={payee.id}
                                onClick={() => handleSelectPayee(payee)}
                                className="flex items-center p-3 hover:bg-gray-100 cursor-pointer rounded-lg bg-white border-b"
                            >
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 mr-4">
                                    <Landmark className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{payee.nickname || payee.name}</p>
                                    <p className="text-xs text-gray-500">{payee.bank} ....{payee.accountNumber.slice(-4)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-sm flex items-center justify-end tracking-tighter"><RupeeIcon className="w-3 h-3 mr-0.5" /> 10,00,000.00</p>
                                    <p className="text-xs text-gray-500">Daily Limit</p>
                                    <p className="text-xs text-gray-500">10 Per Day</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-gray-500">No payees found.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
