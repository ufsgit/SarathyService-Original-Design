const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateSpecificBill() {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const outputPath = path.join(__dirname, 'Specific_Bill_GHQ-2026-01.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header - BILL
    doc.fontSize(18).font('Helvetica-Bold').text('BILL', { align: 'center' });
    doc.moveDown(1.5);

    // Date on top right (as seen in image handwritten, but let's make it part of printed if needed, 
    // actually image has 12/3/26 handwritten at top right)
    
    // From Details
    doc.fontSize(11).font('Helvetica-Bold').text('From:');
    doc.font('Helvetica').text('Mohammed Ashik N');
    doc.text('Mob: 8921338811');
    doc.text('Date: 02/03/26');
    doc.text('Bill No: GHQ-2026-01');
    doc.moveDown();

    // To Details
    doc.font('Helvetica-Bold').text('To:');
    doc.font('Helvetica').text('The Superintendent');
    doc.text('General Hospital');
    doc.text('Alappuzha');
    doc.moveDown();

    // Subject
    doc.font('Helvetica-Bold').text('Subject: ', { continued: true }).font('Helvetica').text('Bill for Closing 2 Windows');
    doc.moveDown();

    // Body
    doc.text('We are pleased to submit our bill for the work of closing 2 windows at General Hospital, Alappuzha');
    doc.moveDown();

    // Window Size Details
    doc.font('Helvetica-Bold').text('Window Size Details:');
    doc.font('Helvetica').text('1) 200 cm × 170 cm');
    doc.text('2) 150 cm × 180 cm');
    doc.moveDown(2);

    // Table (Positioned towards the right side as in the image)
    const tableX = 300;
    const amountX = 450;
    let currentY = doc.y;

    doc.font('Helvetica-Bold');
    doc.text('Description', tableX, currentY);
    doc.text('Amount (₹)', amountX, currentY, { align: 'right', width: 80 });
    
    currentY += 20;
    doc.font('Helvetica');
    
    const rows = [
        ['Material Total', '6,750'],
        ['Labour Charges', '3,600'],
        ['Transport & Tools', '1,700']
    ];

    rows.forEach(row => {
        doc.text(row[0], tableX, currentY);
        doc.text(row[1], amountX, currentY, { align: 'right', width: 80 });
        currentY += 18;
    });

    // Subtotal
    doc.font('Helvetica-Bold').text('Subtotal', tableX, currentY);
    doc.text('12,050', amountX, currentY, { align: 'right', width: 80 });
    currentY += 20;

    // Rounded Total
    doc.text('Rounded Total Amount', tableX, currentY);
    doc.text('12,100', amountX, currentY, { align: 'right', width: 80 });
    
    doc.moveDown(3);
    
    // Footer message
    const footerY = doc.y;
    doc.font('Helvetica-Bold').text('We assure you of our best workmanship and timely completion of the work.', 50, footerY);
    doc.moveDown(2);

    // Sign off
    doc.font('Helvetica').text('Yours faithfully,');
    doc.text('Mohammed Ashik N');
    doc.text('Contact: 8921338811');

    doc.end();

    stream.on('finish', () => {
        console.log(`PDF generated successfully at: ${outputPath}`);
    });
}

generateSpecificBill();
