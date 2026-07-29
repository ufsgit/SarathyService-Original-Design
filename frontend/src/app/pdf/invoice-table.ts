import { Content } from 'pdfmake/interfaces';
import { fmt, p, convertNumberToWords } from './invoice-utils';
import { invoiceLayout, summaryLayout, noBordersLayout } from './invoice-layout';

export function buildTableAndSummary(inv: any, items: any[]): Content[] {
    const content: Content[] = [];

    // S.No(15) + Code(30) + Name(120) + Rate(35) + Disc(25) + Taxable(40) + SGST%(25) + SGST(35) + CGST%(25) + CGST(35) + Amt(62) = 447
    // + 11 cols * 8 padding = 88. Total = 447 + 88 = 535.
    const cols = [
        { h: 'S.\nNo.', w: 15, a: 'center' },
        { h: 'LABOUR\nCODE',   w: 30, a: 'center' },
        { h: 'LABOUR NAME / SAC CODE', w: '*', a: 'left' },
        { h: 'RATE',           w: 35, a: 'center' },
        { h: 'DISC',           w: 25, a: 'center' },
        { h: 'TAXABLE\nAMOUNT', w: 40, a: 'center' },
        { h: 'SGST/\nUTGST(%)', w: 25, a: 'center' },
        { h: 'SGST/\nUTGST',   w: 35, a: 'center' },
        { h: 'CGST\n(%)',       w: 25, a: 'center' },
        { h: 'CGST',           w: 35, a: 'center' },
        { h: 'AMOUNT',         w: 62, a: 'center' }
    ];
    // Total inner width: 15+30+120+35+25+40+25+35+25+35+62 = 447 ✓

    let tDisc = 0, tTax = 0, tSgst = 0, tCgst = 0, tKfc = 0, tAmt = 0;

    const tableBody: any[][] = [];

    // Header Row
    const headerRow = cols.map(c => {
        return { text: c.h, bold: true, fontSize: 6, alignment: c.a, margin: [0, 4, 0, 4] };
    });
    tableBody.push(headerRow);

    // Items
    (items || []).forEach((item, idx) => {
        const disc = p(item.lc_disc);
        const taxable = p(item.lc_tax_amunt);
        const sgstA = p(item.lc_sgst_a);
        const cgstA = p(item.lc_cgst_a);
        const kfc = p(item.lc_cess);
        const amount = p(item.lc_amount);

        tDisc += disc; tTax += taxable;
        tSgst += sgstA; tCgst += cgstA;
        tKfc += kfc; tAmt += amount;

        const name = (item.lc_lb_name || '') + (item.lc_sacode ? '/' + item.lc_sacode : '');
        
        tableBody.push([
            { text: String(idx + 1), alignment: 'center', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: String(item.lc_lab_code || ''), alignment: 'center', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: name, alignment: 'left', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(item.lc_rate, 0), alignment: 'right', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(disc, 2), alignment: 'right', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(taxable, 2), alignment: 'right', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(item.lc_sgst_p, 0), alignment: 'center', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(sgstA, 2), alignment: 'right', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(item.lc_cgst_p, 0), alignment: 'center', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(cgstA, 2), alignment: 'right', fontSize: 7.5, margin: [0, 2, 0, 2] },
            { text: fmt(amount, 2), alignment: 'right', fontSize: 7.5, margin: [0, 2, 0, 2] }
        ]);
    });

    // Total Row
    tableBody.push([
        { text: 'TOTAL', bold: true, fontSize: 7.5, alignment: 'right', colSpan: 3, margin: [0, 2, 0, 2] },
        { text: '' },
        { text: '' },
        { text: '', fontSize: 7.5, margin: [0, 2, 0, 2] }, // Rate
        { text: fmt(tDisc, 2), bold: true, fontSize: 7.5, alignment: 'right', margin: [0, 2, 0, 2] },
        { text: fmt(tTax, 2), bold: true, fontSize: 7.5, alignment: 'right', margin: [0, 2, 0, 2] },
        { text: '', margin: [0, 2, 0, 2] }, // SGST % empty
        { text: fmt(tSgst, 2), bold: true, fontSize: 7.5, alignment: 'right', margin: [0, 2, 0, 2] }, // SGST Amount
        { text: '', margin: [0, 2, 0, 2] }, // CGST % empty
        { text: fmt(tCgst, 2), bold: true, fontSize: 7.5, alignment: 'right', margin: [0, 2, 0, 2] }, // CGST Amount
        { text: fmt(tAmt, 2), bold: true, fontSize: 7.5, alignment: 'right', margin: [0, 2, 0, 2] }
    ]);

    let finalTotal = Math.round(tAmt);
    let roundOffAmt = tAmt - finalTotal;

    content.push({
        table: {
            headerRows: 1,
            widths: cols.map(c => c.w),
            body: tableBody
        },
        layout: invoiceLayout,
        margin: [0, 0, 0, 0]
    });

    // Summary (Round Off & Total)
    content.push({
        table: {
            widths: cols.map(c => c.w),
            body: [
                [
                    { text: '', colSpan: 5, border: [false, false, false, false] },
                    { text: '' }, { text: '' }, { text: '' }, { text: '' },
                    { text: 'Round Off', bold: true, fontSize: 7.5, alignment: 'left', colSpan: 5, margin: [5, 2, 0, 2] },
                    { text: '' }, { text: '' }, { text: '' }, { text: '' },
                    { text: fmt(roundOffAmt, 2), fontSize: 7.5, alignment: 'right', margin: [0, 2, 0, 2] }
                ],
                [
                    { text: '', colSpan: 5, border: [false, false, false, false] },
                    { text: '' }, { text: '' }, { text: '' }, { text: '' },
                    { text: 'Total Amount', bold: true, fontSize: 7.5, alignment: 'left', colSpan: 5, margin: [5, 2, 0, 2] },
                    { text: '' }, { text: '' }, { text: '' }, { text: '' },
                    { text: fmt(finalTotal, 2), fontSize: 7.5, alignment: 'right', margin: [0, 2, 0, 2] }
                ]
            ]
        },
        layout: invoiceLayout,
        margin: [0, -1, 0, 10]
    });

    // Amount in Words
    content.push({
        table: {
            widths: [135, '*'],
            body: [
                [
                    { text: 'AMOUNT IN WORDS', bold: true, fontSize: 9, margin: [5, 8, 0, 8] },
                    { text: 'RS: ' + convertNumberToWords(finalTotal), fontSize: 9.5, margin: [15, 8, 0, 8] }
                ]
            ]
        },
        layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1.2 : 0,
            vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 1.2 : (i === 1 ? 1 : 0),
            paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0
        },
        margin: [0, 0, 0, 8]
    });

    content.push({
        text: 'Tax amount payable on reverse charges (in Rs.) : Nil',
        bold: true,
        fontSize: 8.5,
        margin: [0, 0, 0, 10]
    });

    return content;
}
