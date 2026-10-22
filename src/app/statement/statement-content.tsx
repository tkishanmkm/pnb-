
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/hooks/use-app-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, FileText, FileDown } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { format, parseISO, startOfDay } from "date-fns";
import StatementPDF from "@/components/statement-pdf";
import { useAppContext } from "@/hooks/use-app-store";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { RupeeIcon } from "@/components/rupee-icon";
import { toast } from "@/hooks/use-toast";

const TransactionRow = ({ transaction }: { transaction: Transaction & { balance: number } }) => {
    const { state } = useAppContext();
    const isDebit = transaction.type === 'debit';
    const formattedAmount = formatCurrency(Math.abs(transaction.amount));
    const formattedBalance = formatCurrency(transaction.balance);

    return (
        <div className="py-3 px-4">
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                    <p className="text-sm font-semibold text-gray-800 break-words">{transaction.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className={`text-base font-bold whitespace-nowrap flex items-center justify-end tracking-tighter ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                        {isDebit ? '-' : '+'}{' '}
                        <RupeeIcon className="w-3.5 h-3.5 mx-0.5" />{formattedAmount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Available Balance</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 flex items-center justify-end tracking-tighter"><RupeeIcon className="w-3 h-3 mr-0.5" />{formattedBalance}</p>
                </div>
            </div>
            <Separator className="mt-3" />
        </div>
    );
};


export function StatementContent() {
    const { state } = useAppContext();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    const transactionsWithBalance = useMemo(() => {
        if (!state || !from || !to) return [];

        const fromDate = startOfDay(parseISO(from));
        const toDate = new Date(parseISO(to).setHours(23, 59, 59, 999));

        const allTransactionsSortedAsc = [...state.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const openingBalance = allTransactionsSortedAsc
            .filter(tx => new Date(tx.date) < fromDate)
            .reduce((acc, tx) => acc + tx.amount, state.accounts[0].balance - allTransactionsSortedAsc.reduce((acc, tx) => acc + tx.amount, 0));

        const periodTransactions = allTransactionsSortedAsc.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= fromDate && txDate <= toDate;
        });

        let runningBalance = openingBalance;
        const transactionsWithRunningBalance = periodTransactions.map(tx => {
            runningBalance += tx.amount;
            return { ...tx, balance: runningBalance };
        });
        
        return transactionsWithRunningBalance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [state, from, to]);
    
    const handleDownloadPdf = async () => {
        if (!from || !to || !state) return;
        setIsGeneratingPdf(true);
        toast({ title: "Generating PDF...", description: "Your statement is being prepared." });

        try {
            const pdfDataUri = await StatementPDF.generatePdfDataUri({
                account: state.accounts[0],
                transactions: transactionsWithBalance,
                period: { from: new Date(from), to: new Date(to) },
                banner: state.settings.pdfBanner,
                lastPagePdfDataUri: state.settings.lastPagePdfDataUri,
                pdfPassword: state.settings.pdfPassword,
            });
            
            // Create a temporary link to initiate the download.
            // The native Android code will intercept this.
            const link = document.createElement('a');
            link.href = pdfDataUri;
            link.download = `Statement-${state.accounts[0].accountNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ title: "Download Initiated", description: "Check your device for the downloaded statement." });
        } catch (error) {
            console.error("PDF Generation/Download Error:", error);
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate or download PDF.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    
    if (!state) return null; // Or a loading state
    if (!from || !to) return <div className="p-4 text-center">Invalid date range provided.</div>

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="p-3 bg-primary text-primary-foreground flex items-center justify-between sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-accent hover:bg-white/10">
                    <ArrowLeft className="h-6 w-6"/>
                </Button>
                <h1 className="text-xl font-semibold">Statement</h1>
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="text-accent hover:bg-white/10">
                        <Home className="h-6 w-6" />
                    </Button>
                </Link>
            </header>

            <main className="flex-1 overflow-y-auto pb-20">
                {transactionsWithBalance.length > 0 ? (
                    <div className="divide-y">
                        {transactionsWithBalance.map((tx) => (
                            <TransactionRow key={tx.id} transaction={tx} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full p-8">
                        <FileText className="h-12 w-12 text-gray-300 mb-4" />
                        <h2 className="text-lg font-semibold">No Transactions Found</h2>
                        <p className="text-sm">There are no transactions for the selected period.</p>
                    </div>
                )}
            </main>
            
            <footer className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-primary text-primary-foreground z-10">
                <div className="flex justify-around items-center h-20">
                    <Button variant="ghost" className="flex flex-col items-center h-full text-white" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                        <FileDown className="h-6 w-6" />
                        <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                    </Button>
                     <Button variant="ghost" className="flex flex-col items-center h-full text-white" onClick={() => { toast({ title: "Coming Soon", description: "XLS download is not yet implemented."}) }}>
                        <FileDown className="h-6 w-6" />
                        <span>Download XLS</span>
                    </Button>
                </div>
            </footer>
        </div>
    );
}
