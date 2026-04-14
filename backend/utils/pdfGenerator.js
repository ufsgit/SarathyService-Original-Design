const PDFDocument = require('pdfkit');
const { convertNumberToWords } = require('./numberToWords');
const path = require('path');

const p = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);

function fmt(v, dec) {
    if (v === undefined || v === null || v === '') return '0.00';
    dec = dec == null ? 2 : dec;
    return p(v).toFixed(dec);
}

function fmtDate(d) {
    if (!d) return '';
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return String(d).substring(0, 10);
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = dt.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    } catch (e) { return String(d).substring(0, 10); }
}

/**
 * Generate a Tax Invoice PDF that EXACTLY matches the Sarathy Motors template.
 */
function generateInvoicePDF(inv, items) {
    console.log("generateInvoicePDF",inv);
    return new Promise(function (resolve, reject) {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
            const chunks = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const L = 30;
            const R = 565;
            const W = R - L;
            let y = 20;

            const FONT_REG = 'Times-Roman';
            const FONT_BOLD = 'Times-Bold';
            const COLOR_BLUE = '#003087';

            // ── HEADER SECTION ──────────────────────────────────────────────
            doc.font(FONT_BOLD).fontSize(7).text('Branch Address:', L, y);
            y += 9;
            doc.fontSize(8).text(inv.branch_name || 'SARATHY MOTORS KTR', L, y);
            y += 9;
            doc.font(FONT_REG).fontSize(7).text('Sarathy Bajaj', L, y); y += 8;
            doc.font(FONT_REG).fontSize(7).text('Pulamon Jun.', L, y); y += 8;
            doc.font(FONT_REG).fontSize(7).text('Kottarakkara', L, y); y += 8;
            doc.font(FONT_REG).fontSize(7).text('Kerala [State Code : 32]', L, y); y += 8;
            doc.font(FONT_REG).fontSize(7).text('PH : ' + (inv.branch_ph || '+91-9847986565'), L, y);

            // Logo Section
            const logoX = R - 130;
            const logoY = 15;
            try {
                doc.image(path.join(__dirname, '../assets/images/bajaj1.png'), logoX, logoY, { width: 130 });
            } catch (e) {
                console.error("Logo image not found", e);
            }

            y = 105;
            doc.fillColor('#000').font(FONT_BOLD).fontSize(10.5).text('SARATHY MOTORS', L, y, { width: W, align: 'center' });
            y += 12;
            doc.font(FONT_REG).fontSize(7.5).text('Sarathy Bajaj Pallimukku Kollam Kerala State', L, y, { width: W, align: 'center' });
            y += 8;
            doc.font(FONT_REG).fontSize(7.5).text('Code: 32 Kerala [State Code :32]', L, y, { width: W, align: 'center' });
            y += 15;

            doc.font(FONT_REG).fontSize(7.5).text('GSTIN:', L, y);
            y += 9;
            doc.font(FONT_BOLD).fontSize(10).text(inv.branch_gst || '32ABQFS6676M1ZA', L, y);

            const invType = (inv.status == 1 || inv.inv_type === 'insurance') ? 'Insurance' : 'Labour';
            doc.font(FONT_BOLD).fontSize(15).text('TAX INVOICE (' + invType + ')', L, y - 5, { width: W, align: 'center' });
            y += 25;

            doc.moveTo(L, y).lineTo(R, y).lineWidth(0.8).strokeColor('#000').stroke();
            y += 10;

            // ── INFO SECTION ────────────────────────────────────────────────
            const colMid = L + (W * 0.60);
            const labelW = 92;
            const valW1 = (colMid - L) - labelW - 5;
            const labelW2 = 98;
            const valW2 = (R - colMid) - labelW2 - 5;

            function drawField(lbl, val, x, yy, lW, vW, boldLbl = true) {
                if (boldLbl) doc.font(FONT_BOLD); else doc.font(FONT_REG);
                doc.fontSize(7.5).text(lbl, x, yy, { width: lW });
                if (lbl) {
                    doc.font(FONT_REG).text(':', x + lW - 8, yy);
                    doc.font(FONT_REG).text(val || '', x + lW, yy, { width: vW });
                } else {
                    doc.font(FONT_REG).text(val || '', x + lW, yy, { width: vW });
                }
            }

            const leftFields = [
                ['Invoice No.', inv.inv_no],
                ['Invoice Date', fmtDate(inv.inv_inv_date)],
                ['Billed TO', inv.inv_cus],
                ['', 'Mobile : ' + (inv.inv_pho || ''), false],
                ['', inv.inv_cus_addres || 'BOUGAIN VILLA', false],
                ['', '', false],
                ['', 'Kerala[State Code :32] INDIA', false],
                ['', '', false],
                ['Customer GSTIN', (inv.inv_cus_gstin || '')],
                ['Mobile No.', inv.inv_pho],
                ['Delivery Address', (inv.inv_cus_addres || '')],
                ['Advisor Name', inv.inv_advisername],
                ['Mechanic Name', inv.inv_mechna],
                ['Sale Date', fmtDate(inv.inv_sale_date)]
            ];

            const rightFields = [
                ['Invoice Type', inv.inv_type || 'Cash'],
                ['Jobcard No.', inv.inv_job_card_no],
                ['Jobcard Date', fmtDate(inv.inv_jcard_date)],
                ['Whether Tax', inv.status == 2 ? 'Yes' : 'No'],
                ['Payable on', ''],
                ['reverse Charges', 'No'],
                ['Repair Type', inv.inv_repair_typ || 'Paid service'],
                ['KM Reading', inv.inv_km],
                ['Registration No.', inv.in_registr || ''],
                ['Chassis No.', inv.inv_chassis],
                ['Engine No.', inv.in_engine],
                ['Model Name', inv.inv_modl]
            ];

            let rowY = y;
            leftFields.forEach(f => {
                const boldLbl = f[2] !== false;
                doc.fontSize(7.5);
                const lblH = doc.font(boldLbl ? FONT_BOLD : FONT_REG).heightOfString(String(f[0] || ''), { width: labelW });
                const valH = doc.font(FONT_REG).heightOfString(String(f[1] || ''), { width: valW1 });
                let dy = Math.max(lblH, valH);
                if (dy < 9) dy = 9;

                drawField(f[0], f[1], L, rowY, labelW, valW1, boldLbl);
                rowY += dy + 1.5;
            });
            let rY = y;
            rightFields.forEach(f => {
                let dy = 9;
                if (f[0] === 'reverse Charges' || f[0] === 'Payable on') {
                    doc.font(FONT_BOLD).fontSize(7.5).text(f[0], colMid, rY);
                } else {
                    doc.fontSize(7.5);
                    const lblH = doc.font(FONT_BOLD).heightOfString(String(f[0] || ''), { width: labelW2 });
                    const valH = doc.font(FONT_REG).heightOfString(String(f[1] || ''), { width: valW2 });
                    dy = Math.max(lblH, valH);
                    if (dy < 9) dy = 9;
                    drawField(f[0], f[1], colMid, rY, labelW2, valW2);
                }
                rY += dy + 4;
                if (f[0] === 'reverse Charges') {
                    rY += 5; // Extra gap
                }
            });

            y = Math.max(rowY, rY) + 5;
            doc.moveTo(L, y).lineTo(R, y).lineWidth(1).stroke();
            y += 8;

            // ── TABLE ────────────────────────────────────────────────────────
            const cols = [
                { h: 'S. No.', w: 20, a: 'center' },
                { h: 'LABOUR\nCODE', w: 45, a: 'center' },
                { h: 'LABOUR NAME /\nSAC CODE', w: 120, a: 'left' },
                { h: 'RATE', w: 45, a: 'center' },
                { h: 'DISC', w: 35, a: 'center' },
                { h: 'TAXABL\nE\nAMOUNT', w: 50, a: 'center' },
                { h: 'SGST/U\nTGST(%)', w: 35, a: 'center' },
                { h: 'SGST/\nUTGST', w: 45, a: 'center' },
                { h: 'CGST(%)', w: 35, a: 'center' },
                { h: 'CGST', w: 35, a: 'center' },
                { h: 'KFC(1%)', w: 30, a: 'center' },
                { h: 'AMOUNT', w: 40, a: 'center' }
            ];

            const headerH = 32;
            const startY = y;

            // Draw Header
            doc.rect(L, y, W, headerH).stroke();
            doc.font(FONT_BOLD).fontSize(6).fillColor('#000');
            let cx = L;
            cols.forEach((c) => {
                doc.text(c.h, cx + 2, y + 4, { width: c.w - 4, align: c.a });
                cx += c.w;
            });
            y += headerH;

            let tDisc = 0, tTax = 0, tSgst = 0, tCgst = 0, tKfc = 0, tAmt = 0;
            doc.font(FONT_REG).fontSize(7.5);

            // Draw Item Rows
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

                let rowH = 18;
                const name = (item.lc_lb_name || '') + (item.lc_sacode ? '/' + item.lc_sacode : '');
                if (name.length > 35) rowH = 26;

                doc.rect(L, y, W, rowH).stroke();
                cx = L;
                const data = [
                    idx + 1,
                    item.lc_lab_code || '',
                    name,
                    fmt(item.lc_rate, 0),
                    fmt(disc, 2),
                    fmt(taxable, 2),
                    fmt(item.lc_sgst_p, 0),
                    fmt(sgstA, 2),
                    fmt(item.lc_cgst_p, 0),
                    fmt(cgstA, 2),
                    fmt(kfc, 2),
                    fmt(amount, 2)
                ];

                const alignments = ['center', 'center', 'left', 'right', 'right', 'right', 'center', 'right', 'center', 'right', 'right', 'right'];

                data.forEach((val, i) => {
                    doc.text(String(val || ''), cx + 2, y + 5, { width: cols[i].w - 4, align: alignments[i] });
                    cx += cols[i].w;
                });
                y += rowH;
            });

            // TOTAL row (inside table)
            const footerH = 18;
            doc.rect(L, y, W, footerH).stroke();
            doc.font(FONT_BOLD).fontSize(7.5);
            // Place 'TOTAL' under Name column
            doc.text('TOTAL', L + 20 + 45, y + 5, { width: 120, align: 'right' });

            cx = L + 20 + 45 + 120 + 45; // Start of DISC
            const fTot = [fmt(tDisc, 2), fmt(tTax, 2), '', fmt(tSgst, 2), '', fmt(tCgst, 2), fmt(tKfc, 2), fmt(tAmt, 2)];
            let ti = 4;
            fTot.forEach(v => {
                if (v !== '') doc.text(v, cx + 2, y + 5, { width: cols[ti].w - 4, align: 'right' });
                cx += cols[ti].w;
                ti++;
            });

            // Vertical lines for the whole table (header, rows, total)
            const endY = y + footerH;
            cx = L;
            cols.forEach((c, i) => {
                if (i > 0) {
                    doc.moveTo(cx, startY).lineTo(cx, endY).lineWidth(0.5).stroke();
                }
                cx += c.w;
            });
            y = endY;

            // Summary (Round Off / Total Amount)
            // Starts after Rate + Disc
            const sumStart = L + cols[0].w + cols[1].w + cols[2].w + cols[3].w + cols[4].w;
            const sW = R - sumStart;

            const summaryRow = (lbl, val) => {
                doc.rect(sumStart, y, sW, 14).stroke();
                doc.font(FONT_BOLD).fontSize(7.5).text(lbl, sumStart + 5, y + 3);
                doc.font(FONT_REG).text(val, R - 50, y + 3, { width: 45, align: 'right' });
                y += 14;
            };
            let finalTotal = Math.round(tAmt);
            let roundOffAmt = tAmt - finalTotal;

            summaryRow('Round Off', fmt(roundOffAmt, 2));
            summaryRow('Total Amount', fmt(finalTotal, 2));

            y += 10;
            const bH = 26;
            doc.rect(L, y, W, bH).lineWidth(1.2).stroke();
            // Divider for amount in words
            doc.moveTo(L + 140, y).lineTo(L + 140, y + bH).stroke();
            doc.font(FONT_BOLD).fontSize(9).text('AMOUNT IN WORDS', L + 5, y + 8);
            doc.font(FONT_REG).text('RS: ' + convertNumberToWords(finalTotal), L + 145, y + 8);
            y += bH + 8;

            doc.font(FONT_BOLD).fontSize(8.5).text('Tax amount payable on reverse charges (in Rs.) : Nil', L, y);
            y += 35;

            const fY = doc.page.height - 80;
            doc.font(FONT_REG).fontSize(8).text('Sign of Customer Or His Agent', L, fY);
            let nextServiceDateStr = fmtDate(inv.inv_next_service_date);
            if (!nextServiceDateStr || nextServiceDateStr === '02/10/2018' || !inv.inv_next_service_date) {
                let invDate = new Date(inv.inv_inv_date || Date.now());
                if (isNaN(invDate)) invDate = new Date();
                
                const rType = (inv.inv_repair_typ || 'Paid service').toLowerCase();
                const monthsToAdd = rType.includes('paid') ? 4 : 3;
                invDate.setMonth(invDate.getMonth() + monthsToAdd);
                nextServiceDateStr = fmtDate(invDate);
            }

            doc.font(FONT_BOLD).fontSize(9).fillColor(COLOR_BLUE).text('Get your vehicle serviced at regular intervals.', L, fY - 12, { width: W, align: 'center' });
            doc.fillColor('#000').text('Next due date for service is ' + nextServiceDateStr, L, fY + 2, { width: W, align: 'center' });
            doc.text('Thank You & Happy Riding', L, fY + 14, { width: W, align: 'center' });

            const sWd = 140;
            doc.moveTo(R - sWd, fY).lineTo(R, fY).stroke();
            doc.font(FONT_BOLD).fontSize(8.5).text('SARATHY MOTORS', R - sWd, fY - 12, { width: sWd, align: 'center' });
            doc.font(FONT_REG).fontSize(8).text('Authorised Signatory', R - sWd, fY + 4, { width: sWd, align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateInvoicePDF };
