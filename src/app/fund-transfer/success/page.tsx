
"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { Check, Share2, Download, Home, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { RupeeIcon } from '@/components/rupee-icon';
import jsPDF from 'jspdf';

import * as numberToWords from 'number-to-words';

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex justify-between items-start py-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="text-right text-xs">{children}</div>
    </div>
);

function TransferSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { state, dispatch } = useAppContext();
    const [displayReferenceId, setDisplayReferenceId] = useState('');
    const [displayRrn, setDisplayRrn] = useState('');
    
    const processedRef = useRef(false);

    const payeeId = searchParams.get('payeeId');
    const amountStr = searchParams.get('amount');
    const remarks = searchParams.get('remarks');
    const transferDateStr = searchParams.get('transferDate');
    
    // Check if we are viewing an existing receipt or processing a new one
    const existingRefId = searchParams.get('referenceId');
    const existingRrn = searchParams.get('rrn');

    useEffect(() => {
        if (existingRefId && existingRrn) {
            // Viewing an existing receipt, just set the state
            setDisplayReferenceId(existingRefId);
            setDisplayRrn(existingRrn);
            processedRef.current = true; // Mark as "processed" to prevent new transaction creation
        } else if (!processedRef.current && state.isAuthenticated && amountStr && payeeId) {
            // Processing a new transaction
            processedRef.current = true;

            const generatedRefId = `TXN${Date.now()}`;
            const generatedRrn = `IMPS/${Math.floor(100000000000 + Math.random() * 900000000000)}`;
            setDisplayReferenceId(generatedRefId);
            setDisplayRrn(generatedRrn);
            
            const amount = parseFloat(amountStr);
            const impsCharge = 11.8;
            const totalAmountDebited = amount + impsCharge;

            const currentAccount = state.accounts[0];
            const updatedAccount = { ...currentAccount, balance: currentAccount.balance - totalAmountDebited };
            dispatch({ type: 'UPDATE_ACCOUNT', payload: updatedAccount });

            const payee = state.payees.find(p => p.id === payeeId);
            const payeeFirstName = payee ? payee.name.split(' ')[0] : '';
            
            const debitTransaction: Transaction = {
                id: generatedRefId,
                accountId: state.accounts[0].id,
                date: new Date().toISOString(),
                description: `IMPS-IN/${generatedRrn.split('/')[1]}/${payee?.accountNumber || ''}/${payeeFirstName}`,
                amount: -amount,
                type: 'debit',
                category: 'Transfer',
                reference: generatedRrn,
                payeeId: payeeId,
                payee: payee?.name || 'Unknown',
                remarks: remarks || '',
            };

            const chargeTransaction: Omit<Transaction, 'id' | 'accountId'> = {
                date: new Date().toISOString(),
                description: `IMPS-CHG/${generatedRrn.split('/')[1]}/${payee?.accountNumber || ''}/${payeeFirstName}`,
                amount: -impsCharge,
                type: 'debit',
                category: 'Bank Charges',
                reference: `CHG/${generatedRrn.split('/')[1]}`,
                remarks: 'IMPS Service Charge',
            };
            
            dispatch({ type: 'ADD_TRANSACTION', payload: debitTransaction });
            dispatch({ type: 'ADD_TRANSACTION', payload: chargeTransaction });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingRefId, existingRrn, state.isAuthenticated, amountStr, payeeId]);
    

    if (!state || !payeeId || !amountStr || !transferDateStr || !displayReferenceId) {
        return <div className="p-4">Loading summary...</div>;
    }

    const { accounts, payees, settings, user } = state;
    const account = accounts[0];
    const payee = payees.find(p => p.id === payeeId);

    if (!payee) {
        return <div className="p-4">Payee not found.</div>;
    }

    const amount = parseFloat(amountStr);
    const amountInWords = numberToWords.toWords(amount).replace(/\b\w/g, (l: string) => l.toUpperCase()) + ' Only';
    const formattedAmountWithCommas = amount.toLocaleString('en-IN', { useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const transferDate = new Date(transferDateStr);
    
    const handleShare = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const rightMargin = pageWidth - 20;

        // 1. Bank Logo from settings
        if (settings.appLogo) {
            try {
                const imageType = settings.appLogo.split(';')[0].split('/')[1].toUpperCase();
                 // Make logo smaller and maintain aspect ratio
                doc.addImage(settings.appLogo, imageType, (pageWidth / 2) - 20, 15, 40, 15, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo to PDF", e);
            }
        }
        
        // 2. Success text
        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.text("Success", pageWidth / 2, 45, { align: "center" });

        // 3. Reference text
        doc.setFontSize(10);
        doc.text(`Transaction with reference id ${displayReferenceId} processed successfully. The RRN for the transaction is: ${displayRrn}`, pageWidth / 2, 55, { align: "center", maxWidth: pageWidth - 40 });
        
        // 4. Dashed line
        doc.setLineDashPattern([2, 2], 0);
        doc.line(20, 65, pageWidth - 20, 65);
        doc.setLineDashPattern([], 0);

        // 5. Transaction Details
        let yPos = 75;
        const leftMargin = 20;

        const addDetailRow = (label: string, value: string, valueOptions: { bold?: boolean; isMultiLine?: boolean } = {}) => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(label, leftMargin, yPos);
            
            doc.setFont("helvetica", valueOptions.bold ? "bold" : "normal");
            const textOptions = { align: 'right' as const, maxWidth: pageWidth - leftMargin - 90 };
            
            if (valueOptions.isMultiLine) {
                 doc.text(value, rightMargin, yPos, textOptions);
                 const textDimensions = doc.getTextDimensions(value, textOptions);
                 yPos += textDimensions.h + 2; // Add padding for multiline
            } else {
                 doc.text(value, rightMargin, yPos, textOptions);
                 yPos += 7;
            }
            doc.setFont("helvetica", "normal"); // Reset font
        };

        const addIconAndText = (text: string, iconSrc: string, iconOptions: {x: number, y: number, w: number, h: number}, textOptions: { bold?: boolean } = {}) => {
            if (iconSrc) {
                try {
                    const imageType = iconSrc.split(';')[0].split('/')[1].toUpperCase();
                    doc.addImage(iconSrc, imageType, iconOptions.x, iconOptions.y, iconOptions.w, iconOptions.h, undefined, 'FAST');
                } catch (e) { console.error("Error adding inline logo", e); }
            }
             doc.setFont("helvetica", textOptions.bold ? "bold" : "normal");
             doc.text(text, rightMargin, yPos, { align: 'right' });
             yPos += 7;
        };
        
        // From Section
        doc.text('From', leftMargin, yPos);
        addIconAndText(
            user.name, 
            settings.appLogo, 
            { x: rightMargin - 45, y: yPos - 5, w: 8, h: 8},
            { bold: true }
        );
        addDetailRow("", `...${account.accountNumber.slice(-4)}`);
        
        // To Section
        yPos += 3;
        doc.text('To', leftMargin, yPos);
        addDetailRow("", payee.name, { bold: true });
        // Standard bank icon (grey box for now)
        doc.setFillColor(200, 200, 200);
        doc.rect(rightMargin - 65, yPos - 5, 5, 5, 'F');
        addDetailRow("", `${payee.accountNumber} (${payee.ifsc})`);
        
        // Amount Section
        yPos += 3;
        doc.text('Amount', leftMargin, yPos);
        addDetailRow("", `₹ ${formattedAmountWithCommas}`, { bold: true });
        addDetailRow("", amountInWords, { isMultiLine: true });
        
        // Remarks
        yPos += 3;
        addDetailRow("Remarks", remarks || '-', { bold: true });
        
        // Transfer Date
        addDetailRow("Transfer date", format(transferDate, 'dd MMM yyyy, h:mm a'), { bold: true });


        doc.save(`Receipt-${displayReferenceId}.pdf`);
    };

    const rrnNumber = displayRrn.split('/')[1] || displayRrn;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
             <header className="flex justify-center py-2">
                {settings.appLogo && (
                    <Image src={settings.appLogo} alt="App Logo" width={100} height={40} className="h-8 w-auto object-contain" data-ai-hint="app logo"/>
                )}
            </header>
            
            <main className="flex-1 flex flex-col items-center text-center px-4">
                <div className="relative mb-[-24px] z-20">
                    <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="h-8 w-8 text-white" strokeWidth={3}/>
                    </div>
                </div>
                
                <Card className="w-full text-left shadow-lg z-10">
                    <CardContent className="p-4">
                        <h1 className="text-lg font-bold text-gray-800 text-center pt-6">Success</h1>
                        <p className="text-[10px] text-gray-500 mt-1 text-center px-4 leading-relaxed">
                            Transaction with reference id {displayReferenceId} processed successfully. The RRN for the transaction is: {rrnNumber}
                        </p>
                        
                        <div className="mt-3 pt-3 border-t border-dashed space-y-0.5">
                           <DetailRow label="From">
                                <div className="flex flex-col items-end">
                                    <p className="font-semibold text-gray-800 uppercase">{user.name}</p>
                                    <div className="flex items-center justify-end gap-2 mt-1">
                                        {settings.appLogo && <Image src={settings.appLogo} width={16} height={16} alt="bank logo" data-ai-hint="pnb one logo" />}
                                        <span className="text-gray-600">...{account.accountNumber.slice(-4)}</span>
                                    </div>
                                </div>
                            </DetailRow>
                            <DetailRow label="To">
                                <div className="flex flex-col items-end">
                                    <p className="font-semibold text-gray-800">{payee.name}</p>
                                     <div className="flex items-center justify-end gap-2 mt-1">
                                        <Landmark className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{payee.accountNumber} ({payee.ifsc})</span>
                                    </div>
                                </div>
                            </DetailRow>
                            <DetailRow label="Amount">
                                 <div className="flex flex-col items-end">
                                    <p className="font-bold text-base text-gray-900 flex items-center justify-end tracking-tighter"><RupeeIcon className="w-3.5 h-3.5 mr-0.5"/>{formatCurrency(amount)}</p>
                                    <p className="text-[10px] text-gray-500 max-w-48 break-words text-right">{amountInWords}</p>
                                </div>
                            </DetailRow>
                             <DetailRow label="Remarks">
                                <span className="font-semibold text-gray-800">{remarks || '-'}</span>
                            </DetailRow>
                             <DetailRow label="Transfer date">
                                <span className="font-semibold text-gray-800">{format(transferDate, 'dd MMM yyyy, h:mm a')}</span>
                            </DetailRow>
                        </div>
                    </CardContent>
                </Card>

                 <div className="flex justify-center w-full mt-4 gap-8 text-primary">
                    <button className="flex flex-col items-center gap-1" onClick={handleShare}>
                        <Share2 className="h-5 w-5"/>
                        <span className="text-xs">Share</span>
                    </button>
                </div>
            </main>
            
            <footer className="w-full p-4 mt-auto">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" onClick={() => router.push('/dashboard')}>
                    Home
                </Button>
            </footer>
        </div>
    )
}

export default function TransferSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TransferSuccess />
        </Suspense>
    );
}
