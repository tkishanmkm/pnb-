
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/hooks/use-app-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Banknote, Landmark } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { RupeeIcon } from "@/components/rupee-icon";

export default function TransferToBeneficiaryPage() {
    const { state, dispatch } = useAppContext();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    // Use id from URL if it exists and is not 'select', otherwise default to undefined.
    const initialPayeeId = params.id && params.id !== 'select' ? (params.id as string) : undefined;

    const [selectedPayeeId, setSelectedPayeeId] = useState<string | undefined>(initialPayeeId);
    const [amount, setAmount] = useState("");
    const [remarks, setRemarks] = useState("");
    const [transferMode, setTransferMode] = useState("imps");
    const [scheduleTransfer, setScheduleTransfer] = useState(false);

    if (!state) return null;

    const { accounts, payees, user, settings } = state;
    const account = accounts[0];
    const appLogo = settings.appLogo;
    const formattedBalance = formatCurrency(account.balance);
    const selectedPayee = payees.find(p => p.id === selectedPayeeId);

    const handleViewSummary = () => {
        const transferAmount = parseFloat(amount);
        if (!selectedPayeeId) {
            toast({ variant: 'destructive', title: 'No Beneficiary', description: 'Please select a beneficiary to proceed.' });
            return;
        }
        if (isNaN(transferAmount) || transferAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount.' });
            return;
        }
        if (transferAmount > account.balance) {
            toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You do not have enough balance for this transfer.' });
            return;
        }

        dispatch({
            type: 'SET_TRANSFER_DETAILS',
            payload: {
                payeeId: selectedPayeeId,
                amount: transferAmount,
                remarks
            }
        });
        router.push(`/fund-transfer/confirm/${selectedPayeeId}`);
    };


    return (
        <div className="flex flex-col h-screen bg-gray-50">
             <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">Transfer Funds</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-4 space-y-4 pb-24">
                <h2 className="text-sm font-semibold text-gray-700">Transfer Details</h2>
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <Label className="text-xs text-gray-500">Transfer from</Label>
                            <div className="flex items-center gap-3 p-3 border rounded-md mt-1 bg-white">
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 p-1">
                                    <Image src={appLogo} alt="Bank Logo" width={40} height={40} className="rounded-full" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{user.name}</p>
                                    <p className="text-sm text-gray-500">...{account.accountNumber.slice(-4)}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center tracking-tighter">Available Balance: <RupeeIcon className="w-3 h-3 mx-0.5" />{formattedBalance}</p>
                        </div>
                        
                        <div>
                            <Label className="text-xs text-gray-500">Transfer to</Label>
                             <Select value={selectedPayeeId} onValueChange={setSelectedPayeeId}>
                                <SelectTrigger className="w-full mt-1 bg-white">
                                    <SelectValue placeholder="Select Beneficiary" />
                                </SelectTrigger>
                                <SelectContent>
                                    {payees.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100">
                                                    <Landmark className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.bank} ....{p.accountNumber.slice(-4)}</p>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {selectedPayeeId && (
                     <Card>
                        <CardContent className="p-4 space-y-4">
                             <div>
                                <Label htmlFor="amount" className="text-xs text-gray-500 flex items-center gap-2">
                                   <Banknote className="h-4 w-4" /> Amount
                                </Label>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="text-lg h-12 mt-1 bg-white" 
                                />
                            </div>

                             <div>
                                <Label className="text-xs text-gray-500">Transfer Mode</Label>
                                 <RadioGroup value={transferMode} onValueChange={setTransferMode} className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="flex items-center">
                                        <RadioGroupItem value="neft" id="neft" className="peer sr-only" />
                                        <Label htmlFor="neft" className="w-full text-center p-2 rounded-md border text-sm peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white cursor-pointer transition-colors">NEFT</Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="rtgs" id="rtgs" className="peer sr-only" />
                                        <Label htmlFor="rtgs" className="w-full text-center p-2 rounded-md border text-sm peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white cursor-pointer transition-colors">RTGS</Label>
                                    </div>
                                    <div className="flex items-center">
                                        <RadioGroupItem value="imps" id="imps" className="peer sr-only" />
                                        <Label htmlFor="imps" className="w-full text-center p-2 rounded-md border text-sm peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white cursor-pointer transition-colors">IMPS</Label>
                                    </div>
                                </RadioGroup>
                                <p className="text-xs text-gray-500 mt-2 flex items-center tracking-tighter">Max per transaction <RupeeIcon className="w-3 h-3 mx-0.5" />5,00,000, Max per day <RupeeIcon className="w-3 h-3 mx-0.5" />5,00,000</p>
                            </div>

                             <div>
                                <Label htmlFor="remarks" className="text-xs text-gray-500">Remarks (Optional)</Label>
                                <Input 
                                    id="remarks" 
                                    placeholder="e.g., Rent payment" 
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="mt-1 bg-white"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {['Rent', 'Bill Payment', 'Investment', 'Food'].map(remark => (
                                    <Button
                                        key={remark}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full bg-white text-gray-700"
                                        onClick={() => setRemarks(remark)}
                                    >
                                        {remark}
                                    </Button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Schedule transfer</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">No</span>
                                    <Switch
                                        checked={scheduleTransfer}
                                        onCheckedChange={setScheduleTransfer}
                                    />
                                    <span className="text-sm text-gray-600">Yes</span>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                )}
            </main>

            <footer className="p-4 border-t bg-background fixed bottom-0 z-10 w-full max-w-md mx-auto">
                 <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 text-center">
                        By clicking on View Summary I agree to Terms & Conditions
                    </p>
                    <Button 
                        className="w-full" 
                        size="lg" 
                        disabled={!selectedPayeeId || !amount}
                        onClick={handleViewSummary}
                    >
                        View Summary
                    </Button>
                </div>
            </footer>
        </div>
    );
}
