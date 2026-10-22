
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Landmark, Users, Repeat, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RupeeIcon } from "@/components/rupee-icon";
import { useAppContext } from "@/hooks/use-app-store";
import { cn } from "@/lib/utils";

const TransferFundsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const QuickTransferIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 4.5l-4-4L7 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 0.5V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 10.5v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const transferOptions = [
    {
        icon: TransferFundsIcon,
        title: "Transfer Funds to Beneficiary",
        description: "Send money to registered beneficiaries",
        href: "/fund-transfer/to-beneficiary/select",
        id: "beneficiary-transfer"
    },
    {
        icon: QuickTransferIcon,
        title: "Quick Fund Transfer",
        description: "Send upto ",
        amount: "10,000",
        descriptionSuffix: " without adding beneficiary",
        href: "#",
        id: "quick-transfer"
    },
    {
        icon: Landmark,
        title: "Transfer Funds to Self",
        description: "Send money to your accounts within PNB",
        href: "#",
        id: "self-transfer"
    },
    {
        icon: Repeat,
        title: "Indo-Nepal Remittance",
        description: "Indo Nepal transfers can be done using this option",
        href: "#",
        id: "indo-nepal"
    },
    {
        icon: Users,
        title: "Manage Beneficiaries",
        description: "View, add, edit, remove beneficiaries",
        href: "/fund-transfer/beneficiary/list",
        id: "manage-beneficiary"
    }
];

export default function FundTransferPage() {
    const router = useRouter();

    const handleOptionClick = (href: string) => {
        router.push(href);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">Fund Transfer</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-2 space-y-2 overflow-y-auto">
                <Card className="shadow-none">
                    <CardContent className="p-0 divide-y">
                        {transferOptions.map((item, index) => {
                            return (
                             <div 
                                key={index} 
                                onClick={() => handleOptionClick(item.href)} 
                                className="block hover:bg-gray-100 transition-colors cursor-pointer"
                             >
                                <div className="flex items-center p-4">
                                    <div className="mr-4 text-primary">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                                        {'amount' in item ? (
                                            <p className="text-xs text-gray-500">
                                                {item.description}
                                                <RupeeIcon className="h-2 w-2 relative -top-px" />
                                                {item.amount}
                                                {item.descriptionSuffix}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500">{item.description}</p>
                                        )}
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                             </div>
                        )})}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
