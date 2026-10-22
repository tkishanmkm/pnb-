"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "How do I view my account balance?",
        answer: "You can view your balance directly on the home dashboard or by clicking on your account card to see detailed balance information."
    },
    {
        question: "How can I add a new beneficiary for fund transfers?",
        answer: "To add a beneficiary, go to 'Fund Transfer' from the dashboard, select 'Manage Beneficiaries', and click on the 'Add Beneficiary' button. You will need the recipient's name, account number, and IFSC code."
    },
    {
        question: "How do I download my account statement?",
        answer: "Navigate to 'mPassbook' on the dashboard. Select the desired period (Quick Search or Custom Period) and click 'Search'. On the statement page, you can click 'Download PDF' to save the statement to your device."
    },
    {
        question: "Is this application available 24/7?",
        answer: "Yes, PNB eBank services are available 24 hours a day, 7 days a week, allowing you to manage your accounts and transfer funds at your convenience."
    },
    {
        question: "How can I contact customer support?",
        answer: "You can reach us via the 'Contact Us' section. We offer Toll-Free numbers for immediate assistance and a 'Live Chat' feature to talk with an AI-powered agent."
    },
    {
        question: "What is IMPS transfer mode?",
        answer: "IMPS (Immediate Payment Service) is an instant interbank electronic fund transfer service through mobile phones. It is available 24/7 including Sundays and bank holidays."
    },
    {
        question: "Can I manage multiple accounts in this app?",
        answer: "Yes, if you have multiple accounts registered with the same Customer ID, they will all be visible in the 'All Accounts' section and can be accessed via the account carousel on the dashboard."
    }
];

export default function FAQPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-20">
                <button onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6 text-accent" />
                </button>
                <h1 className="text-xl font-semibold">FAQs</h1>
                <Link href="/dashboard">
                     <Home className="h-6 w-6 text-accent" />
                </Link>
            </header>

            <main className="flex-1 p-4 overflow-y-auto bg-white">
                <h2 className="text-lg font-bold mb-4 text-gray-800">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-sm font-semibold text-left">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </main>
        </div>
    );
}
