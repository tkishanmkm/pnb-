
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, UserCircle, Landmark } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-right break-all">{value || '-'}</span>
    </div>
);

const maskEmail = (email: string) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    const maskedLocal = localPart.length > 2 ? `${localPart.substring(0, 2)}****` : `${localPart}****`;
    return `${maskedLocal}@${domain}`;
};

const maskMobile = (mobile: string) => {
    if (!mobile) return '';
    return mobile.length > 4 ? `******${mobile.slice(-4)}` : mobile;
};

export default function MyAccountPage() {
    const router = useRouter();
    const { state } = useAppContext();
    const { user, accounts } = state;
    const account = accounts[0];

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">My Account</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-4 space-y-4 overflow-y-auto">
                 <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <UserCircle className="h-10 w-10 text-primary"/>
                        <div>
                            <CardTitle className="text-lg">Personal Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <DetailRow label="Full Name" value={user.name} />
                        <DetailRow label="Customer ID" value={account.customerId} />
                        <DetailRow label="Date of Birth" value={user.dob} />
                        <DetailRow label="Mobile Number" value={maskMobile(user.mobileNumber)} />
                        <DetailRow label="Email ID" value={maskEmail(user.email)} />
                        <DetailRow label="Customer Address" value={`${account.customerAddress}, ${account.customerCity}, ${account.customerPin}`} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Landmark className="h-10 w-10 text-primary"/>
                        <div>
                            <CardTitle className="text-lg">Account Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <DetailRow label="Account Type" value={`${account.type} Account`} />
                        <DetailRow label="Account Number" value={account.accountNumber} />
                        <DetailRow label="Account Status" value={account.status} />
                        <DetailRow label="UPI ID" value={account.upiId} />
                        <DetailRow label="IFSC Code" value={account.ifsc} />
                        <DetailRow label="Branch Address" value={`${account.branchAddress}, ${account.branchCity}, ${account.branchPin}`} />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
