
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lightbulb, LineChart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { analyzeStatement } from '@/ai/flows/ai-statement-analysis';
import type { AnalyzeStatementOutput } from '@/ai/flows/ai-statement-analysis';

function AnalysisDisplay() {
  const searchParams = useSearchParams();
  const { state } = useAppContext();
  
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const [analysis, setAnalysis] = useState<AnalyzeStatementOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!from || !to) {
        setError("Date range is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      const startDate = parseISO(from);
      const endDate = parseISO(to);
      try {
        const filteredTransactions = state.transactions.filter(tx => {
            const txDate = parseISO(tx.date);
            return txDate >= startDate && txDate <= endDate;
        });
        if (filteredTransactions.length === 0) {
            setAnalysis({ summary: "No transactions found for this period.", insights: "There are no insights to provide as there were no transactions in the selected date range." });
            setIsLoading(false);
            return;
        }
        const result = await analyzeStatement({ transactionHistory: filteredTransactions, startDate: from, endDate: to });
        setAnalysis(result);
      } catch (e) {
        console.error("AI Analysis Error:", e);
        setError("Failed to get analysis from AI. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    if (state.transactions?.length) fetchAnalysis();
  }, [from, to, state.transactions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="p-2 bg-primary/10 rounded-full"><LineChart className="h-6 w-6 text-primary" /></div>
                <CardTitle className="font-headline text-lg">Spending Summary</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-foreground whitespace-pre-wrap">{analysis?.summary}</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="p-2 bg-primary/10 rounded-full"><Lightbulb className="h-6 w-6 text-primary" /></div>
                <CardTitle className="font-headline text-lg">Financial Insights</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-foreground whitespace-pre-wrap">{analysis?.insights}</p></CardContent>
        </Card>
    </div>
  );
}

function AnalysisPageHeader() {
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!from || !to) return null;
    const startDate = parseISO(from);
    const endDate = parseISO(to);

    return (
        <div className="mb-6">
            <h1 className="text-2xl font-bold font-headline">AI Statement Analysis</h1>
            <p className="text-muted-foreground">{format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}</p>
        </div>
    )
}

export default function StatementAnalysisPage() {
    return (
        <div className="p-4">
            <Suspense fallback={
                <div className="mb-6">
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            }>
                <AnalysisPageHeader />
            </Suspense>
            <AnalysisDisplay />
        </div>
    )
}
