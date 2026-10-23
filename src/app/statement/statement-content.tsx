
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
    const isDebit = transaction.type === 'debit';
    const formattedAmount = formatCurrency(Math.abs(transaction.amount));
    const formattedBalance = formatCurrency(transaction.balance);

    return (
        <div className="py-3 px-4">
            <div className="flex w-full min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-2">
                    <p className="break-words whitespace-normal text-left text-sm font-semibold text-gray-800">{transaction.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="max-w-[44%] shrink-0 text-right">
                    <p className={`text-xs sm:text-base font-bold whitespace-nowrap flex items-center justify-end tracking-tighter ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                        {isDebit ? '-' : '+'}{' '}
                        <RupeeIcon className="w-3.5 h-3.5 mx-0.5" />{formattedAmount}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Available Balance</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 flex items-center justify-end tracking-tighter"><RupeeIcon className="w-3 h-3 mr-0.5" />{formattedBalance}</p>
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
        if (!state || !from || !to || !state.accounts?.[0]) return [];

        const fromDate = startOfDay(parseISO(from));
        const toDate = new Date(parseISO(to).setHours(23, 59, 59, 999));

        // A statement must contain only transactions belonging to the account being exported.
        const account = state.accounts[0];
        // The imported PNB statement lists same-day rows newest-first. Reverse
        // source order for equal timestamps while calculating balances chronologically.
        const accountTransactionsAsc = state.transactions
            .map((tx, index) => ({ tx, index }))
            .filter(({ tx }) => tx.accountId === account.id)
            .sort((a, b) => new Date(a.tx.date).getTime() - new Date(b.tx.date).getTime() || b.index - a.index);
        const allTransactionsSortedAsc = accountTransactionsAsc.map(({ tx }) => tx);

        // Account.balance is the latest closing balance. Rewind every transaction
        // on/after the requested start date to get the opening balance. Do not add
        // earlier transactions back in: that double-counts prior activity.
        const signedAmount = (tx: Transaction) => tx.type === 'debit'
            ? -Math.abs(tx.amount)
            : Math.abs(tx.amount);
        const openingBalancePaise = Math.round(account.balance * 100) - allTransactionsSortedAsc
            .filter(tx => new Date(tx.date) >= fromDate)
            .reduce((total, tx) => total + Math.round(signedAmount(tx) * 100), 0);

        const periodTransactions = accountTransactionsAsc.filter(({ tx }) => {
            const txDate = new Date(tx.date);
            return txDate >= fromDate && txDate <= toDate;
        });

        let runningBalancePaise = openingBalancePaise;
        const transactionsWithRunningBalance = periodTransactions.map(({ tx, index }) => {
            runningBalancePaise += Math.round(signedAmount(tx) * 100);
            return { ...tx, balance: runningBalancePaise / 100, _sourceIndex: index };
        });

        // Display newest statement rows first; ties retain the source PDF order.
        return transactionsWithRunningBalance
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a._sourceIndex - b._sourceIndex)
            .map(({ _sourceIndex, ...tx }) => tx);

    }, [state, from, to]);
    
    const handleDownloadPdf = async () => {
        if (!from || !to || !state) return;
        if (!state.accounts?.[0]) {
            toast({ variant: 'destructive', title: 'No account found', description: 'Add or import an account before generating a statement.' });
            return;
        }
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
            
            const accountDigits = String(state.accounts[0].accountNumber || '').replace(/\D/g, '');
            const lastFour = accountDigits.slice(-4).padStart(4, '0');
            const downloadDate = format(new Date(), 'ddMMyyyy');
            const filename = 'PNBONE_STMT_XX' + lastFour + '_' + downloadDate + '.pdf';

            // Send the PDF through a same-origin attachment response. iOS Safari
            // often ignores the download attribute on blob: URLs, but honors
            // Content-Disposition: attachment on a normal HTTP response.
            const downloadForm = document.createElement('form');
            downloadForm.method = 'POST';
            downloadForm.action = '/api/download-pdf';
            downloadForm.enctype = 'multipart/form-data';
            downloadForm.target = 'pnb-pdf-download-frame';
            downloadForm.style.display = 'none';
            const dataInput = document.createElement('input');
            dataInput.type = 'hidden';
            dataInput.name = 'pdfData';
            dataInput.value = pdfDataUri;
            const nameInput = document.createElement('input');
            nameInput.type = 'hidden';
            nameInput.name = 'filename';
            nameInput.value = filename;
            downloadForm.append(dataInput, nameInput);
            let downloadFrame = document.querySelector<HTMLIFrameElement>('#pnb-pdf-download-frame');
            if (!downloadFrame) {
                downloadFrame = document.createElement('iframe');
                downloadFrame.id = 'pnb-pdf-download-frame';
                downloadFrame.name = 'pnb-pdf-download-frame';
                downloadFrame.style.display = 'none';
                document.body.appendChild(downloadFrame);
            }
            document.body.appendChild(downloadForm);
            downloadForm.submit();
            downloadForm.remove();
            window.setTimeout(() => downloadFrame?.remove(), 120000);
            toast({ title: 'Download started', description: 'Your statement was sent as a downloadable PDF attachment.' });
        } catch (error) {
            console.error("PDF Generation/Download Error:", error);
            toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate or download PDF.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    
    if (!state) return null; // Or a loading state
    if (!state.accounts?.[0]) return <div className="p-4 text-center">No account is available. Import a valid app backup or add an account before generating a statement.</div>;
    if (!from || !to) return <div className="p-4 text-center">Invalid date range provided.</div>

    return (
        <div className="flex flex-col h-screen bg-white">
            <header className="p-3 bg-primary text-primary-foreground flex items-center justify-between sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-accent hover:bg-white/10">
                    <ArrowLeft className="h-6 w-6"/>
                </Button>
                <h1 className="text-xl font-semibold">Statement</h1>
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="size-12 h-12 w-12 min-h-12 min-w-12 shrink-0 text-accent hover:bg-white/10">
                        <Home className="!h-7 !w-7" strokeWidth={2.5} />
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
