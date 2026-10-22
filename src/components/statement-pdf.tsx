
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { PDFDocument } from 'pdf-lib';
import type { AccountDetails, Transaction } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

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
    const { account, transactions, period, banner, lastPagePdfDataUri, pdfPassword } = props;

    const doc = new jsPDF('p', 'mm', 'a4');
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

        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('Branch Details', margin, yPos);
        yPos += detailHeight * 2;

        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        const branchDetails = [
            `Branch Name:        ${account.branchName || ''}`,
            `Branch Address:    ${account.branchAddress || ''}`,
            `City:                       ${account.branchCity || ''}`,
            `Pin:                         ${account.branchPin || ''}`,
            `IFSC Code:            ${account.ifsc || ''}`
        ];

        branchDetails.forEach(line => {
            doc.text(line, margin, yPos);
            yPos += detailHeight;
        });
        
        yPos += detailHeight * 3;

        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('Customer Details:', margin, yPos);
        yPos += detailHeight * 2;

        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        const customerDetails = [
            `Customer Name:      ${account.accountHolder || ''}`,
            `Customer Address:  ${account.customerAddress || ''}`,
            `City:                         ${account.customerCity || ''}`,
            `Pin:                           ${account.customerPin || ''}`,
            `CKYC Number:        ${account.ckycNumber || ''}`,
            `Nominee:                  ${account.nominee || 'N/A'}`
        ];

        customerDetails.forEach(line => {
            doc.text(line, margin, yPos);
            yPos += detailHeight;
        });
        
        yPos += detailHeight * 2;

        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        const summaryLine = `Statement of Account: ${account.accountNumber} For Period: ${format(period.from, 'dd/MM/yyyy')} to ${format(period.to, 'dd/MM/yyyy')}`;
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
                cellPadding: { top: 1, right: 2, bottom: 0, left: 2 }, 
            },
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
    renderTable(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), finalYPos);
    
    let finalPdfBytes: Uint8Array = doc.output('arraybuffer');

    if (lastPagePdfDataUri) {
        try {
            const mergedPdf = await PDFDocument.create();
            
            const statementPdfDoc = await PDFDocument.load(finalPdfBytes);
            const statementPages = await mergedPdf.copyPages(statementPdfDoc, statementPdfDoc.getPageIndices());
            statementPages.forEach(page => mergedPdf.addPage(page));

            const lastPagePdfBytes = new Uint8Array(atob(lastPagePdfDataUri.split(',')[1]).split('').map(char => char.charCodeAt(0)));
            const lastPagePdfDoc = await PDFDocument.load(lastPagePdfBytes);
            const lastPages = await mergedPdf.copyPages(lastPagePdfDoc, lastPagePdfDoc.getPageIndices());
            lastPages.forEach(page => mergedPdf.addPage(page));
            
            finalPdfBytes = await mergedPdf.save();

        } catch (e) {
            console.error("Failed to merge PDFs.", e);
            toast({ variant: 'destructive', title: 'Error', description: "Failed to merge statement with final page."});
        }
    }

    const finalPdfDoc = await PDFDocument.load(finalPdfBytes);
    if (pdfPassword) {
        await finalPdfDoc.encrypt({
            userPassword: pdfPassword,
            ownerPassword: pdfPassword,
        });
    }

    return await finalPdfDoc.saveAsBase64({ dataUri: true });
};


const StatementPDF = {
    generatePdfDataUri,
};

export default StatementPDF;
