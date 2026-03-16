const pool = require('../config/db');

// Search vehicle history by registration number
exports.search = async (req, res) => {
    try {
        const { reg_no } = req.body;
        if (!reg_no) return res.status(400).json({ message: 'Registration number required' });

        // Get customer details
        const [customers] = await pool.query('SELECT * FROM customer_details WHERE c_reg_no = ?', [reg_no]);
        const customer = customers.length > 0 ? customers[0] : null;

        // Get all invoices for this registration
        const [invoices] = await pool.query(
            `SELECT i.*, b.branch_name FROM tbl_invoice_labour i 
       LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
       WHERE i.in_registr = ? ORDER BY i.inv_id DESC`, [reg_no]
        );

        // Attach line items
        for (let inv of invoices) {
            const [items] = await pool.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [inv.inv_id]);
            inv.items = items;
        }

        res.json({ customer, invoices });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Generate vehicle history PDF
exports.generatePDF = async (req, res) => {
    try {
        const reg_no = req.query.reg_no;
        if (!reg_no) return res.status(400).json({ message: 'Registration number required' });

        const [customers] = await pool.query('SELECT * FROM customer_details WHERE c_reg_no = ?', [reg_no]);
        const [invoices] = await pool.query(
            'SELECT * FROM tbl_invoice_labour WHERE in_registr = ? ORDER BY inv_id DESC', [reg_no]
        );

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=vehicle_history_${reg_no}.pdf`);
            res.send(pdfData);
        });

        doc.fontSize(18).text('Vehicle Service History', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Registration: ${reg_no}`);
        if (customers.length > 0) {
            doc.text(`Customer: ${customers[0].c_name}`);
            doc.text(`Model: ${customers[0].model_name || 'N/A'}`);
        }
        doc.moveDown();

        invoices.forEach((inv, idx) => {
            doc.fontSize(11).text(`${idx + 1}. JC# ${inv.inv_job_card_no || 'N/A'} | Date: ${inv.inv_jcard_date || 'N/A'} | Amount: Rs.${inv.inv_total || 0}`);
        });

        doc.end();
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
