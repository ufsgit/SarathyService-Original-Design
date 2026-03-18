const pool = require('../config/db');

// Create labour invoice
exports.createLabourInvoice = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const d = req.body;
        
        // Robust invoice number generation
        const [rows] = await conn.query('SELECT MAX(inv_id) as maxId FROM tbl_invoice_labour');
        const nextId = (rows[0].maxId || 0) + 1;

        // Suggested format: CI + YYYYMMDD + nextId
        const today = new Date();
        const ymd = today.getFullYear().toString()
            + String(today.getMonth() + 1).padStart(2, '0')
            + String(today.getDate()).padStart(2, '0');
        const inv_no = d.inv_no || `CI${ymd}${nextId}`;

        const query = `INSERT INTO tbl_invoice_labour (
            inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type,
            inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl,
            inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, 
            inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total,
            insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const values = [
            inv_no, d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '', d.inv_inv_date, 'labour',
            d.inv_job_card_no || '', d.inv_jcard_date, d.inv_repair_typ || '', d.inv_km || d.inv_km_in || '', d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
            d.inv_sale_date || '', d.inv_taxpay || '', d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || '',
            d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
            null, null, 1, 0, 0
        ];

        const [result] = await conn.query(query, values);
        const invId = result.insertId;

        // Insert line items
        if (d.items && d.items.length > 0) {
            for (const item of d.items) {
                await conn.query(
                    `INSERT INTO tbl_invoice_labour_cost (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [invId, item.ic_labour_code || item.lc_lab_code || item.ic_code || '', item.ic_type || item.lc_type || 'labour',
                        item.ic_particular || item.lc_lb_name, item.ic_hsn || item.lc_sacode || '998729',
                        String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
                        String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
                        String(item.ic_sgst_per || 9), String(item.ic_sgst_amt || 0),
                        String(item.ic_cgst_per || 9), String(item.ic_cgst_amt || 0),
                        String(item.ic_total || item.lc_amount || 0), String(item.lc_cess || 0)]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Labour invoice created', id: invId });
    } catch (err) {
        await conn.rollback();
        console.error('Create labour invoice error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        conn.release();
    }
};

// Create insurance invoice
exports.createInsuranceInvoice = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const d = req.body;
        const [rows] = await conn.query('SELECT MAX(inv_id) as maxId FROM tbl_invoice_labour');
        const nextId = (rows[0].maxId || 0) + 1;
        
        const today = new Date();
        const ymd = today.getFullYear().toString()
            + String(today.getMonth() + 1).padStart(2, '0')
            + String(today.getDate()).padStart(2, '0');
        const inv_no = d.inv_no || `CI${ymd}${nextId}`;

        const query = `INSERT INTO tbl_invoice_labour (
            inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type,
            inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl,
            inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, 
            inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total,
            insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const values = [
            inv_no, d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '', d.inv_inv_date, 'insurance',
            d.inv_job_card_no || '', d.inv_jcard_date, d.inv_repair_typ || '', d.inv_km || d.inv_km_in || '', d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
            d.inv_sale_date || '', d.inv_taxpay || '', d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || '',
            d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
            d.inv_insurance_company || d.insurance_id || null, d.inv_surveyor || d.insurance_serveyor || '', 2, 0, 0
        ];

        const [result] = await conn.query(query, values);
        const invId = result.insertId;

        if (d.items && d.items.length > 0) {
            for (const item of d.items) {
                await conn.query(
                    `INSERT INTO tbl_invoice_labour_cost (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [invId, item.ic_labour_code || item.lc_lab_code || item.ic_code || '', item.ic_type || item.lc_type || 'spare',
                        item.ic_particular || item.lc_lb_name, item.ic_hsn || item.lc_sacode || '998729',
                        String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
                        String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
                        String(item.ic_sgst_per || 9), String(item.ic_sgst_amt || 0),
                        String(item.ic_cgst_per || 9), String(item.ic_cgst_amt || 0),
                        String(item.ic_total || item.lc_amount || 0), String(item.lc_cess || 0)]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Insurance invoice created', id: invId });
    } catch (err) {
        await conn.rollback();
        console.error('Create insurance invoice error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        conn.release();
    }
};

