
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useAppContext } from '@/hooks/use-app-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Payee, Transaction, CarouselBanner, AppSettings, IconAssets, ChatMessage, AccountDetails, AppState } from '@/lib/types';
import { extractStatementDetailsFromPdf, extractTransactionsFromPdf, type ExtractedStatementDetails } from '@/ai/flows/extract-transactions-from-pdf';
import { Trash2, Edit, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { saveStateToIndexedDB, getStorageEstimate, requestPersistentStorage } from '@/lib/indexeddb';
import { defaultState } from '@/lib/mock-data';

const normalizeImageDataUrls = (value: unknown): unknown => {
    if (typeof value === 'string') {
        const match = value.match(/^data:image\/([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/i);
        if (!match) return value;
        const payload = match[2].replace(/\s/g, '');
        let actualType: string | null = null;
        if (payload.startsWith('iVBORw0KGgo')) actualType = 'png';
        else if (payload.startsWith('/9j/')) actualType = 'jpeg';
        else if (payload.startsWith('R0lGOD')) actualType = 'gif';
        else if (payload.startsWith('UklGR')) actualType = 'webp';
        if (!actualType || match[1].toLowerCase() === actualType) return value;
        return `data:image/${actualType};base64,${payload}`;
    }
    if (Array.isArray(value)) return value.map(normalizeImageDataUrls);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>)
            .map(([key, item]) => [key, normalizeImageDataUrls(item)]));
    }
    return value;
};

