
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { format, subDays, subMonths, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/hooks/use-app-store";
import { ArrowLeft, Home, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AccountStatementPage() {
  const router = useRouter();
  const { state } = useAppContext();
  const { toast } = useToast();
  const [searchType, setSearchType] = useState("quick");
  const [quickPeriod, setQuickPeriod] = useState("week");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const account = state.accounts[0];

  const handleSearch = () => {
    let from, to;
    
    if (searchType === 'quick') {
      const today = new Date();
      to = format(today, 'yyyy-MM-dd');
      if (quickPeriod === 'week') {
        from = format(subDays(today, 7), 'yyyy-MM-dd');
      } else { // month
        from = format(subMonths(today, 1), 'yyyy-MM-dd');
      }
    } else { // period
      if (!fromDate || !toDate) {
        toast({
          variant: 'destructive',
          title: "Invalid Date Range",
          description: "Please select both a 'From' and 'To' date.",
        });
        return;
      }
      if (fromDate > toDate) {
        toast({
          variant: 'destructive',
          title: "Invalid Date Range",
          description: "'From' date cannot be after 'To' date.",
        });
        return;
      }
      from = format(fromDate, 'yyyy-MM-dd');
      to = format(toDate, 'yyyy-MM-dd');
    }

    if (from && to) {
        router.push(`/statement?from=${from}&to=${to}`);
    }
  };

  const isSearchDisabled = searchType === 'period' && (!fromDate || !toDate);

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
            <button onClick={() => router.back()}>
                <ArrowLeft className="h-6 w-6 text-accent" />
            </button>
            <h1 className="text-xl font-semibold">Account statement</h1>
            <Link href="/dashboard">
                 <Home className="h-6 w-6 text-accent" />
            </Link>
        </header>

      <main className="flex-1 p-4 space-y-6">
        <div>
            <Label className="text-xs text-gray-500">Select account</Label>
             <div className="bg-white p-3 rounded-lg border mt-1">
                <p className="font-semibold text-sm">{account.accountNumber}</p>
                <p className="text-xs text-muted-foreground">{account.type} Account</p>
            </div>
        </div>

        <div className="space-y-4">
            <RadioGroup value={searchType} onValueChange={setSearchType} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="period" id="period" />
                    <Label htmlFor="period" className="font-normal">Transaction Period</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quick" id="quick" />
                    <Label htmlFor="quick" className="font-normal">Quick Search</Label>
                </div>
            </RadioGroup>

            {searchType === 'period' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {fromDate ? format(fromDate, "dd-MM-yyyy") : <span>From Date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus/>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {toDate ? format(toDate, "dd-MM-yyyy") : <span>To Date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus/>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            <RadioGroup value={quickPeriod} onValueChange={setQuickPeriod} className="grid grid-cols-2 gap-4" disabled={searchType === 'period'}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month" className="font-normal">Last Month</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week" className="font-normal">Last Week</Label>
                </div>
            </RadioGroup>
        </div>
      </main>
      
      <footer className="p-4 mt-auto">
          <Button 
            onClick={handleSearch} 
            disabled={isSearchDisabled}
            className="w-full"
            size="lg"
          >
            Search
          </Button>
      </footer>
    </div>
  );
}
