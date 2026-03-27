const pool = require('../config/db');
const { generateInvoiceWord } = require('../utils/wordGenerator');

// Create labour invoice
exports.createLabourInvoice = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const d = req.body;

        if (d.inv_no) {
            const [exists] = await conn.query(
                'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ?',
                [d.inv_no, d.inv_no]
            );
            if (exists.length > 0) {
                conn.release();
                return res.status(400).json({ message: 'Invoice number already exists (' + d.inv_no + ')' });
            }
        }

        const query = `INSERT INTO tbl_readyfor_labour (
            inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type,
            inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl,
            inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, 
            inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total,
            insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const values = [
            d.inv_no || '', d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '', d.inv_inv_date, d.inv_type || 'Cash',
            d.inv_job_card_no || '', d.inv_jcard_date, d.inv_repair_typ || '', d.inv_km || d.inv_km_in || '', d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
            d.inv_sale_date || '', d.inv_taxpay || '', d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || '',
            d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
            null, null, 0, 0, 0 // status = 0 (Labour), ready_status = 0
        ];

        const [result] = await conn.query(query, values);
        const invId = result.insertId;

        if (d.items && d.items.length > 0) {
            for (const item of d.items) {
                await conn.query(
                    `INSERT INTO tbl_readyfor_bill (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [invId, item.ic_labour_code || item.lc_lab_code || item.ic_code || '', item.ic_type || item.lc_type || 'labour',
                        item.ic_particular || item.lc_lb_name, item.ic_hsn || item.lc_sacode || '998729',
                        String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
                        String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
                        String(item.ic_sgst_p || item.lc_sgst_p || 9), String(item.ic_sgst_amt || item.lc_sgst_a || 0),
                        String(item.ic_cgst_p || item.lc_cgst_p || 9), String(item.ic_cgst_amt || item.lc_cgst_a || 0),
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

        if (d.inv_no) {
            const [exists] = await conn.query(
                'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ?',
                [d.inv_no, d.inv_no]
            );
            if (exists.length > 0) {
                conn.release();
                return res.status(400).json({ message: 'Invoice number already exists (' + d.inv_no + ')' });
            }
        }

        const query = `INSERT INTO tbl_readyfor_labour (
            inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type,
            inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl,
            inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, 
            inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total,
            insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const values = [
            d.inv_no || '', d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '', d.inv_inv_date, d.inv_type || 'Cash',
            d.inv_job_card_no || '', d.inv_jcard_date, d.inv_repair_typ || '', d.inv_km || d.inv_km_in || '', d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
            d.inv_sale_date || '', d.inv_taxpay || '', d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || '',
            d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
            d.inv_insurance_company || d.insurance_id || null, d.inv_surveyor || d.insurance_serveyor || '', 1, 0, 0 // status = 1 (Insurance), ready_status = 0
        ];

        const [result] = await conn.query(query, values);
        const invId = result.insertId;

        // Insert items into tbl_readyfor_bill
        if (d.items && d.items.length > 0) {
            for (const item of d.items) {
                await conn.query(
                    `INSERT INTO tbl_readyfor_bill (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [invId, item.ic_labour_code || item.lc_lab_code || item.ic_code || '', item.ic_type || item.lc_type || 'spare',
                        item.ic_particular || item.lc_lb_name, item.ic_hsn || item.lc_sacode || '998729',
                        String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
                        String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
                        String(item.ic_sgst_p || item.lc_sgst_p || 9), String(item.ic_sgst_amt || item.lc_sgst_a || 0),
                        String(item.ic_cgst_p || item.lc_cgst_p || 9), String(item.ic_cgst_amt || item.lc_cgst_a || 0),
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
        let query = "SELECT i.*, b.branch_name FROM tbl_invoice_labour i LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch WHERE (i.status = 0 OR (i.status = 1 AND (i.insurance_id IS NULL OR i.insurance_id = 0) AND i.inv_repair_typ != 'Accidental Repair'))";
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
        let query = "SELECT i.*, b.branch_name FROM tbl_invoice_labour i LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch WHERE (i.status = 1 AND (i.insurance_id > 0 OR i.inv_repair_typ = 'Accidental Repair'))";
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
// Get single invoice details
exports.getInvoice = async (req, res) => {
    try {
        // Try finding in tbl_readyfor_labour first (Ready state)
        let [invoices] = await pool.query(
            `SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, i.inv_branch, a.e_first_name AS adv_name, m.e_first_name AS mech_name
             FROM tbl_readyfor_labour i 
             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
             LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
             WHERE i.inv_id = ? AND i.ready_status = 1`,
            [req.params.id]
        );
        let itemsTable = 'tbl_readyfor_bill';
        let itemsIdCol = 'ic_inv_id';

        if (invoices.length === 0) {
            // Check in tbl_invoice_labour (Finalized state)
            [invoices] = await pool.query(
                `SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, a.e_first_name AS adv_name, m.e_first_name AS mech_name 
                 FROM tbl_invoice_labour i 
                 LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
                 LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
                 LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
                 WHERE i.inv_id = ?`,
                [req.params.id]
            );
            itemsTable = 'tbl_invoice_labour_cost';
            itemsIdCol = 'ic_inv_id';
        }

        if (invoices.length === 0) {
            // Last resort: check tbl_readyfor_labour regardless of status
            [invoices] = await pool.query(
                `SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, a.e_first_name AS adv_name, m.e_first_name AS mech_name 
                 FROM tbl_readyfor_labour i 
                 LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
                 LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
                 LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
                 WHERE i.inv_id = ?`,
                [req.params.id]
            );
            itemsTable = 'tbl_readyfor_bill';
        }

        if (invoices.length === 0) return res.status(404).json({ message: 'Not found' });

        const [items] = await pool.query(`SELECT * FROM ${itemsTable} WHERE ${itemsIdCol} = ?`, [req.params.id]);

        // Normalize item fields for frontend if from tbl_readyfor_bill
        const normalizedItems = items.map(it => ({
            ...it,
            lc_lb_name: it.lc_lb_name || it.ic_particular,
            lc_rate: it.lc_rate || it.ic_rate,
            lc_amount: it.lc_amount || it.ic_total
        }));

        const invoiceData = invoices[0];
        // Ensure names are preferred over IDs, but fall back to whatever was there if names are null
        invoiceData.inv_advisername = invoiceData.adv_name || invoiceData.inv_advisername;
        invoiceData.inv_mechna = invoiceData.mech_name || invoiceData.inv_mechna;

        res.json({ invoice: invoiceData, items: normalizedItems });
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

        if (d.inv_no) {
            // Refined check: allow same inv_no if it's the finalized counterpart
            let duplicateQuery = '';
            let duplicateParams = [];

            if (d.isFinalized === true) {
                // Updating finalized bill: check ready bills (status 1) and other finalized bills
                duplicateQuery = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? AND ready_status = 1 UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ? AND inv_id != ?';
                duplicateParams = [d.inv_no, d.inv_no, req.params.id];
            } else {
                // Updating ready bill: check other ready bills and all finalized bills
                duplicateQuery = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? AND inv_id != ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ?';
                duplicateParams = [d.inv_no, req.params.id, d.inv_no];
            }

            const [exists] = await conn.query(duplicateQuery, duplicateParams);
            if (exists.length > 0) {
                conn.release();
                return res.status(400).json({ message: 'Invoice number already exists (' + d.inv_no + ')' });
            }
        }


        // Determine which table to update
        let isReadyTable = true;
        if (d.isFinalized === true) {
            isReadyTable = false;
        } else {
            const [readyRows] = await conn.query('SELECT inv_id FROM tbl_readyfor_labour WHERE inv_id = ? AND ready_status = 1', [req.params.id]);
            isReadyTable = readyRows.length > 0;
        }

        const mainTable = isReadyTable ? 'tbl_readyfor_labour' : 'tbl_invoice_labour';
        const itemsTable = isReadyTable ? 'tbl_readyfor_bill' : 'tbl_invoice_labour_cost';

        await conn.query(
            `UPDATE ${mainTable} SET 
                inv_cus=?, inv_cus_addres=?, inv_pho=?, inv_cus_gstin=?, 
                inv_job_card_no=?, inv_jcard_date=?, inv_repair_typ=?, inv_km=?, 
                in_registr=?, inv_chassis=?, in_engine=?, inv_modl=?,
                inv_advisername=?, inv_mechna=?, inv_branch=?,
                inv_disc_total=?, inv_taxtotal=?, inv_sgstotal=?, inv_gsttotal=?, inv_total=?,
                insurance_id=?, insurance_serveyor=?, inv_sale_date=?, inv_type=?, inv_cesstotal=?
            WHERE inv_id=?`,
            [
                d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '',
                d.inv_job_card_no || '', d.inv_jcard_date, d.inv_repair_typ || '', d.inv_km || '',
                d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
                d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || null,
                d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
                d.inv_insurance_company || d.insurance_id || null, d.inv_surveyor || d.insurance_serveyor || '',
                d.inv_sale_date || '', d.inv_type || '', d.inv_cesstotal || 0,
                req.params.id
            ]
        );

        // Delete old items and re-insert
        await conn.query(`DELETE FROM ${itemsTable} WHERE ic_inv_id = ?`, [req.params.id]);
        if (d.items && d.items.length > 0) {
            for (const item of d.items) {
                await conn.query(
                    `INSERT INTO ${itemsTable} (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
            lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [req.params.id, item.ic_labour_code || item.lc_lab_code || '', item.ic_type || item.lc_type || 'labour',
                    item.ic_particular || item.lc_lb_name || '', item.ic_hsn || item.lc_sacode || '998729',
                    String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
                    String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
                    String(item.ic_sgst_p || item.lc_sgst_p || 9), String(item.ic_sgst_amt || item.lc_sgst_a || 0),
                    String(item.ic_cgst_p || item.lc_cgst_p || 9), String(item.ic_cgst_amt || item.lc_cgst_a || 0),
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
        // Try updating tbl_readyfor_labour first
        const [result] = await pool.query('UPDATE tbl_readyfor_labour SET ready_status = 1 WHERE inv_id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            // Fallback to tbl_invoice_labour (unlikely in new flow but safe for migration)
            await pool.query('UPDATE tbl_invoice_labour SET ready_status = 1 WHERE inv_id = ?', [req.params.id]);
        }
        res.json({ message: 'Marked as ready' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get ready labour bills with pagination
exports.getReadyLabourBills = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search = '', branchId } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        let whereClause = 'WHERE i.status = 0 AND i.ready_status = 1';
        const params = [];

        if (branchId) {
            whereClause += ' AND i.inv_branch = ?';
            params.push(branchId);
        }

        if (search) {
            whereClause += ' AND (i.in_registr LIKE ? OR i.inv_cus LIKE ? OR i.inv_job_card_no LIKE ? OR i.inv_no LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        const countQuery = `SELECT COUNT(*) as total FROM tbl_readyfor_labour i ${whereClause}`;
        const [countResult] = await pool.query(countQuery, params);
        const total = countResult[0].total;

        const dataQuery = `
            SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, i.inv_branch 
            FROM tbl_readyfor_labour i 
            LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
            ${whereClause} 
            ORDER BY i.inv_id DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        res.json({ data: rows, total, page: parseInt(page), pageSize: limit });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get ready insurance bills with pagination
exports.getReadyInsuranceBills = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search = '', branchId } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        let whereClause = 'WHERE i.status = 1 AND i.ready_status = 1';
        const params = [];

        if (branchId) {
            whereClause += ' AND i.inv_branch = ?';
            params.push(branchId);
        }

        if (search) {
            whereClause += ' AND (i.in_registr LIKE ? OR i.inv_cus LIKE ? OR i.inv_job_card_no LIKE ? OR i.inv_no LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        const countQuery = `SELECT COUNT(*) as total FROM tbl_readyfor_labour i ${whereClause}`;
        const [countResult] = await pool.query(countQuery, params);
        const total = countResult[0].total;

        const dataQuery = `
            SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, i.inv_branch 
            FROM tbl_readyfor_labour i 
            LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
            ${whereClause} 
            ORDER BY i.inv_id DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        res.json({ data: rows, total, page: parseInt(page), pageSize: limit });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get next sequential counter (MAX(inv_id) + 1)
exports.getNextInvoiceNo = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT MAX(inv_id) as maxId FROM tbl_readyfor_labour');
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

// Generate PDF and Finalize Bill
exports.generatePDF = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Find the invoice (Prefer Ready table)
        const [readyInvoices] = await conn.query(
            `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name 
             FROM tbl_readyfor_labour i 
             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
             LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
             WHERE i.inv_id = ? AND i.ready_status = 1`,
            [req.params.id]
        );

        let invoice;
        let isFromReadyTable = false;

        if (readyInvoices.length > 0) {
            invoice = readyInvoices[0];
            isFromReadyTable = true;
        } else {
            const [invoices] = await conn.query(
                `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name 
                 FROM tbl_invoice_labour i 
                 LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
                 LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
                 LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
                 WHERE i.inv_id = ?`,
                [req.params.id]
            );
            if (invoices.length === 0) {
                conn.release();
                return res.status(404).json({ message: 'Not found' });
            }
            invoice = invoices[0];
        }

        invoice.inv_advisername = invoice.adv_name || invoice.inv_advisername;
        invoice.inv_mechna = invoice.mech_name || invoice.inv_mechna;

        // 2. Fetch items (Check both tables)
        let [items] = await conn.query('SELECT * FROM tbl_readyfor_bill WHERE ic_inv_id = ?', [req.params.id]);
        if (items.length === 0) {
            [items] = await conn.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);
        }

        // 3. If it's from Ready table, finalize it
        if (isFromReadyTable) {
            // Generate Invoice Number
            const [rows] = await conn.query('SELECT MAX(inv_id) as maxId FROM tbl_invoice_labour');
            const nextId = (rows[0].maxId || 0) + 1;
            const today = new Date();
            const ymd = today.getFullYear().toString() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
            const newInvNo = `CI${ymd}${nextId}`;

            // Insert into tbl_invoice_labour (Finalized)
            const finalizedStatus = (invoice.status === 0) ? 0 : 1;

            const [insertResult] = await conn.query(
                'INSERT INTO tbl_invoice_labour (inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type, inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl, inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total, status, ready_status, insurance_id, insurance_serveyor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newInvNo, invoice.inv_cus, invoice.inv_cus_addres, invoice.inv_pho, invoice.inv_cus_gstin, invoice.inv_inv_date, invoice.inv_type, invoice.inv_job_card_no, invoice.inv_jcard_date, invoice.inv_repair_typ, invoice.inv_km, invoice.in_registr, invoice.inv_chassis, invoice.in_engine, invoice.inv_modl, invoice.inv_sale_date, invoice.inv_taxpay, invoice.inv_advisername, invoice.inv_mechna, invoice.inv_branch, invoice.inv_disc_total, invoice.inv_taxtotal, invoice.inv_sgstotal, invoice.inv_gsttotal, invoice.inv_total, finalizedStatus, 0, invoice.insurance_id || null, invoice.insurance_serveyor || '']
            );
            const newInvId = insertResult.insertId;

            // Insert items into tbl_invoice_labour_cost
            for (const item of items) {
                await conn.query(
                    'INSERT INTO tbl_invoice_labour_cost (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt, lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [newInvId, item.lc_lab_code, item.lc_type, item.lc_lb_name, item.lc_sacode, item.lc_rate, item.lc_disc_p, item.lc_disc, item.lc_tax_amunt, item.lc_sgst_p, item.lc_sgst_a, item.lc_cgst_p, item.lc_cgst_a, item.lc_amount]
                );
            }

            // Update ready table
            await conn.query('UPDATE tbl_readyfor_labour SET ready_status = 0, inv_no = ? WHERE inv_id = ?', [newInvNo, req.params.id]);

            invoice.inv_no = newInvNo; // For PDF generation
        }

        const { generateInvoicePDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generateInvoicePDF(invoice, items);

        await conn.commit();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=invoice_' + req.params.id + '.pdf');
        res.send(pdfBuffer);
    } catch (err) {
        await conn.rollback();
        console.error('PDF error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        conn.release();
    }
};

// Generate Word and Finalize Bill
exports.generateWord = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Find the invoice (Prefer Ready table)
        const [readyInvoices] = await conn.query(
            `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name 
             FROM tbl_readyfor_labour i 
             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
             LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
             WHERE i.inv_id = ? AND i.ready_status = 1`,
            [req.params.id]
        );

        let invoice;
        let isFromReadyTable = false;

        if (readyInvoices.length > 0) {
            invoice = readyInvoices[0];
            isFromReadyTable = true;
        } else {
            const [invoices] = await conn.query(
                `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name 
                 FROM tbl_invoice_labour i 
                 LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
                 LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
                 LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
                 WHERE i.inv_id = ?`,
                [req.params.id]
            );
            if (invoices.length === 0) {
                conn.release();
                return res.status(404).json({ message: 'Not found' });
            }
            invoice = invoices[0];
        }

        invoice.inv_advisername = invoice.adv_name || invoice.inv_advisername;
        invoice.inv_mechna = invoice.mech_name || invoice.inv_mechna;

        // 2. Fetch items (Check both tables)
        let [items] = await conn.query('SELECT * FROM tbl_readyfor_bill WHERE ic_inv_id = ?', [req.params.id]);
        if (items.length === 0) {
            [items] = await conn.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);
        }

        // 3. If it's from Ready table, finalize it (same logic as PDF)
        if (isFromReadyTable) {
            const [rows] = await conn.query('SELECT MAX(inv_id) as maxId FROM tbl_invoice_labour');
            const nextId = (rows[0].maxId || 0) + 1;
            const today = new Date();
            const ymd = today.getFullYear().toString() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
            const newInvNo = `CI${ymd}${nextId}`;

            const finalizedStatus = (invoice.status === 0) ? 0 : 1;

            const [insertResult] = await conn.query(
                'INSERT INTO tbl_invoice_labour (inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type, inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl, inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total, status, ready_status, insurance_id, insurance_serveyor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newInvNo, invoice.inv_cus, invoice.inv_cus_addres, invoice.inv_pho, invoice.inv_cus_gstin, invoice.inv_inv_date, invoice.inv_type, invoice.inv_job_card_no, invoice.inv_jcard_date, invoice.inv_repair_typ, invoice.inv_km, invoice.in_registr, invoice.inv_chassis, invoice.in_engine, invoice.inv_modl, invoice.inv_sale_date, invoice.inv_taxpay, invoice.inv_advisername, invoice.inv_mechna, invoice.inv_branch, invoice.inv_disc_total, invoice.inv_taxtotal, invoice.inv_sgstotal, invoice.inv_gsttotal, invoice.inv_total, finalizedStatus, 0, invoice.insurance_id || null, invoice.insurance_serveyor || '']
            );
            const newInvId = insertResult.insertId;

            for (const item of items) {
                await conn.query(
                    'INSERT INTO tbl_invoice_labour_cost (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt, lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [newInvId, item.lc_lab_code, item.lc_type, item.lc_lb_name, item.lc_sacode, item.lc_rate, item.lc_disc_p, item.lc_disc, item.lc_tax_amunt, item.lc_sgst_p, item.lc_sgst_a, item.lc_cgst_p, item.lc_cgst_a, item.lc_amount]
                );
            }
            await conn.query('UPDATE tbl_readyfor_labour SET ready_status = 0, inv_no = ? WHERE inv_id = ?', [newInvNo, req.params.id]);
            invoice.inv_no = newInvNo;
        }

        const wordBuffer = await generateInvoiceWord(invoice, items);

        await conn.commit();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice_' + req.params.id + '.docx');
        res.send(wordBuffer);
    } catch (err) {
        await conn.rollback();
        console.error('Word error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        conn.release();
    }
};