const AccountSettings = () => {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    const [user, setUser] = useState(state.user);
    const [account, setAccount] = useState(state.accounts[0]);
    const [settings, setSettings] = useState(state.settings);

    const handleSave = () => {
        dispatch({ type: 'UPDATE_USER', payload: user });
        dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...account, currencySymbol: settings.currencySymbol } });
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        toast({ title: "Success", description: "Account and Security details updated." });
    };

    return (
        <CardContent className="space-y-4">
            <h3 className="font-semibold">User Details</h3>
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={user.name || ''} onChange={e => setUser({...user, name: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="customerId">Customer ID</Label>
                <Input id="customerId" value={user.id || ''} onChange={e => setUser({...user, id: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" value={user.dob || ''} onChange={e => setUser({...user, dob: e.target.value})} placeholder="DD-MM-YYYY"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email ID</Label>
                <Input id="email" type="email" value={user.email || ''} onChange={e => setUser({...user, email: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input id="mobileNumber" value={user.mobileNumber || ''} onChange={e => setUser({...user, mobileNumber: e.target.value})} />
            </div>

            <h3 className="font-semibold pt-4">Security PINs</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="mpin">MPIN (Login)</Label>
                    <Input id="mpin" value={user.mpin || ''} onChange={e => setUser({...user, mpin: e.target.value})} maxLength={4} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tpin">TPIN (Transfer)</Label>
                    <Input id="tpin" value={user.tpin || ''} onChange={e => setUser({...user, tpin: e.target.value})} maxLength={4} />
                </div>
            </div>
             
            <h3 className="font-semibold pt-4">Account Details</h3>
             <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={account.accountNumber || ''} onChange={e => setAccount({...account, accountNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select value={account.type} onValueChange={(value: AccountDetails['type']) => setAccount({...account, type: value})}>
                    <SelectTrigger id="accountType">
                        <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Savings">Savings Account</SelectItem>
                        <SelectItem value="Current">Current Account</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="accountStatus">Account Status</Label>
                <Select value={account.status} onValueChange={(value: 'Active' | 'Debit Freeze') => setAccount({...account, status: value})}>
                    <SelectTrigger id="accountStatus">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Debit Freeze">Debit Freeze</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input id="currencySymbol" value={settings.currencySymbol || ''} onChange={e => setSettings({...settings, currencySymbol: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input value={account.accountHolder || ''} onChange={e => setAccount({...account, accountHolder: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input value={account.upiId || ''} onChange={e => setAccount({...account, upiId: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label>Balance</Label>
                <Input type="number" value={account.balance || 0} onChange={e => setAccount({...account, balance: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
                <Label>Average Quarterly Balance</Label>
                <Input type="number" value={account.averageQuarterlyBalance || 0} onChange={e => setAccount({...account, averageQuarterlyBalance: parseFloat(e.target.value) || 0})} />
            </div>
             <div className="space-y-2">
                <Label>Customer Address</Label>
                <Input value={account.customerAddress || ''} onChange={e => setAccount({...account, customerAddress: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label>Customer City</Label>
                <Input value={account.customerCity || ''} onChange={e => setAccount({...account, customerCity: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label>Customer PIN</Label>
                <Input value={account.customerPin || ''} onChange={e => setAccount({...account, customerPin: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label>Branch Name</Label>
                <Input value={account.branchName || ''} onChange={e => setAccount({...account, branchName: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label>Branch Address</Label>
                <Input value={account.branchAddress || ''} onChange={e => setAccount({...account, branchAddress: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label>Branch City</Label>
                <Input value={account.branchCity || ''} onChange={e => setAccount({...account, branchCity: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label>Branch PIN</Label>
                <Input value={account.branchPin || ''} onChange={e => setAccount({...account, branchPin: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input value={account.ifsc || ''} onChange={e => setAccount({...account, ifsc: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label>CKYC Number</Label>
                <Input value={account.ckycNumber || ''} onChange={e => setAccount({...account, ckycNumber: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label>Nominee</Label>
                <Input value={account.nominee || ''} onChange={e => setAccount({...account, nominee: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </CardContent>
    );
};

const TransactionSettings = () => {
    const { state, dispatch } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();
    
    const handleDelete = (id: string) => {
        const currentTransactions = state.transactions;
        const updatedTransactions = currentTransactions.filter(tx => tx.id !== id);
        dispatch({type: 'UPDATE_TRANSACTIONS', payload: updatedTransactions});
    }

    const handleEdit = (id: string) => {
        router.push(`/settings/edit-transaction/${id}`);
    }

    const handleAddTransaction = () => {
        const newTransaction: Omit<Transaction, 'id' | 'accountId'> = {
            date: new Date().toISOString(),
            description: 'New Transaction',
            amount: 0,
            type: 'debit',
            category: 'Misc',
            remarks: '',
            payee: '',
            reference: `TXN${Date.now()}`
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        toast({ title: "New Transaction Added", description: "A blank transaction has been added. Click 'Edit' to modify it." });
    };

    return (
        <CardContent className="space-y-4">
            <Button onClick={handleAddTransaction} className="w-full">Add New Transaction</Button>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {state.transactions.map(tx => (
                    <div key={tx.id} className="p-3 border rounded-md space-y-2 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                             <p className={`font-mono text-sm ${tx.type === 'debit' ? 'text-red-500' : 'text-green-500'}`}>
                                {tx.type === 'debit' ? '-' : '+'}{state.settings.currencySymbol}{Math.abs(tx.amount).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(tx.id)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(tx.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    )
}

const PayeeSettings = () => {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    const [payees, setPayees] = useState<Payee[]>(state.payees);

    const handleAdd = () => {
        const newPayee: Payee = {
            id: `payee-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: "New Payee",
            nickname: "",
            accountNumber: "000000000000",
            bank: "New Bank",
            ifsc: "BANK0000000",
        };
        setPayees(ps => [...ps, newPayee]);
    };

    const handleUpdate = (id: string, field: keyof Payee, value: string) => {
        setPayees(payees.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleDelete = (id: string) => {
        setPayees(payees.filter(p => p.id !== id));
    };

    const handleSave = () => {
        const validPayees = payees.filter(p => p.name && p.accountNumber && p.id);
        if (validPayees.length !== payees.length) {
            toast({
                variant: 'destructive',
                title: 'Invalid Payee Data',
                description: 'Some payees were not saved because they were missing a name or account number.',
            });
        }
        dispatch({type: 'UPDATE_PAYEES', payload: validPayees});
        toast({ title: "Success", description: "Payees updated." });
    };

    return (
        <CardContent className="space-y-4">
            <Button onClick={handleAdd} className="w-full">Add New Payee</Button>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {payees.map(payee => (
                    <div key={payee.id} className="p-2 border rounded-md space-y-2">
                        <Input value={payee.name || ''} onChange={e => handleUpdate(payee.id, 'name', e.target.value)} placeholder="Name"/>
                        <Input value={payee.nickname || ''} onChange={e => handleUpdate(payee.id, 'nickname', e.target.value)} placeholder="Nickname (Optional)"/>
                        <Input value={payee.accountNumber || ''} onChange={e => handleUpdate(payee.id, 'accountNumber', e.target.value)} placeholder="Account Number"/>
                        <Input value={payee.bank || ''} onChange={e => handleUpdate(payee.id, 'bank', e.target.value)} placeholder="Bank"/>
                        <Input value={payee.ifsc || ''} onChange={e => handleUpdate(payee.id, 'ifsc', e.target.value)} placeholder="IFSC Code"/>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(payee.id)}>Delete</Button>
                    </div>
                ))}
            </div>
            <Button onClick={handleSave} className="w-full">Save All Payees</Button>
        </CardContent>
    );
};


const AssetSettings = () => {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    const [banners, setBanners] = useState<CarouselBanner[]>(state.settings.carouselBanners);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                callback(event.target?.result as string);
            };
            reader.onerror = (error) => {
                console.error("FileReader error reading asset file:", error);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSettingsChange = (key: keyof AppSettings, value: string) => {
        dispatch({type: 'UPDATE_SETTINGS', payload: {[key]: value}});
        toast({title: 'Success', description: `${key} updated.`});
    }

    const handleBannerUpdate = (index: number, field: keyof CarouselBanner, value: string) => {
        const newBanners = [...banners];
        newBanners[index] = {...newBanners[index], [field]: value};
        setBanners(newBanners);
    };

    const handleBannerImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e, (dataUrl) => {
            handleBannerUpdate(index, 'src', dataUrl);
        });
    };

    const handleAddBanner = () => {
        setBanners([...banners, {src: 'https://placehold.co/600x300.png', alt: 'New Promotion', hint: 'finance promotion'}]);
    }

    const handleRemoveBanner = (index: number) => {
        setBanners(banners.filter((_, i) => i !== index));
    }

    const saveBanners = () => {
        dispatch({type: 'UPDATE_SETTINGS', payload: {carouselBanners: banners}});
        toast({title: 'Success', description: 'Banners updated.'});
    }

    return (
        <CardContent className="space-y-4">
            <h3 className="font-semibold">App Logo</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('appLogo', dataUrl))} />
            
            <h3 className="font-semibold pt-4">User Avatar</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => dispatch({ type: 'UPDATE_USER', payload: { avatar: dataUrl }}))} />

            <h3 className="font-semibold pt-4">Agent Avatar</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('agentAvatar', dataUrl))} />

            <h3 className="font-semibold pt-4">Login Help Avatar</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('loginHelpAvatar', dataUrl))} />
            
            <h3 className="font-semibold pt-4">OTP Notification Avatar</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('otpAvatar', dataUrl))} />
            
            <h3 className="font-semibold pt-4">PDF Header Banner</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('pdfBanner', dataUrl))} />

            <h3 className="font-semibold pt-4">Splash Screen Logo (PNB ONE)</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('pnbOneLogo', dataUrl))} />

            <h3 className="font-semibold pt-4">Splash Screen Banner (PNB)</h3>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('pnbBanner', dataUrl))} />

            <h3 className="font-semibold pt-4">Statement Last Page PDF</h3>
            <Input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, (dataUrl) => handleSettingsChange('lastPagePdfDataUri', dataUrl))} />

            <h3 className="font-semibold pt-4">Carousel Banners</h3>
            <div className="space-y-3">
            {banners.map((banner, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md relative">
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleRemoveBanner(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Label>Banner {index+1}</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleBannerImageChange(index, e)} />
                    <Label>Alt Text</Label>
                    <Input value={banner.alt || ''} onChange={(e) => handleBannerUpdate(index, 'alt', e.target.value)} />
                    <Label>AI Hint</Label>
                    <Input value={banner.hint || ''} onChange={(e) => handleBannerUpdate(index, 'hint', e.target.value)} />
                </div>
            ))}
            </div>
            <div className="flex gap-2 pt-2">
                 <Button onClick={handleAddBanner} variant="outline" className="flex-1">Add Banner</Button>
                <Button onClick={saveBanners} className="flex-1">Save Banners</Button>
            </div>
        </CardContent>
    );
};

const ChatHistorySettings = () => {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    const [history, setHistory] = useState<ChatMessage[]>(state.chatHistory);

    const handleAdd = () => {
        const newMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            sender: 'user',
            content: 'New message',
            timestamp: new Date().toISOString(),
        };
        setHistory(h => [...h, newMsg]);
    };

    const handleUpdate = (id: string, field: keyof ChatMessage, value: string) => {
        setHistory(history.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const handleDelete = (id: string) => {
        setHistory(history.filter(h => h.id !== id));
    };

    const handleSave = () => {
        dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: history });
        toast({ title: "Success", description: "Chat history updated." });
    };

    return (
        <CardContent className="space-y-4">
            <Button onClick={handleAdd} className="w-full">Add Message</Button>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {history.map(msg => (
                    <div key={msg.id} className="p-3 border rounded-md space-y-2">
                        <div className="flex gap-2 items-center">
                            <select
                                value={msg.sender}
                                onChange={(e) => handleUpdate(msg.id, 'sender', e.target.value)}
                                className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="user">User</option>
                                <option value="agent">Agent</option>
                                <option value="system">System</option>
                            </select>
                            <Input
                                type="text"
                                value={msg.timestamp}
                                onChange={(e) => handleUpdate(msg.id, 'timestamp', e.target.value)}
                                placeholder="Timestamp"
                            />
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(msg.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <Textarea
                            value={msg.content}
                            onChange={(e) => handleUpdate(msg.id, 'content', e.target.value)}
                            placeholder="Message content"
                        />
                    </div>
                ))}
            </div>
            <Button onClick={handleSave} className="w-full">Save Chat History</Button>
        </CardContent>
    );
};


const DataManagement = () => {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [storageInfo, setStorageInfo] = useState<{ usage?: number; quota?: number; persistent?: boolean }>({});
    const [settings, setSettings] = useState(state.settings);

    const handleSaveSecurity = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        toast({ title: "Success", description: "Security settings updated." });
    };

    useEffect(() => {
        async function fetchStorageInfo() {
            const estimate = await getStorageEstimate();
            let persistent = false;
            if (navigator.storage && navigator.storage.persisted) {
                persistent = await navigator.storage.persisted();
            }
            setStorageInfo({ ...estimate, persistent });
        }
        fetchStorageInfo();
    }, [state]);

    const handleRequestPersist = async () => {
        const granted = await requestPersistentStorage();
        if (granted) {
            toast({ title: "Persistent Storage", description: "Storage persistence granted by browser." });
        } else {
            toast({ title: "Persistent Storage", description: "Storage persistence was not granted or is not supported." });
        }
        const persistent = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false;
        setStorageInfo(prev => ({ ...prev, persistent }));
    };

    const handleExport = () => {
        try {
            const stateToExport = JSON.parse(JSON.stringify({
                ...state,
                // Never include reusable authentication secrets in a portable backup.
                user: { ...state.user, mpin: '', tpin: '' },
                isAuthenticated: false,
                loginPending: false,
                isLoggingOut: false,
            }));
            const json = JSON.stringify(stateToExport, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pnb-pro-state.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast({ title: "Success", description: "State exported. MPIN and TPIN were excluded for security; set them again after importing the backup." });
        } catch (error) {
            console.error("Export error:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to export state." });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const text = event.target?.result as string;
                    const parsedState: unknown = JSON.parse(text);
                    if (!parsedState || typeof parsedState !== 'object' || Array.isArray(parsedState)) {
                        throw new Error("Invalid JSON structure.");
                    }

                    const normalizedParsedState = normalizeImageDataUrls(parsedState);
                    const source = normalizedParsedState as Partial<AppState> & {
                        carouselBanners?: CarouselBanner[];
                    };
                    if (!source.user || typeof source.user !== 'object') {
                        throw new Error("JSON backup is missing user details.");
                    }
                    if (!Array.isArray(source.accounts) || source.accounts.length === 0) {
                        throw new Error("JSON backup must contain at least one account.");
                    }
                    if (!Array.isArray(source.transactions)) {
                        throw new Error("JSON backup must contain a transactions array.");
                    }

                    const accounts = source.accounts.map((account, index) => {
                        if (!account || typeof account !== 'object') {
                            throw new Error(`Account ${index + 1} is invalid.`);
                        }
                        return {
                            ...account,
                            id: typeof account.id === 'string' && account.id.trim()
                                ? account.id
                                : `imported-account-${index + 1}`,
                            currencySymbol: account.currencySymbol || source.settings?.currencySymbol || defaultState.settings.currencySymbol,
                        };
                    });
                    const accountIds = new Set(accounts.map(account => account.id));
                    if (accountIds.size !== accounts.length) {
                        throw new Error('JSON backup contains duplicate account IDs.');
                    }
                    const fallbackAccountId = accounts[0].id;

                    const transactions = source.transactions.map((transaction, index) => {
                        if (!transaction || typeof transaction !== 'object') {
                            throw new Error(`Transaction ${index + 1} is invalid.`);
                        }
                        const amount = Number(transaction.amount);
                        if (!Number.isFinite(amount)) {
                            throw new Error(`Transaction ${index + 1} has an invalid amount.`);
                        }
                        if (!transaction.date || !Number.isFinite(Date.parse(transaction.date))) {
                            throw new Error(`Transaction ${index + 1} has an invalid date.`);
                        }
                        if (typeof transaction.description !== 'string') {
                            throw new Error(`Transaction ${index + 1} is missing its description.`);
                        }
                        const type = transaction.type === 'credit' || transaction.type === 'debit'
                            ? transaction.type
                            : amount < 0 ? 'debit' : 'credit';
                        return {
                            ...transaction,
                            id: typeof transaction.id === 'string' && transaction.id.trim()
                                ? transaction.id
                                : `imported-transaction-${index + 1}`,
                            accountId: transaction.accountId && accountIds.has(transaction.accountId)
                                ? transaction.accountId
                                : fallbackAccountId,
                            amount: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
                            type,
                        };
                    });

                    const transactionIds = new Set(transactions.map(transaction => transaction.id));
                    if (transactionIds.size !== transactions.length) {
                        throw new Error('JSON backup contains duplicate transaction IDs.');
                    }

                    const importedState: AppState = {
                        ...defaultState,
                        ...source,
                        isAuthenticated: false,
                        isStateInitialized: true,
                        loginPending: false,
                        isLoggingOut: false,
                        user: { ...defaultState.user, ...source.user },
                        accounts,
                        transactions,
                        payees: Array.isArray(source.payees) ? source.payees : [],
                        chatHistory: Array.isArray(source.chatHistory) ? source.chatHistory : [],
                        currentTransfer: source.currentTransfer && typeof source.currentTransfer === 'object'
                            ? source.currentTransfer
                            : {},
                        settings: {
                            ...defaultState.settings,
                            ...(source.settings || {}),
                            iconAssets: {
                                ...defaultState.settings.iconAssets,
                                ...(source.settings?.iconAssets || {}),
                            },
                            carouselBanners: Array.isArray(source.settings?.carouselBanners)
                                ? source.settings.carouselBanners
                                : Array.isArray(source.carouselBanners)
                                    ? source.carouselBanners
                                    : defaultState.settings.carouselBanners,
                        },
                    };

                    // Persist the validated, normalized full app state before reporting success.
                    await saveStateToIndexedDB(importedState);
                    dispatch({ type: 'SET_STATE_FROM_JSON', payload: importedState });
                    toast({
                        title: "Backup imported",
                        description: `Restored ${accounts.length} account(s), ${transactions.length} transaction(s), and app settings. Sign in again to continue.`,
                    });
                    
                    // Update storage estimate
                    const estimate = await getStorageEstimate();
                    setStorageInfo(prev => ({ ...prev, ...estimate }));
                } catch (error: unknown) {
                    console.error("Failed to parse or save imported JSON:", error);
                    const errorName = error instanceof Error ? error.name : '';
                    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
                    const isQuota = errorName === 'QuotaExceededError' || errorCode === 22;
                    toast({ 
                        variant: 'destructive', 
                        title: "Import Error", 
                        description: isQuota ? "Storage quota exceeded. Please free up space." : "Failed to parse JSON file or save to IndexedDB." 
                    });
                }
            };
            reader.onerror = (error) => {
                console.error("FileReader error reading JSON state file:", error);
                toast({ variant: 'destructive', title: "Error", description: "Failed to read JSON file." });
            };
            reader.readAsText(file);
        }
    };

    const handleReset = () => {
        dispatch({ type: 'RESET_STATE' });
        toast({ title: "Success", description: "Application state has been reset to default." });
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes && bytes !== 0) return 'Unknown';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <CardContent className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Application Data &amp; IndexedDB Storage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button onClick={handleExport} className="w-full">Export State to JSON</Button>
                    <Button onClick={handleImportClick} variant="outline" className="w-full">Import &amp; Save State to IndexedDB</Button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                    <Button onClick={handleReset} variant="destructive" className="w-full">Reset to Default State</Button>

                    <div className="bg-muted p-3 rounded-lg text-xs space-y-1.5 mt-4">
                        <p className="font-semibold text-foreground">IndexedDB Storage Status</p>
                        <p className="text-muted-foreground">Approximate Usage: <span className="font-medium text-foreground">{formatBytes(storageInfo.usage)}</span></p>
                        <p className="text-muted-foreground">Approximate Quota: <span className="font-medium text-foreground">{formatBytes(storageInfo.quota)}</span></p>
                        <p className="text-muted-foreground">Persistence Status: <span className="font-medium text-foreground">{storageInfo.persistent ? 'Persistent (Protected)' : 'Standard (Subject to browser clearing)'}</span></p>
                        {!storageInfo.persistent && (
                            <Button size="sm" variant="secondary" onClick={handleRequestPersist} className="mt-2 w-full text-xs">
                                Request Persistent Storage
                            </Button>
                        )}
                        <p className="text-[10px] text-muted-foreground pt-1">Note: Data is securely stored locally in your browser&apos;s IndexedDB. Browser or user actions (like clearing site data) can still remove local data.</p>
                    </div>
                </CardContent>
            </Card>
             <Card className="mt-4">
                <CardHeader>
                    <CardTitle>PDF Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Password-protected PDF export is not available in the current PDF engine. Leave this blank to export statements. If a password was imported from an older backup, clear it before exporting.
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="pdfPassword">PDF Statement Password (unsupported)</Label>
                        <Input
                            id="pdfPassword"
                            type="password"
                            autoComplete="new-password"
                            value={settings.pdfPassword || ''}
                            onChange={(e) => setSettings({ ...settings, pdfPassword: e.target.value })}
                            placeholder="Leave blank"
                        />
                    </div>
                    <Button onClick={handleSaveSecurity} className="w-full">Save Security Settings</Button>
                </CardContent>
            </Card>
        </CardContent>
    );
};

const IconAssetsSettings = () => {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    const [iconAssets, setIconAssets] = useState<IconAssets>(state.settings.iconAssets || {});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof IconAssets) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setIconAssets(prev => ({ ...prev, [key]: dataUrl }));
            };
            reader.onerror = (error) => {
                console.error("FileReader error reading icon asset:", error);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { iconAssets } });
        toast({ title: "Success", description: "Icon assets have been updated." });
    };
    
    const handleRemoveIcon = (key: keyof IconAssets) => {
        const newAssets = { ...iconAssets };
        delete newAssets[key];
        setIconAssets(newAssets);
    };

    const iconFields: { key: keyof IconAssets; label: string }[] = [
        { key: 'mpassbook', label: 'mPassbook Icon (Popular)' },
        { key: 'otherBank', label: 'Other Bank Icon (Popular)' },
        { key: 'creditCard', label: 'Credit Card Icon (Popular)' },
        { key: 'pnbShoppe', label: 'PNB Shoppe Icon (Popular)' },
        { key: 'digiHome', label: 'Digi Home Icon (Popular)' },
        { key: 'fundTransfer', label: 'Fund Transfer Icon' },
        { key: 'upi', label: 'UPI Icon' },
        { key: 'approveToPay', label: 'Approve to Pay Icon' },
        { key: 'billPay', label: 'Bill Pay Icon' },
        { key: 'payToContact', label: 'Pay To Contact Icon' },
        { key: 'manageBeneficiary', label: 'Manage Beneficiary Icon' },
        { key: 'payCreditCard', label: 'Pay Credit Card Icon' },
        { key: 'cardlessCash', label: 'Cardless Cash Icon' },
        { key: 'msmeLoan', label: 'MSME Loan Icon' },
        { key: 'krishiRin', label: 'Krishi Rin Icon' },
        { key: 'digitalKcc', label: 'Digital KCC Icon' },
        { key: 'eMudra', label: 'E Mudra Icon' },
        { key: 'services', label: 'Services Icon (Bottom Nav)' },
        { key: 'myRewards', label: 'My Rewards Icon (Bottom Nav)' },
        { key: 'scan', label: 'Scan Icon (Bottom Nav)' },
        { key: 'offers', label: 'Offers Icon (Bottom Nav)' },
        { key: 'emergency', label: 'Emergency Icon (Bottom Nav)' },
    ];

    return (
        <CardContent className="space-y-4">
            <CardDescription>
                Upload an image for an icon to override the default. Remove the content to revert to the default icon.
            </CardDescription>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {iconFields.map(({ key, label }) => (
                    <div key={key} className="space-y-1 border p-3 rounded-md">
                        <Label htmlFor={key}>{label}</Label>
                        {iconAssets[key] && (
                             <div className="flex items-center gap-2">
                                <img src={iconAssets[key]} alt={`${label} preview`} className="w-8 h-8 object-contain border rounded-md" />
                                <Button size="sm" variant="destructive" onClick={() => handleRemoveIcon(key)}>Remove</Button>
                            </div>
                        )}
                        <Input
                            id={key}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, key)}
                            className="text-xs"
                        />
                    </div>
                ))}
            </div>
            <Button onClick={handleSave} className="w-full">Save Icon Assets</Button>
        </CardContent>
    );
};

const PdfExtraction = () => {
    const { state, dispatch } = useAppContext();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [previewData, setPreviewData] = useState<Transaction[]>([]);
    const [statementAccountNumber, setStatementAccountNumber] = useState<string | null>(null);
    const [matchedAccountId, setMatchedAccountId] = useState<string | null>(null);
    const [statementDetails, setStatementDetails] = useState<ExtractedStatementDetails | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const normalizeAccountNumber = (value: string | null | undefined) => (value || '').replace(/\D/g, '');
    const findMatchingAccountId = (accountNumber: string | null | undefined) => {
        const normalized = normalizeAccountNumber(accountNumber);
        if (!normalized) return null;
        return state.accounts.find(account => normalizeAccountNumber(account.accountNumber) === normalized)?.id || null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreviewData([]);
            setStatementAccountNumber(null);
            setMatchedAccountId(null);
            setStatementDetails(null);
        }
    };

    const handleExtract = async () => {
        if (!file) return;
        setIsExtracting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const dataUri = event.target?.result as string;
                    const [details, results] = await Promise.all([
                        extractStatementDetailsFromPdf(dataUri),
                        extractTransactionsFromPdf(dataUri),
                    ]);
                    const accountNumber = details.accountNumber;
                    const destinationAccountId = findMatchingAccountId(accountNumber);
                    setStatementDetails(details);
                    // Match existing transactions one-for-one so repeated legitimate payments are preserved.
                    const alreadyMatched = new Set<number>();
                    const uniqueResults = results.filter(newTx => {
                        if (!destinationAccountId) return true;
                        const matchIndex = state.transactions.findIndex((existingTx, index) => {
                            if (alreadyMatched.has(index) || existingTx.accountId !== destinationAccountId) return false;
                            const sameReference = Boolean(existingTx.reference && newTx.reference) &&
                                existingTx.reference?.trim().toLowerCase() === newTx.reference?.trim().toLowerCase();
                            const sameDetails = existingTx.date.slice(0, 10) === newTx.date.slice(0, 10) &&
                                Math.abs(existingTx.amount) === Math.abs(newTx.amount) &&
                                existingTx.description.trim().toLowerCase() === newTx.description.trim().toLowerCase();
                            return sameReference || sameDetails;
                        });
                        if (matchIndex >= 0) {
                            alreadyMatched.add(matchIndex);
                            return false;
                        }
                        return true;
                    }).map(transaction => ({ ...transaction, accountId: destinationAccountId || 'unmatched' }));
                    setStatementAccountNumber(accountNumber);
                    setMatchedAccountId(destinationAccountId);
                    setPreviewData(uniqueResults);
                    setIsExtracting(false);
                    toast({
                        title: "Extraction Complete",
                        description: accountNumber
                            ? destinationAccountId
                                ? `Found ${results.length} transactions; ${uniqueResults.length} are new for the matching account.`
                                : "Transactions extracted, but this statement does not match any saved account. Saving is blocked to prevent mixing accounts."
                            : "Transactions extracted, but the statement account number could not be verified. Saving is blocked.",
                    });
                } catch (error) {
                    console.error("Failed to extract transactions from PDF:", error);
                    setIsExtracting(false);
                    toast({ variant: 'destructive', title: "Error", description: "Failed to extract transactions." });
                }
            };
            reader.onerror = () => {
                setIsExtracting(false);
                toast({ variant: 'destructive', title: 'File read failed', description: 'Safari could not read this PDF. Try saving it to Files and selecting it again.' });
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Failed to start extracting transactions:", error);
            setIsExtracting(false);
        }
    };

    const handleSavePreview = async () => {
        if (!statementAccountNumber) {
            toast({ variant: 'destructive', title: 'Account number not found', description: 'This PDF does not expose an account number, so a safe account record cannot be created.' });
            return;
        }
        const existingAccount = state.accounts.find(account => normalizeAccountNumber(account.accountNumber) === normalizeAccountNumber(statementAccountNumber));
        const destinationAccountId = existingAccount?.id || ('statement-' + normalizeAccountNumber(statementAccountNumber));
        const template = existingAccount || state.accounts[0];
        if (!template) {
            toast({ variant: 'destructive', title: 'Cannot save statement', description: 'No account template is available.' });
            return;
        }
        const details = statementDetails;
        const destinationAccount: AccountDetails = existingAccount || {
            ...template, id: destinationAccountId, userId: state.user.id || destinationAccountId,
            accountNumber: statementAccountNumber, type: details?.accountType || 'Savings',
            balance: details?.closingBalance ?? 0, accountHolder: details?.accountHolder || '',
            customerAddress: details?.customerAddress || '', customerCity: details?.customerCity || '',
            customerPin: details?.customerPin || '', branchName: details?.branchName || '',
            branchAddress: details?.branchAddress || '', branchCity: details?.branchCity || '',
            branchPin: details?.branchPin || '', ifsc: details?.ifsc || '', ckycNumber: '', nominee: '',
            currencySymbol: template.currencySymbol || state.settings.currencySymbol,
        };
        const transactions = previewData.map((tx, index) => ({
            ...tx, id: destinationAccountId + '-' + (tx.id || index) + '-' + index, accountId: destinationAccountId,
        }));
        if (!existingAccount) dispatch({ type: 'ADD_ACCOUNT', payload: destinationAccount });
        else if (details?.closingBalance !== null && details?.closingBalance !== undefined) {
            dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...existingAccount, balance: details.closingBalance } });
        }
        dispatch({ type: 'UPDATE_TRANSACTIONS', payload: [...transactions, ...state.transactions] });
        toast({ title: 'Statement saved', description: transactions.length + ' transactions saved to account ending ' + statementAccountNumber.slice(-4) + (details?.closingBalance !== null && details?.closingBalance !== undefined ? '; closing balance ' + details.closingBalance : '') + '.' });
        setPreviewData([]); setFile(null); setStatementAccountNumber(null); setMatchedAccountId(null); setStatementDetails(null);
    };

    const handleExport = () => {
        const json = JSON.stringify({ accountNumber: statementAccountNumber, transactions: previewData, timestamp: new Date().toISOString() }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pnb-pro-extracted-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (!data || !Array.isArray(data.transactions)) throw new Error("Invalid structure");
                const importedAccountNumber = typeof data.accountNumber === 'string' ? data.accountNumber : null;
                const destinationAccountId = findMatchingAccountId(importedAccountNumber);
                const transactions = data.transactions.map((transaction: unknown, index: number) => {
                    if (!transaction || typeof transaction !== 'object') throw new Error(`Invalid transaction ${index + 1}`);
                    const item = transaction as Partial<Transaction>;
                    const amount = Number(item.amount);
                    if (!item.date || !Number.isFinite(Date.parse(item.date)) || typeof item.description !== 'string' || !Number.isFinite(amount)) {
                        throw new Error(`Invalid transaction ${index + 1}`);
                    }
                    const type = item.type === 'credit' || item.type === 'debit' ? item.type : amount < 0 ? 'debit' : 'credit';
                    return {
                        ...item,
                        id: typeof item.id === 'string' && item.id ? item.id : `imported-pdf-${index + 1}`,
                        amount: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
                        type,
                        accountId: destinationAccountId || 'unmatched',
                    } as Transaction;
                });
                setStatementAccountNumber(importedAccountNumber);
                setMatchedAccountId(destinationAccountId);
                setStatementDetails(null);
                setPreviewData(transactions);
                toast({
                    title: "Import Ready",
                    description: destinationAccountId
                        ? "Extracted transactions match a saved account. Review before saving."
                        : "Preview only: the JSON has no matching saved account number, so saving is blocked.",
                });
            } catch {
                toast({ variant: 'destructive', title: "Import Error", description: "Invalid JSON format." });
            }
        };
        reader.readAsText(file);
    };

    return (
        <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="pdf-upload">Upload PDF Bank Statement</Label>
                <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} />
                <Button onClick={handleExtract} disabled={!file || isExtracting} className="w-full">
                    {isExtracting ? 'Extracting...' : 'Extract Transactions'}
                </Button>
            </div>
            {previewData.length > 0 && (
                <div className="space-y-2 mt-4">
                    <div className="rounded border p-3 text-sm">
                        {statementAccountNumber && matchedAccountId ? (
                            <p>Statement account verified against a saved account. Transactions will be added only to that account.</p>
                        ) : (
                            <p className="text-muted-foreground">This statement will be saved to a separate account record, so its transactions and extracted details stay separate from other customers.</p>
                        )}
                        {statementAccountNumber && <p className="text-muted-foreground mt-1">Statement account ending in {statementAccountNumber.slice(-4)}.</p>}
                        {statementDetails?.accountHolder && <p>Account holder: {statementDetails.accountHolder}</p>}
                        {statementDetails?.customerAddress && <p>Address: {statementDetails.customerAddress}</p>}
                        {statementDetails?.customerPin && <p>PIN code: {statementDetails.customerPin}</p>}
                        {statementDetails?.closingBalance !== null && statementDetails?.closingBalance !== undefined && <p>Closing balance: {statementDetails.closingBalance}</p>}
                    </div>
                    <p className="font-semibold">Preview ({previewData.length} new transactions):</p>
                    <div className="max-h-60 overflow-y-auto border rounded p-2 text-xs">
                        {previewData.map((tx, i) => <div key={i}>{new Date(tx.date).toLocaleDateString()} - {tx.description} - {tx.amount}</div>)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleSavePreview} disabled={!statementAccountNumber}>Save to Store</Button>
                        <Button onClick={handleExport} variant="outline">Export as JSON</Button>
                    </div>
                </div>
            )}
            <div className="border-t pt-4">
                <Button onClick={() => importInputRef.current?.click()} variant="secondary" className="w-full">Import JSON Statement</Button>
                <input type="file" ref={importInputRef} onChange={handleImportJson} className="hidden" accept=".json" />
            </div>
        </CardContent>
    );
};

const SettingsPageContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get('tab') || 'account';

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">Settings</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                <Tabs defaultValue={tab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="data">Data</TabsTrigger>
                        <TabsTrigger value="assets">Assets</TabsTrigger>
                        <TabsTrigger value="ai">AI Tools</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Account &amp; Security</CardTitle></CardHeader>
                            <AccountSettings />
                        </Card>
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Payee Management</CardTitle></CardHeader>
                            <PayeeSettings />
                        </Card>
                    </TabsContent>
                    <TabsContent value="data" className="mt-4">
                        <Card>
                             <CardHeader><CardTitle>Transaction Management</CardTitle></CardHeader>
                            <TransactionSettings />
                        </Card>
                         <Card className="mt-4">
                            <CardHeader><CardTitle>Chat History Management</CardTitle></CardHeader>
                            <ChatHistorySettings />
                        </Card>
                        <Card className="mt-4">
                             <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
                            <DataManagement />
                        </Card>
                    </TabsContent>
                     <TabsContent value="assets" className="mt-4">
                        <Card>
                             <CardHeader>
                                <CardTitle>Image Assets</CardTitle>
                                 <CardDescription>
                                    Upload images for various parts of the application.
                                </CardDescription>
                            </CardHeader>
                            <AssetSettings />
                        </Card>
                         <Card className="mt-4">
                             <CardHeader>
                                <CardTitle>Icon Assets</CardTitle>
                                 <CardDescription>
                                    Provide custom SVG code to override default dashboard and navigation icons.
                                </CardDescription>
                            </CardHeader>
                            <IconAssetsSettings />
                        </Card>
                    </TabsContent>
                    <TabsContent value="ai" className="mt-4">
                        <Card>
                             <CardHeader>
                                <CardTitle>PDF Extraction</CardTitle>
                                <CardDescription>
                                    Extract text from supported PDF statements locally in your browser, preview transactions, and import or export JSON. Scanned PDFs require OCR support, which is not yet available in this version.
                                </CardDescription>
                            </CardHeader>
                            <PdfExtraction />
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading settings...</div>}>
            <SettingsPageContent />
        </Suspense>
    )
}
