const pool = require('../config/db');

// Search vehicle history by registration number
exports.search = async (req, res) => {
    try {
        const { reg_no } = req.body;
        if (!reg_no) return res.status(400).json({ message: 'Registration number required' });

        const [customers] = await pool.query(
            'SELECT * FROM customer_details WHERE c_reg_no = ?', 
            [reg_no]
        );
        const customer = customers.length > 0 ? customers[0] : null;

        const [invoices] = await pool.query(
            `SELECT i.*, b.branch_name, e1.e_first_name as advisor_name, e2.e_first_name as mechanic_name 
             FROM tbl_invoice_labour i 
             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN tbl_employee e1 ON e1.emp_id = i.inv_advisername
             LEFT JOIN tbl_employee e2 ON e2.emp_id = i.inv_mechna
             WHERE i.in_registr = ? ORDER BY i.inv_id ASC`, [reg_no]
        );

        for (let inv of invoices) {
            const [items] = await pool.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [inv.inv_id]);
            inv.items = items;
        }

        res.json({ customer, invoices });
    } catch (err) {
        console.error('Vehicle history search error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Generate vehicle history PDF (Match High-Fidelity Template)
exports.generatePDF = async (req, res) => {
    try {
        const reg_no = req.query.reg_no;
        if (!reg_no) return res.status(400).json({ message: 'Registration number required' });

        const [customers] = await pool.query(
            'SELECT * FROM customer_details WHERE c_reg_no = ?', 
            [reg_no]
        );
        if (customers.length === 0) return res.status(404).json({ message: 'Customer not found' });
        const cus = customers[0];

        const [invoices] = await pool.query(
            `SELECT i.*, b.branch_name, e1.e_first_name as advisor_name, e2.e_first_name as mechanic_name 
             FROM tbl_invoice_labour i 
             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN tbl_employee e1 ON e1.emp_id = i.inv_advisername
             LEFT JOIN tbl_employee e2 ON e2.emp_id = i.inv_mechna
             WHERE i.in_registr = ? ORDER BY i.inv_id ASC`, [reg_no]
        );

        for (let inv of invoices) {
            const [items] = await pool.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [inv.inv_id]);
            inv.items = items;
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=history_${reg_no}.pdf`);
            res.send(Buffer.concat(chunks));
        });

        const L = 30, R = 565, W = R - L; // W = 535
        let y = 30;

        const FONT_REG = 'Helvetica';
        const FONT_BOLD = 'Helvetica-Bold';

        function fmtDate(d) {
            if (!d) return '-';
            const dt = new Date(d);
            if (isNaN(dt)) return String(d).substring(0, 10);
            return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
        }

        // Title
        doc.font(FONT_BOLD).fontSize(16).text('VEHICLE HISTORY', L, y, { width: W, align: 'center' });
        y += 25;
        doc.moveTo(L, y).lineTo(R, y).lineWidth(1).stroke();
        y += 10;

        // Header Table
        doc.font(FONT_REG).fontSize(8);
        const col1 = L, col2 = L + 200;

        const drawHeaderRow = (l1, v1, l2, v2) => {
            doc.font(FONT_REG).text(l1, col1, y, { width: 85 });
            doc.text(':', col1 + 80, y);
            doc.text(v1 || '-', col1 + 85, y);

            doc.text(l2, col2 + 40, y, { width: 85 });
            doc.text(':', col2 + 120, y);
            doc.text(v2 || '-', col2 + 125, y);
            y += 12;
        };

        drawHeaderRow('Selling Dealer', 'SARATHY MOTORS', 'Dealer Code', 'SARATHY MOTORS');
        drawHeaderRow('Customer Name', cus.c_name, 'Address', cus.c_address || 'Kollam');
        drawHeaderRow('Contact No', cus.c_contact_no, 'Model', cus.model_name);
        drawHeaderRow('Chassis No', cus.c_chassis_no, 'Engine No', cus.c_engine_no);
        drawHeaderRow('Date Of Sale', fmtDate(cus.c_sales_date), 'Reg No', cus.c_reg_no);

        y += 5;
        doc.moveTo(L, y).lineTo(R, y).lineWidth(1).stroke();
        y += 15;

        // Visit Loop
        invoices.forEach((inv, idx) => {
            if (y > 650) { doc.addPage(); y = 30; }

            doc.font(FONT_BOLD).fontSize(8).text(`Visit : ${idx + 1}`, L, y);
            doc.text(`JobCard No : ${inv.inv_job_card_no || '-'}`, L + 130, y);
            doc.text(`Invoice No : ${inv.inv_no || '-'}`, R - 150, y);
            y += 12;

            // Visit Table Header (Sum of widths = 535)
            const vCols = [
                { h: 'Date Of Visit', w: 90 },
                { h: 'Kms', w: 70 },
                { h: 'Job Type', w: 100 },
                { h: 'Service Dealer', w: 180 },
                { h: 'Dealer Code', w: 95 }
            ];

            doc.rect(L, y, W, 14).stroke();
            let cx = L;
            vCols.forEach(c => {
                doc.font(FONT_BOLD).fontSize(7).text(c.h, cx + 2, y + 4, { width: c.w - 4, align: 'left' });
                cx += c.w;
                if (cx < R) doc.moveTo(cx, y).lineTo(cx, y + 14).stroke();
            });
            y += 14;

            // Visit Table Body
            doc.rect(L, y, W, 18).stroke();
            cx = L;
            const vData = [fmtDate(inv.inv_jcard_date), inv.inv_km || '-', inv.inv_repair_typ || 'Paid service', inv.branch_name || 'Sarathy Bajaj', '-'];
            vData.forEach((v, i) => {
                doc.font(FONT_REG).fontSize(7).text(String(v), cx + 2, y + 4, { width: vCols[i].w - 4 });
                cx += vCols[i].w;
                if (cx < R) doc.moveTo(cx, y).lineTo(cx, y + 18).stroke();
            });
            y += 25;

            // Services Done
            doc.font(FONT_BOLD).fontSize(9).text('Services Done', L, y);
            y += 12;

            const sCols = [
                { h: 'Service Name', w: 200 },
                { h: 'Job Type', w: 90 },
                { h: 'Taxable Amount', w: 80 },
                { h: 'Discount Amount', w: 80 },
                { h: 'Amount', w: 85 }
            ];

            doc.rect(L, y, W, 14).stroke();
            cx = L;
            sCols.forEach(c => {
                doc.font(FONT_BOLD).fontSize(7).text(c.h, cx + 2, y + 4, { width: c.w - 4 });
                cx += c.w;
                if (cx < R) doc.moveTo(cx, y).lineTo(cx, y + 14).stroke();
            });
            y += 14;

            let visitTaxable = 0, visitDisc = 0, visitTotal = 0;
            (inv.items || []).forEach(item => {
                if (y > 750) { doc.addPage(); y = 30; }
                const rowH = 14;
                doc.rect(L, y, W, rowH).stroke();
                cx = L;
                const amt = parseFloat(item.lc_amount || 0);
                const tax = parseFloat(item.lc_tax_amunt || 0);
                const disc = parseFloat(item.lc_disc || 0);
                visitTaxable += tax; visitDisc += disc; visitTotal += amt;

                const rowData = [item.lc_lb_name || '-', 'P', tax.toFixed(2), disc.toFixed(2), amt.toFixed(2)];
                rowData.forEach((v, i) => {
                    doc.font(FONT_REG).fontSize(7).text(v, cx + 2, y + 4, { width: sCols[i].w - 4, align: i > 1 ? 'right' : 'left' });
                    cx += sCols[i].w;
                    if (cx < R) doc.moveTo(cx, y).lineTo(cx, y + rowH).stroke();
                });
                y += rowH;
            });

            y += 10;
            const drawSum = (lbl, val) => {
                doc.font(FONT_BOLD).text(lbl, L, y, { width: 120 });
                doc.text(':', L + 120, y);
                doc.font(FONT_REG).text(val, L + 130, y);
                y += 12;
            };
            drawSum('Total Taxable Amount', visitTaxable.toFixed(2));
            drawSum('Total Discount Amount', visitDisc.toFixed(2));
            drawSum('Total Bill Amount', visitTotal.toFixed(2));

            y += 10;
            doc.font(FONT_REG).fontSize(8).text(`Supervisor Name : ${inv.advisor_name || '-'}`, L, y);
            doc.text(`Technician Name : ${inv.mechanic_name || '-'}`, col2 + 40, y);
            y += 20;
            doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).stroke();
            y += 20;
        });

        doc.end();
    } catch (err) {
        console.error('Vehicle history PDF generating error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
