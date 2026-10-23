
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
    
    const handleShare = async () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 18;
        const right = pageWidth - margin;
        const contentWidth = pageWidth - margin * 2;
        let y = 16;

        // Keep the application logo's true aspect ratio instead of stretching it.
        if (settings.appLogo) {
            try {
                const logoInfo = doc.getImageProperties(settings.appLogo);
                const maxWidth = 42;
                const maxHeight = 18;
                const scale = Math.min(maxWidth / logoInfo.width, maxHeight / logoInfo.height);
                const logoWidth = logoInfo.width * scale;
                const logoHeight = logoInfo.height * scale;
                doc.addImage(settings.appLogo, logoInfo.fileType, (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight, undefined, 'FAST');
                y += logoHeight + 7;
            } catch (error) {
                console.warn('Receipt logo could not be embedded; continuing without logo.', error);
                y += 6;
            }
        } else {
            y += 5;
        }

        doc.setTextColor(25, 65, 112);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(19);
        doc.text('Payment Successful', pageWidth / 2, y, { align: 'center' });
        y += 7;

        doc.setTextColor(90, 98, 108);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const referenceText = `Transaction reference: ${displayReferenceId}\nRRN: ${(displayRrn.split('/')[1] || displayRrn)}`;
        const referenceLines = doc.splitTextToSize(referenceText, contentWidth - 8);
        doc.text(referenceLines, pageWidth / 2, y, { align: 'center' });
        y += referenceLines.length * 4.5 + 5;

        doc.setDrawColor(160, 170, 180);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.line(margin, y, right, y);
        doc.setLineDashPattern([], 0);
        y += 8;

        const addSectionTitle = (title: string) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(25, 65, 112);
            doc.text(title, margin, y);
            y += 5;
        };

        const addRow = (label: string, value: string, bold = false) => {
            const labelWidth = 31;
            const valueWidth = contentWidth - labelWidth;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(100, 106, 114);
            doc.text(label, margin, y);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setTextColor(35, 40, 46);
            const lines = doc.splitTextToSize(value || '-', valueWidth);
            doc.text(lines, right, y, { align: 'right' });
            y += Math.max(6, lines.length * 4.6) + 1.5;
        };

        addSectionTitle('FROM');
        addRow('Account holder', user.name, true);
        addRow('Account number', `•••• ${String(account.accountNumber).slice(-4)}`);

        y += 2;
        addSectionTitle('TO');
        addRow('Payee name', payee.name, true);
        // Standard neutral bank mark drawn as vector geometry for crisp Windows/iOS output.
        const bankIconX = right - 6;
        doc.setDrawColor(120, 130, 142);
        doc.setFillColor(238, 241, 245);
        doc.rect(bankIconX, y - 1.5, 6, 5, 'FD');
        doc.setDrawColor(100, 110, 122);
        doc.line(bankIconX + 0.8, y - 0.3, bankIconX + 5.2, y - 0.3);
        doc.line(bankIconX + 1.2, y + 0.5, bankIconX + 1.2, y + 2.5);
        doc.line(bankIconX + 3, y + 0.5, bankIconX + 3, y + 2.5);
        doc.line(bankIconX + 4.8, y + 0.5, bankIconX + 4.8, y + 2.5);
        doc.line(bankIconX + 0.5, y + 3, bankIconX + 5.5, y + 3);
        addRow('Bank details', `${payee.accountNumber} · ${payee.ifsc}`);

        y += 2;
        doc.setDrawColor(215, 220, 226);
        doc.line(margin, y, right, y);
        y += 7;
        addSectionTitle('TRANSFER DETAILS');

        // Draw a small rupee symbol as a vector mark so it is not lost by jsPDF's
        // built-in Helvetica font on Windows or iOS PDF viewers.
        const amountY = y;
        doc.setDrawColor(25, 65, 112);
        doc.setLineWidth(0.55);
        doc.line(margin + 0.5, amountY - 3.2, margin + 3.7, amountY - 3.2);
        doc.line(margin + 0.5, amountY - 1.7, margin + 3.7, amountY - 1.7);
        doc.line(margin + 1.1, amountY - 4.3, margin + 1.1, amountY - 0.5);
        doc.line(margin + 1.1, amountY - 4.3, margin + 2.4, amountY - 4.3);
        doc.line(margin + 1.1, amountY - 1.7, margin + 3.1, amountY + 1.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(25, 65, 112);
        doc.text(formattedAmountWithCommas, margin + 6, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 106, 114);
        doc.text('Amount', right, y, { align: 'right' });
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 86, 95);
        const wordsLines = doc.splitTextToSize(amountInWords, contentWidth);
        doc.text(wordsLines, margin, y);
        y += wordsLines.length * 4.2 + 4;

        addRow('Remark', remarks || '-', false);
        addRow('Transfer date', format(transferDate, 'dd MMM yyyy, h:mm a'), true);
        addRow('Reference ID', displayReferenceId);
        addRow('RRN', (displayRrn.split('/')[1] || displayRrn));

        const filename = `Receipt-${displayReferenceId}.pdf`;
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

        try {
            if (typeof navigator !== 'undefined' &&
                typeof navigator.share === 'function' &&
                typeof navigator.canShare === 'function' &&
                navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({ files: [pdfFile], title: filename });
                return;
            }
        } catch (error) {
            // User cancellation should not trigger a forced download or an error toast.
            if (error instanceof DOMException && error.name === 'AbortError') return;
            console.warn('Native receipt sharing unavailable; falling back to PDF download.', error);
        }

        doc.save(filename);
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
