const PDFDocument = require('pdfkit');
const { convertNumberToWords } = require('./numberToWords');

/**
 * Generate a Tax Invoice PDF
 */
function generateInvoicePDF(invoiceData, lineItems, res) {
    const doc = new PDFDocument({ size: 'A4', margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice_${invoiceData.inv_no || 'draft'}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    // Company info
    doc.fontSize(12).font('Helvetica-Bold').text(invoiceData.branch_name || 'Sarathy Motors');
    doc.fontSize(9).font('Helvetica').text(invoiceData.branch_address || '');
    doc.text(`Phone: ${invoiceData.branch_ph || ''}`);
    doc.text(`GSTIN: ${invoiceData.branch_gst || ''}`);
    doc.moveDown();

    // Invoice details
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Invoice No: ${invoiceData.inv_no || ''}`, 30);
    doc.text(`Invoice Date: ${invoiceData.inv_inv_date || ''}`, 300, doc.y - 14);
    doc.moveDown(0.3);
    doc.text(`Job Card No: ${invoiceData.inv_job_card_no || ''}`, 30);
    doc.text(`Job Card Date: ${invoiceData.inv_jcard_date || ''}`, 300, doc.y - 14);
    doc.moveDown();

    // Customer details
    doc.font('Helvetica');
    doc.text(`Customer: ${invoiceData.inv_cus || ''}`, 30);
    doc.text(`Address: ${invoiceData.inv_cus_addres || ''}`);
    doc.text(`Phone: ${invoiceData.inv_pho || ''}   |   GSTIN: ${invoiceData.inv_cus_gstin || ''}`);
    doc.text(`Registration: ${invoiceData.in_registr || ''}   |   Model: ${invoiceData.inv_modl || ''}`);
    doc.text(`Chassis: ${invoiceData.inv_chassis || ''}   |   Engine: ${invoiceData.in_engine || ''}`);
    doc.text(`KM In: ${invoiceData.inv_km || ''}`);
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    const colWidths = [30, 180, 60, 40, 60, 60, 40, 60];
    const headers = ['SN', 'Particular', 'HSN', 'Qty', 'Rate', 'Amount', 'GST%', 'Total'];

    doc.font('Helvetica-Bold').fontSize(8);
    let xPos = 30;
    headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'center' });
        xPos += colWidths[i] + 5;
    });

    doc.moveTo(30, tableTop + 12).lineTo(565, tableTop + 12).stroke();

    // Table rows
    doc.font('Helvetica').fontSize(8);
    let yPos = tableTop + 18;

    if (lineItems && lineItems.length > 0) {
        lineItems.forEach((item, index) => {
            xPos = 30;
            const gstPer = parseFloat(item.lc_sgst_p || 0) + parseFloat(item.lc_cgst_p || 0);
            const row = [
                (index + 1).toString(),
                item.lc_lb_name || '',
                item.lc_sacode || '',
                "1",
                parseFloat(item.lc_rate || 0).toFixed(2),
                parseFloat(item.lc_amount || 0).toFixed(2),
                gstPer.toFixed(0) + '%',
                parseFloat(item.lc_amount || 0).toFixed(2)
            ];

            row.forEach((cell, i) => {
                doc.text(cell, xPos, yPos, { width: colWidths[i], align: i > 2 ? 'right' : 'left' });
                xPos += colWidths[i] + 5;
            });
            yPos += 14;
        });
    }

    doc.moveTo(30, yPos).lineTo(565, yPos).stroke();
    yPos += 10;

    // Totals
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(`Sub Total: ₹${parseFloat(invoiceData.inv_taxtotal || 0).toFixed(2)}`, 400, yPos);
    yPos += 14;
    doc.text(`Discount: ₹${parseFloat(invoiceData.inv_disc_total || 0).toFixed(2)}`, 400, yPos);
    yPos += 14;
    doc.text(`CGST: ₹${parseFloat(invoiceData.inv_gsttotal || 0).toFixed(2)}`, 400, yPos);
    yPos += 14;
    doc.text(`SGST: ₹${parseFloat(invoiceData.inv_sgstotal || 0).toFixed(2)}`, 400, yPos);
    yPos += 18;
    doc.fontSize(11).text(`Grand Total: ₹${parseFloat(invoiceData.inv_total || 0).toFixed(2)}`, 400, yPos);
    yPos += 20;

    // Amount in words
    const amountInWords = convertNumberToWords(parseFloat(invoiceData.inv_total || 0));
    doc.fontSize(9).font('Helvetica').text(`Amount in Words: ${amountInWords}`, 30, yPos);

    doc.end();
}

module.exports = { generateInvoicePDF };
