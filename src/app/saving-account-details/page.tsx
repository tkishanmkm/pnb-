
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/hooks/use-app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home, Info, ChevronUp, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns";
import type { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { RupeeIcon } from "@/components/rupee-icon";

const BalanceDetailRow = ({ label, value }: { label: string; value: number }) => {
    const { state } = useAppContext();
    return (
        <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600">{label}</span>
                <Info className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="font-semibold text-sm text-gray-800 flex items-center tracking-tighter">
                <RupeeIcon className="w-3.5 h-3.5 mr-0.5" /> {formatCurrency(value)}
            </span>
        </div>
    );
};


const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const isDebit = transaction.type === 'debit';
    const formattedAmount = formatCurrency(Math.abs(transaction.amount));

    return (
        <div className="flex w-full min-w-0 items-start justify-between gap-3 py-2">
            <div className="min-w-0 flex-1">
                <p className="break-words whitespace-normal text-left text-xs font-semibold text-gray-700">{transaction.description}</p>
                <p className="text-xs text-gray-500">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
            </div>
            <p className={`max-w-[42%] shrink-0 whitespace-nowrap text-right text-sm font-bold flex items-center justify-end tracking-tighter ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                {isDebit ? '-' : '+'} <RupeeIcon className="w-3 h-3 mx-0.5" />{formattedAmount}
            </p>
        </div>
    );
};


export default function SavingAccountDetailsPage() {
    const { state } = useAppContext();
    const router = useRouter();
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState("2026-Q3");

    if (!state) return null;

    const account = state.accounts[0];
    const { transactions, user } = state;
    const formattedBalance = formatCurrency(account.balance);
    const accountHolderParts = user.name.split(" ");
    const firstName = accountHolderParts[0];
    const lastName = accountHolderParts.slice(1).join(" ");
    
    const automaticQuarterBalance = (() => {
        const [yearText, quarterText] = selectedQuarter.split("-Q");
        const year = Number(yearText);
        const quarter = Number(quarterText);
        const start = new Date(year, (quarter - 1) * 3, 1);
        const end = new Date(year, quarter * 3, 0);
        const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
        const accountTransactions = transactions
            .filter(tx => tx.accountId === account.id && Number.isFinite(new Date(tx.date).getTime()))
            .map(tx => ({ ...tx, day: new Date(tx.date).getFullYear() + "-" + String(new Date(tx.date).getMonth() + 1).padStart(2, "0") + "-" + String(new Date(tx.date).getDate()).padStart(2, "0") }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (accountTransactions.length === 0) return account.balance;
        const startKey = start.getFullYear() + "-" + String(start.getMonth() + 1).padStart(2, "0") + "-" + String(start.getDate()).padStart(2, "0");
        // Reverse transactions from the quarter start onward to infer its opening balance,
        // then replay them day-by-day to calculate a daily-weighted average.
        const signedAmount = (tx: typeof accountTransactions[number]) => tx.type === "credit" ? Math.abs(tx.amount) : -Math.abs(tx.amount);
        let balance = account.balance - accountTransactions.filter(tx => tx.day >= startKey).reduce((sum, tx) => sum + signedAmount(tx), 0);
        let weightedTotal = 0;
        for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
            const dayKey = cursor.getFullYear() + "-" + String(cursor.getMonth() + 1).padStart(2, "0") + "-" + String(cursor.getDate()).padStart(2, "0");
            for (const tx of accountTransactions) if (tx.day === dayKey) balance += signedAmount(tx);
            weightedTotal += balance;
        }
        return Math.round((weightedTotal / dayCount) * 100) / 100;
    })();
    const averageQuarterlyBalance = account.averageQuarterlyBalance !== undefined && account.averageQuarterlyBalance !== null
        ? account.averageQuarterlyBalance
        : automaticQuarterBalance;

    const last10Transactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">{account.type} Account</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-2 space-y-2 overflow-y-auto pb-24">
                <Card className="bg-primary text-primary-foreground rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full z-0"></div>
                     <CardContent className="p-3 space-y-1 z-10 relative">
                        <div>
                            <p className="text-base font-bold tracking-wide">{firstName.toUpperCase()}</p>
                            <p className="text-base font-bold tracking-wide">{lastName.toUpperCase()}</p>
                            <p className="text-xs opacity-80 mt-0.5">{account.accountNumber}</p>
                        </div>
                        <div className="pt-1">
                            <p className="text-2xl font-bold flex items-center tracking-tighter"><RupeeIcon className="w-5 h-5 mr-0.5" />{formattedBalance}</p>
                            <p className="text-xs opacity-80">Available Balance</p>
                        </div>
                         <button 
                            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                            className="flex items-center gap-1.5 text-xs text-accent font-semibold pt-1"
                        >
                            {isDetailsVisible ? "Hide Balance Details" : "See Balance Details"}
                            {isDetailsVisible ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>}
                        </button>
                    </CardContent>
                </Card>

                {isDetailsVisible && (
                    <Card className="bg-rose-50/50">
                        <CardContent className="p-3 divide-y">
                            <BalanceDetailRow label="Effective Available Balance" value={account.balance} />
                            <BalanceDetailRow label="Ledger Balance" value={account.balance} />
                            <BalanceDetailRow label="Sweep Balance" value={0} />
                            <BalanceDetailRow label="Float Balance" value={0} />
                            <BalanceDetailRow label="Lien Balance" value={0} />
                            <BalanceDetailRow label="Unclear Amount Balance" value={0} />
                        </CardContent>
                    </Card>
                )}
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-sm text-gray-700">Account Summary</h2>
                            <Info className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                            <SelectTrigger className="w-auto border-none shadow-none text-xs h-8 bg-transparent">
                                <SelectValue placeholder="Select Quarter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2026-Q4">Q4 (Oct-Dec) 2026</SelectItem>
                                <SelectItem value="2026-Q3">Q3 (Jul-Sep) 2026</SelectItem>
                                <SelectItem value="2026-Q2">Q2 (Apr-Jun) 2026</SelectItem>
                                <SelectItem value="2026-Q1">Q1 (Jan-Mar) 2026</SelectItem>
                                <SelectItem value="2025-Q4">Q4 (Oct-Dec) 2025</SelectItem>
                                <SelectItem value="2025-Q3">Q3 (Jul-Sep) 2025</SelectItem>
                                <SelectItem value="2025-Q2">Q2 (Apr-Jun) 2025</SelectItem>
                                <SelectItem value="2025-Q1">Q1 (Jan-Mar) 2025</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Card>
                        <CardContent className="p-3">
                            <p className="font-bold text-base text-gray-800 flex items-center tracking-tighter">
                                <RupeeIcon className="w-4 h-4 mr-0.5" />{formatCurrency(averageQuarterlyBalance)}
                            </p>
                            <p className="text-xs text-gray-500">Average Quarterly Balance</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="px-1 pt-2">
                    <h3 className="text-xs font-bold text-primary tracking-wider">LAST 10 TRANSACTIONS</h3>
                    <div className="divide-y mt-1">
                        {last10Transactions.map((tx, index) => (
                            <TransactionItem key={`${tx.id}-${index}`} transaction={tx} />
                        ))}
                    </div>
                </div>

            </main>

            <footer className="p-4 border-t bg-background fixed bottom-0 z-10 w-full max-w-md mx-auto">
                 <Link href="/account-statement" className="w-full">
                    <Button className="w-full" size="lg">Get Statement</Button>
                 </Link>
            </footer>
        </div>
    );
}
