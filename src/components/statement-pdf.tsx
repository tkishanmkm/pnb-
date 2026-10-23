
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { AccountDetails, Transaction } from '@/lib/types';

interface StatementPDFProps {
    account: AccountDetails;
    transactions: (Transaction & { balance: number })[];
    period: { from: Date; to: Date };
    banner: string;
    lastPagePdfDataUri?: string;
    pdfPassword?: string;
}

// This function now returns a Promise that resolves to the PDF as a data URI
const generatePdfDataUri = async (props: StatementPDFProps): Promise<string> => {
    const { account, transactions, period, banner, lastPagePdfDataUri } = props;

    const statementPassword = account.accountNumber.replace(/\s+/g, '');
    if (!statementPassword) throw new Error('Cannot protect the statement because the account number is missing.');
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        encryption: {
            userPassword: statementPassword,
            ownerPassword: statementPassword + '-pnb-owner',
            userPermissions: ['print'],
        },
    });
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    let finalYPos = 0;

    const addHeader = () => {
        if (banner) {
            try {
                const match = banner.match(/data:image\/(.*?);/);
                if (!match || match.length < 2) {
                    throw new Error("Could not determine image type from data URI.");
                }
                const imageType = match[1].toUpperCase();
                doc.addImage(banner, imageType, margin, 5, pageWidth - margin * 2, 25, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding banner image to PDF", e);
            }
        }

        let yPos = 47;
        const detailHeight = 6;
        const valueX = margin + 38;
        const valueWidth = pageWidth - margin - valueX;
        const drawDetailRows = (rows: Array<[string, string]>) => {
            rows.forEach(([label, value]) => {
                doc.text(label, margin, yPos);
                const wrappedValue = doc.splitTextToSize(value || '', valueWidth);
                doc.text(wrappedValue, valueX, yPos);
                yPos += detailHeight * Math.max(1, wrappedValue.length);
            });
        };

        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('Branch Details', margin, yPos);
        yPos += detailHeight * 2;

        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        drawDetailRows([
            ['Branch Name:', account.branchName || ''],
            ['Branch Address:', account.branchAddress || ''],
            ['City:', account.branchCity || ''],
            ['Pin:', account.branchPin || ''],
            ['IFSC Code:', account.ifsc || ''],
            ['MICR Code:', account.micrCode || ''],
        ]);

        yPos += detailHeight * 2;
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('Customer Details:', margin, yPos);
        yPos += detailHeight * 2;

        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        drawDetailRows([
            ['Customer Name:', account.accountHolder || ''],
            ['Customer Address:', account.customerAddress || ''],
            ['City:', account.customerCity || ''],
            ['Pin:', account.customerPin || ''],
            ['Customer ID:', account.customerId || ''],
            ['CKYC Number:', account.ckycNumber || ''],
            ['Nominee:', account.nominee || 'N/A'],
        ]);

        yPos += detailHeight * 2;
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        const summaryLine = 'Statement of Account: ' + account.accountNumber + ' For Period: ' + format(period.from, 'dd/MM/yyyy') + ' to ' + format(period.to, 'dd/MM/yyyy');
        doc.text(summaryLine, margin, yPos);

        finalYPos = yPos + (detailHeight * 2);
    };

    const renderTable = (dataRows: (Transaction & { balance: number })[], startY: number) => {
        const tableColumn = ["Date", "Instrument ID", "Amount", "Type", "Balance", "Remarks"];
        const tableRows = dataRows.map(tx => {
            return [
                format(new Date(tx.date), 'dd/MM/yyyy'),
                tx.instrumentId || '',
                new Intl.NumberFormat('en-IN', { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(tx.amount)),
                tx.type === 'credit' ? 'CR' : 'DR',
                new Intl.NumberFormat('en-IN', { useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tx.balance || 0),
                tx.description || '',
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            startY: startY,
            margin: { top: 30, right: margin, bottom: 30, left: margin },
            styles: {
                lineColor: [0, 0, 0], 
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: [128, 128, 128],
                textColor: [0, 0, 0],
                font: 'times',
                fontStyle: 'bold',
                fontSize: 11,
                cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
                halign: 'center',
            },
            bodyStyles: {
                font: 'times',
                fontStyle: 'bold',
                textColor: [0, 0, 0],
                fontSize: 11,
                cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
                overflow: 'linebreak',
                valign: 'middle',
            },
            // Keep each bank transaction together when remarks wrap across lines.
            rowPageBreak: 'avoid',
            columnStyles: {
                0: { halign: 'center', cellWidth: 22 },
                1: { halign: 'left', cellWidth: 35 },
                2: { halign: 'center', cellWidth: 25 },
                3: { halign: 'center', cellWidth: 15 },
                4: { halign: 'center', cellWidth: 35 },
                5: { halign: 'left', cellWidth: 58 },
            },
            showHead: 'firstPage',
        });
    };
    
    addHeader();
    renderTable([...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), finalYPos);
    
    if (lastPagePdfDataUri) {
        try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('/pdf.worker.min.mjs', window.location.origin).href;
            const base64 = lastPagePdfDataUri.includes(',') ? lastPagePdfDataUri.slice(lastPagePdfDataUri.indexOf(',') + 1) : lastPagePdfDataUri;
            const sourceBytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
            const sourcePdf = await pdfjsLib.getDocument({ data: sourceBytes, useSystemFonts: true }).promise;
            const sourcePage = await sourcePdf.getPage(sourcePdf.numPages);
            const viewport = sourcePage.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas rendering is unavailable.');
            await sourcePage.render({ canvasContext: context, viewport }).promise;
            doc.addPage('a4', 'p');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const ratio = Math.min((pageWidth - margin * 2) / canvas.width, (pageHeight - margin * 2) / canvas.height);
            const imageWidth = canvas.width * ratio;
            const imageHeight = canvas.height * ratio;
            doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', (pageWidth - imageWidth) / 2, (pageHeight - imageHeight) / 2, imageWidth, imageHeight, undefined, 'FAST');
            canvas.width = 0;
            canvas.height = 0;
        } catch (error) {
            console.error('Could not append the configured final PDF page:', error);
            const reason = error instanceof Error ? error.message : String(error);
            throw new Error('Could not add the configured final PDF page: ' + reason + '. In Settings, re-upload an unencrypted, valid PDF file and try again.');
        }
    }
    return doc.output('datauristring');
};


const StatementPDF = {
    generatePdfDataUri,
};

export default StatementPDF;