// Get labour invoices
exports.getLabourInvoices = async (req, res) => {
    try {
        let query = 'SELECT i.*, b.branch_name FROM tbl_invoice_labour i LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch WHERE i.status = 1';
        const params = [];
        if (req.query.branchId) { query += ' AND i.inv_branch = ?'; params.push(req.query.branchId); }
        query += ' ORDER BY i.inv_id DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get insurance invoices
exports.getInsuranceInvoices = async (req, res) => {
    try {
        let query = 'SELECT i.*, b.branch_name FROM tbl_invoice_labour i LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch WHERE i.status = 2';
        const params = [];
        if (req.query.branchId) { query += ' AND i.inv_branch = ?'; params.push(req.query.branchId); }
        query += ' ORDER BY i.inv_id DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single invoice with items
exports.getInvoice = async (req, res) => {
    try {
        const [invoices] = await pool.query(
            'SELECT i.*, b.branch_name FROM tbl_invoice_labour i LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch WHERE i.inv_id = ?',
            [req.params.id]
        );
        if (invoices.length === 0) return res.status(404).json({ message: 'Not found' });
        const [items] = await pool.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);
        res.json({ invoice: invoices[0], items });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const d = req.body;
        await conn.query(
            'UPDATE tbl_invoice_labour SET inv_disc_total=?, inv_taxtotal=?, inv_sgstotal=?, inv_gsttotal=?, inv_total=? WHERE inv_id=?',
            [d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0, req.params.id]
        );
        // Delete old items and re-insert
        await conn.query('DELETE FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);
        if (d.items && d.items.length > 0) {
            for (const item of d.items) {
                await conn.query(
                    `INSERT INTO tbl_invoice_labour_cost (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [req.params.id, item.ic_labour_code || item.lc_lab_code || item.ic_code || '', item.ic_type || item.lc_type || 'labour',
                    item.ic_particular || item.lc_lb_name, item.ic_hsn || item.lc_sacode || '998729',
                    String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
                    String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
                    String(item.ic_sgst_per || 9), String(item.ic_sgst_amt || 0),
                    String(item.ic_cgst_per || 9), String(item.ic_cgst_amt || 0),
                    String(item.ic_total || item.lc_amount || 0), String(item.lc_cess || 0)]
                );
            }
        }
        await conn.commit();
        res.json({ message: 'Invoice updated' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        conn.release();
    }
};

// Mark invoice as ready
exports.markReady = async (req, res) => {
    try {
        await pool.query('UPDATE tbl_invoice_labour SET ready_status = 1 WHERE inv_id = ?', [req.params.id]);
        res.json({ message: 'Marked as ready' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get ready labour bills
exports.getReadyLabourBills = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_invoice_labour WHERE status = 1 AND ready_status = 1 ORDER BY inv_id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get ready insurance bills
exports.getReadyInsuranceBills = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_invoice_labour WHERE status = 2 AND ready_status = 1 ORDER BY inv_id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get next sequential counter (MAX(inv_id) + 1)
exports.getNextInvoiceNo = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT MAX(inv_id) as maxId FROM tbl_invoice_labour');
        res.json({ nextNo: (rows[0].maxId || 0) + 1 });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get labour names for dropdown
exports.getLabourNames = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT labour_title as l_name, sale_price as l_amount, labour_code as l_code FROM tbl_labour_code ORDER BY labour_title');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Generate PDF
exports.generatePDF = async (req, res) => {
    try {
        const [invoices] = await pool.query(
            'SELECT i.*, b.branch_name, b.branch_address, b.branch_ph FROM tbl_invoice_labour i LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch WHERE i.inv_id = ?',
            [req.params.id]
        );
        if (invoices.length === 0) return res.status(404).json({ message: 'Not found' });
        const [items] = await pool.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);

        const { generateInvoicePDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generateInvoicePDF(invoices[0], items);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=invoice_' + req.params.id + '.pdf');
        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
