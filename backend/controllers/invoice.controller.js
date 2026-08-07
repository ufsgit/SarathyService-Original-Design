const pool = require('../config/db');
const { generateInvoiceWord } = require('../utils/wordGenerator');

/**
 * Generates the next invoice number dynamically for any brand.
 */

// org

// function generateNextInvoiceNumber(lastInvoiceNumber, newInvoiceDate, defaultPrefix, defaultBranch) {
//     const dateObj = new Date(newInvoiceDate);
//     const year = dateObj.getFullYear();
//     const month = dateObj.getMonth() + 1; // 0-indexed

//     let targetFY = year;
//     if (month < 4) {
//         targetFY = year - 1; // Jan, Feb, Mar belong to the previous year's FY
//     }
//     const targetFYStr = targetFY.toString();

//     let prefix = defaultPrefix;
//     let branchCode = defaultBranch;
//     let lastSequenceStr = '00000';
//     let lastFY = '';

//     if (lastInvoiceNumber && lastInvoiceNumber.length >= 16) {
//         prefix = lastInvoiceNumber.substring(0, 2);
//         lastFY = lastInvoiceNumber.substring(2, 6);
//         branchCode = lastInvoiceNumber.substring(6, 11);
//         lastSequenceStr = lastInvoiceNumber.substring(11);
//     }

//     let newSequenceNum;
//     if (targetFYStr === lastFY) {
//         // Same financial year, just increment
//         newSequenceNum = parseInt(lastSequenceStr, 10) + 1;
//     } else {
//         // New financial year, reset to 1
//         newSequenceNum = 1;
//     }

//     // Pad with leading zeros to ensure it's at least 5 digits long
//     const newSequenceStr = newSequenceNum.toString().padStart(5, '0');
//     return `${prefix}${targetFYStr}${branchCode}${newSequenceStr}`;
// }

// sample
function generateNextInvoiceNumber(lastInvoiceNumber, newInvoiceDate, defaultPrefix, defaultBranch) {
    const dateObj = new Date(newInvoiceDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 0-indexed

    let targetFY = year;
    if (month < 4) {
        targetFY = year - 1; // Jan, Feb, Mar belong to the previous year's FY
    }
    const targetFYStr = targetFY.toString();

    let prefix = defaultPrefix;
    let branchCode = defaultBranch;
    let lastSequenceStr = '00000';
    let lastFY = '';

    if (lastInvoiceNumber && lastInvoiceNumber.length >= 16) {
        prefix = lastInvoiceNumber.substring(0, 2);
        lastFY = lastInvoiceNumber.substring(2, 6);
        branchCode = lastInvoiceNumber.substring(6, 11);
        lastSequenceStr = lastInvoiceNumber.substring(11);
    }

    let newSequenceNum;
    if (targetFYStr === lastFY) {
        // Same financial year, just increment
        newSequenceNum = parseInt(lastSequenceStr, 10) + 1;
    } else {
        // New financial year, reset to 1
        newSequenceNum = 1;
    }

    // Pad with leading zeros to ensure it's at least 5 digits long
    const newSequenceStr = newSequenceNum.toString().padStart(5, '0');
    return `${prefix}${targetFYStr}${branchCode}${newSequenceStr}`;
}

// Check jobcard duplicate invoice not SP
// exports.checkJobCardDuplicate = async (req, res) => {
//     try {
//         const { jobcard, excludeId } = req.query;
//         if (!jobcard) return res.json({ exists: false });

//         let query = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = ? AND ready_status = 1 UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = ?';
//         let params = [jobcard, jobcard];

//         if (excludeId) {
//             query = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = ? AND ready_status = 1 AND inv_id != ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = ? AND inv_id != ?';
//             params = [jobcard, excludeId, jobcard, excludeId];
//         }

//         const [exists] = await pool.query(query, params);
//         res.json({ exists: exists.length > 0 });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

// Check jobcard duplicate invoice SP
exports.checkJobCardDuplicate = async (req, res) => {
    try {
        const { jobcard, excludeId } = req.query;
        if (!jobcard) return res.json({ exists: false });

        const [result] = await pool.query(
            'CALL sp_CheckJobCardDuplicate(?, ?)',
            [jobcard, excludeId || null]
        );

        res.json({ exists: result[0].length > 0 });
    } catch (err) {
        console.error('Check Jobcard Duplicate error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create labour invoice
// exports.createLabourInvoice = async (req, res) => {
//     console.log('createLabourInvoice req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     const conn = await pool.getConnection();
//     try {
//         await conn.beginTransaction();
//         const d = req.body;

//         if (d.inv_no) {
//             const [exists] = await conn.query(
//                 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ?',
//                 [d.inv_no, d.inv_no]
//             );
//             if (exists.length > 0) {
//                 await conn.rollback();
//                 conn.release();
//                 return res.status(400).json({ message: 'Invoice number already exists (' + d.inv_no + ')' });
//             }
//         }

//         if (d.inv_job_card_no) {
//             const [exists] = await conn.query(
//                 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = ?',
//                 [d.inv_job_card_no, d.inv_job_card_no]
//             );
//             if (exists.length > 0) {
//                 await conn.rollback();
//                 conn.release();
//                 return res.status(400).json({ message: 'Jobcard number already exists (' + d.inv_job_card_no + ')' });
//             }
//         }

//         const query = `INSERT INTO tbl_readyfor_labour (
//             inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type,
//             inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl,
//             inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, 
//             inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total,
//             insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
//         ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

//         const values = [
//             d.inv_no || '', d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '', d.inv_inv_date, d.inv_type || 'Cash',
//             d.inv_job_card_no || '', d.inv_jcard_date, d.inv_repair_typ || '', d.inv_km || d.inv_km_in || '', d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
//             d.inv_sale_date || '', d.inv_taxpay || '', d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || '',
//             d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
//             null, null, 0, 0, 0 // status = 0 (Labour), ready_status = 0
//         ];

//         const [result] = await conn.query(query, values);
//         const invId = result.insertId;

//         if (d.items && d.items.length > 0) {
//             for (const item of d.items) {
//                 await conn.query(
//                     `INSERT INTO tbl_readyfor_bill (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
//             lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
//           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//                     [invId, item.ic_labour_code || item.lc_lab_code || item.ic_code || '', item.ic_type || item.lc_type || 'labour',
//                         item.ic_particular || item.lc_lb_name, item.ic_hsn || item.lc_sacode || '998729',
//                         String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
//                         String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
//                         String(item.ic_sgst_p || item.lc_sgst_p || 9), String(item.ic_sgst_amt || item.lc_sgst_a || 0),
//                         String(item.ic_cgst_p || item.lc_cgst_p || 9), String(item.ic_cgst_amt || item.lc_cgst_a || 0),
//                         String(item.ic_total || item.lc_amount || 0), String(item.lc_cess || 0)]
//                 );
//             }
//         }

//         await conn.commit();
//         res.status(201).json({ message: 'Labour invoice created', id: invId });
//     } catch (err) {
//         await conn.rollback();
//         console.error('Create labour invoice error:', err);
//         res.status(500).json({ message: 'Server error', error: err.message });
//     } finally {
//         conn.release();
//     }
// };

exports.createLabourInvoice = async (req, res) => {
    try {
        const d = req.body;

        const [result] = await pool.query(
            "CALL createLabourInvoice(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                d.inv_no || "",
                d.inv_cus || "",
                d.inv_cus_addres || "",
                d.inv_pho || "",
                d.inv_cus_gstin || d.inv_gstin || "",
                d.inv_inv_date,
                d.inv_type || "Cash",
                d.inv_job_card_no || "",
                d.inv_jcard_date,
                d.inv_repair_typ || "",
                d.inv_km || d.inv_km_in || "",
                d.in_registr || "",
                d.inv_chassis || "",
                d.in_engine || d.inv_engine || "",
                d.inv_modl || "",
                d.inv_sale_date || "",
                d.inv_taxpay || "",
                d.inv_advisername || "",
                d.inv_mechna || "",
                d.inv_branch || "",
                d.inv_discount || 0,
                d.inv_taxable_total || d.inv_taxtotal || 0,
                d.inv_sgst || 0,
                d.inv_cgst || 0,
                d.inv_final_amount || d.inv_total || 0,
                null,
                null,
                d.status || 0,
                d.ready_status || 1,
                0,
                JSON.stringify(d.items || [])
            ]
        );

        const invId = result[0][0].inv_id;

        if (invId === -2) {
            return res.status(400).json({
                message: `Invoice number already exists: ${d.inv_no}`
            });
        }

        if (invId === -3) {
            return res.status(400).json({
                message: `Jobcard number already exists: ${d.inv_job_card_no}`
            });
        }

        return res.status(200).json({
            message: "Labour invoice created successfully",
            id: invId
        });

    } catch (err) {
        console.error("Create labour invoice error:", err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
};

// Create insurance invoice not SP
// exports.createInsuranceInvoice = async (req, res) => {
//     console.log('createInsuranceInvoice req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     const conn = await pool.getConnection();
//     try {
//         await conn.beginTransaction();
//         const d = req.body;

//         if (d.inv_no) {
//             const [exists] = await conn.query(
//                 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ?',
//                 [d.inv_no, d.inv_no]
//             );
//             if (exists.length > 0) {
//                 await conn.rollback();
//                 conn.release();
//                 return res.status(400).json({ message: 'Invoice number already exists (' + d.inv_no + ')' });
//             }
//         }

//         if (d.inv_job_card_no) {
//             const [exists] = await conn.query(
//                 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = ?',
//                 [d.inv_job_card_no, d.inv_job_card_no]
//             );
//             if (exists.length > 0) {
//                 await conn.rollback();
//                 conn.release();
//                 return res.status(400).json({ message: 'Jobcard number already exists (' + d.inv_job_card_no + ')' });
//             }
//         }

//         const query = `INSERT INTO tbl_readyfor_labour (
//             inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type,
//             inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl,
//             inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, 
//             inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total,
//             insurance_id, insurance_serveyor, status, ready_status, inv_cesstotal
//         ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

//         const values = [
//             d.inv_no || '', d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '', d.inv_inv_date, d.inv_type || 'Cash',
//             d.inv_job_card_no || '', d.inv_jcard_date, d.inv_repair_typ || '', d.inv_km || d.inv_km_in || '', d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
//             d.inv_sale_date || '', d.inv_taxpay || '', d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || '',
//             d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
//             d.inv_insurance_company || d.insurance_id || null, d.inv_surveyor || d.insurance_serveyor || '', 1, 0, 0 // status = 1 (Insurance), ready_status = 0
//         ];

//         const [result] = await conn.query(query, values);
//         const invId = result.insertId;

//         // Insert items into tbl_readyfor_bill
//         if (d.items && d.items.length > 0) {
//             for (const item of d.items) {
//                 await conn.query(
//                     `INSERT INTO tbl_readyfor_bill (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
//             lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
//           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//                     [invId, item.ic_labour_code || item.lc_lab_code || item.ic_code || '', item.ic_type || item.lc_type || 'spare',
//                         item.ic_particular || item.lc_lb_name, item.ic_hsn || item.lc_sacode || '998729',
//                         String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
//                         String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
//                         String(item.ic_sgst_p || item.lc_sgst_p || 9), String(item.ic_sgst_amt || item.lc_sgst_a || 0),
//                         String(item.ic_cgst_p || item.lc_cgst_p || 9), String(item.ic_cgst_amt || item.lc_cgst_a || 0),
//                         String(item.ic_total || item.lc_amount || 0), String(item.lc_cess || 0)]
//                 );
//             }
//         }

//         await conn.commit();
//         res.status(201).json({ message: 'Insurance invoice created', id: invId });
//     } catch (err) {
//         await conn.rollback();
//         console.error('Create insurance invoice error:', err);
//         res.status(500).json({ message: 'Server error', error: err.message });
//     } finally {
//         conn.release();
//     }
// };

// Create insurance invoice SP
exports.createInsuranceInvoice = async (req, res) => {
    console.log('createInsuranceInvoice_SP req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
    try {
        const d = req.body;

        const [result] = await pool.query(
            'CALL sp_createInsuranceInvoice(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                d.inv_no || '',
                d.inv_cus || '',
                d.inv_cus_addres || '',
                d.inv_pho || '',
                d.inv_cus_gstin || d.inv_gstin || '',
                d.inv_inv_date,
                d.inv_type || 'Cash',
                d.inv_job_card_no || '',
                d.inv_jcard_date,
                d.inv_repair_typ || '',
                d.inv_km || d.inv_km_in || '',
                d.in_registr || '',
                d.inv_chassis || '',
                d.in_engine || d.inv_engine || '',
                d.inv_modl || '',
                d.inv_sale_date || '',
                d.inv_taxpay || '',
                d.inv_advisername || '',
                d.inv_mechna || '',
                d.inv_branch || '',
                d.inv_discount || 0,
                d.inv_taxable_total || d.inv_taxtotal || 0,
                d.inv_sgst || 0,
                d.inv_cgst || 0,
                d.inv_final_amount || d.inv_total || 0,
                d.inv_insurance_company || d.insurance_id || null,
                d.inv_surveyor || d.insurance_serveyor || '',
                d.status || 1,
                d.ready_status || 1,
                d.items ? JSON.stringify(d.items) : '[]'
            ]
        );

        const row = result && result[0] && result[0][0] ? result[0][0] : null;

        if (!row || row.invId === 0) {
            return res.status(400).json({ message: row ? row.message : 'Failed to create invoice' });
        }

        res.status(201).json({ message: 'Insurance invoice created', id: row.invId });
    } catch (err) {
        console.error('Create insurance invoice error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get labour invoices
exports.getLabourInvoices = async (req, res) => {
    console.log('getLabourInvoices req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
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
    console.log('getInsuranceInvoices req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
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
// exports.getInvoice = async (req, res) => {
//     console.log('getInvoice req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     try {
//         // Try finding in tbl_readyfor_labour first (Ready state)
//         let [invoices] = await pool.query(
//             `SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, i.inv_branch, a.e_first_name AS adv_name, 
//             m.e_first_name AS mech_name, c.c_email
//              FROM tbl_readyfor_labour i 
//              LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
//              LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
//              LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
//              LEFT JOIN customer_details c ON i.in_registr = c.c_reg_no
//              WHERE i.inv_id = ? AND i.ready_status = 1`,
//             [req.params.id]
//         );
//         let itemsTable = 'tbl_readyfor_bill';
//         let itemsIdCol = 'ic_inv_id';

//         if (invoices.length === 0) {
//             // Check in tbl_invoice_labour (Finalized state)
//             [invoices] = await pool.query(
//                 `SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, a.e_first_name AS adv_name, 
//                 m.e_first_name AS mech_name, c.c_email
//                  FROM tbl_invoice_labour i 
//                  LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
//                  LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
//                  LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
//                  LEFT JOIN customer_details c ON i.in_registr = c.c_reg_no
//                  WHERE i.inv_id = ?`,
//                 [req.params.id]
//             );
//             itemsTable = 'tbl_invoice_labour_cost';
//             itemsIdCol = 'ic_inv_id';
//         }

//         if (invoices.length === 0) {
//             // Last resort: check tbl_readyfor_labour regardless of status
//             [invoices] = await pool.query(
//                 `SELECT i.*, b.branch_name, i.in_engine AS inv_engine, i.in_registr AS in_registr, a.e_first_name AS adv_name,
//                  m.e_first_name AS mech_name, c.c_email
//                  FROM tbl_readyfor_labour i 
//                  LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
//                  LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
//                  LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
//                  LEFT JOIN customer_details c ON i.in_registr = c.c_reg_no
//                  WHERE i.inv_id = ?`,
//                 [req.params.id]
//             );
//             itemsTable = 'tbl_readyfor_bill';
//         }

//         if (invoices.length === 0) return res.status(404).json({ message: 'Not found' });

//         const [items] = await pool.query(`SELECT * FROM ${itemsTable} WHERE ${itemsIdCol} = ?`, [req.params.id]);

//         // Normalize item fields for frontend if from tbl_readyfor_bill
//         const normalizedItems = items.map(it => ({
//             ...it,
//             lc_lb_name: it.lc_lb_name || it.ic_particular,
//             lc_rate: it.lc_rate || it.ic_rate,
//             lc_amount: it.lc_amount || it.ic_total
//         }));

//         const invoiceData = invoices[0];
//         // Ensure names are preferred over IDs, but fall back to whatever was there if names are null
//         invoiceData.inv_advisername = invoiceData.adv_name || invoiceData.inv_advisername;
//         invoiceData.inv_mechna = invoiceData.mech_name || invoiceData.inv_mechna;

//         res.json({ invoice: invoiceData, items: normalizedItems });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

exports.getInvoice = async (req, res) => {
    try {

        const [result] = await pool.query(
            "CALL getInvoice(?)",
            [req.params.id]
        );

        const invoice = result[0][0];

        if (!invoice) {
            return res.status(404).json({
                message: "Not found"
            });
        }

        const items = result[1];

        const normalizedItems = items.map(it => ({
            ...it,
            lc_lb_name: it.lc_lb_name || it.ic_particular,
            lc_rate: it.lc_rate || it.ic_rate,
            lc_amount: it.lc_amount || it.ic_total
        }));

        invoice.inv_advisername =
            invoice.adv_name || invoice.inv_advisername;

        invoice.inv_mechna =
            invoice.mech_name || invoice.inv_mechna;

        res.json({
            invoice,
            items: normalizedItems
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
};


// Update invoice not SP
// exports.updateInvoice = async (req, res) => {
//     console.log('updateInvoice req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     const conn = await pool.getConnection();
//     try {
//         // await conn.beginTransaction();
//         const d = req.body;

//         if (d.inv_no) {
//             // First check if the invoice number is actually being changed
//             let currentInvNo = null;
//             if (d.isFinalized === true) {
//                 const [current] = await conn.query('SELECT inv_no FROM tbl_invoice_labour WHERE inv_id = ?', [req.params.id]);
//                 if (current.length > 0)
//                     currentInvNo = current[0].inv_no;
//             } else {
//                 const [current] = await conn.query('SELECT inv_no FROM tbl_readyfor_labour WHERE inv_id = ?', [req.params.id]);
//                 if (current.length > 0)
//                     currentInvNo = current[0].inv_no;
//             }

//             if (currentInvNo !== d.inv_no) {
//                 let duplicateQuery = '';
//                 let duplicateParams = [];
//                 if (d.isFinalized === true) {
//                     duplicateQuery = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? AND ready_status = 1 UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ? AND inv_id != ?';
//                     duplicateParams = [d.inv_no, d.inv_no, req.params.id];
//                 } else {
//                     duplicateQuery = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_no = ? AND inv_id != ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_no = ?';
//                     duplicateParams = [d.inv_no, req.params.id, d.inv_no];
//                 }
//                 const [exists] = await conn.query(duplicateQuery, duplicateParams);
//                 if (exists.length > 0) {
//                     // await conn.rollback();
//                     // conn.release();
//                     return res.status(400).json({ message: 'Invoice number already exists (' + d.inv_no + ')' });
//                 }
//             }
//         }

//         if (d.inv_job_card_no) {
//             let currentJobCardNo = null;
//             if (d.isFinalized === true) {
//                 const [current] = await conn.query('SELECT inv_job_card_no FROM tbl_invoice_labour WHERE inv_id = ?', [req.params.id]);
//                 if (current.length > 0) currentJobCardNo = current[0].inv_job_card_no;
//             } else {
//                 const [current] = await conn.query('SELECT inv_job_card_no FROM tbl_readyfor_labour WHERE inv_id = ?', [req.params.id]);
//                 if (current.length > 0) currentJobCardNo = current[0].inv_job_card_no;
//             }

//             if (currentJobCardNo !== d.inv_job_card_no) {
//                 let duplicateQuery = '';
//                 let duplicateParams = [];
//                 if (d.isFinalized === true) {
//                     duplicateQuery = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = ? AND inv_id != ?';
//                     duplicateParams = [d.inv_job_card_no, d.inv_job_card_no, req.params.id];
//                 } else {
//                     duplicateQuery = 'SELECT inv_id FROM tbl_readyfor_labour WHERE inv_job_card_no = ? AND inv_id != ? UNION SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = ?';
//                     duplicateParams = [d.inv_job_card_no, req.params.id, d.inv_job_card_no];
//                 }
//                 const [exists] = await conn.query(duplicateQuery, duplicateParams);
//                 if (exists.length > 0) {
//                     // await conn.rollback();
//                     // conn.release();
//                     return res.status(400).json({ message: 'Jobcard number already exists (' + d.inv_job_card_no + ')' });
//                 }
//             }
//         }
//         await conn.beginTransaction();
//         if (d.isFinalized === true) {
//             // Update finalized invoice in-place
//             const mainTable = 'tbl_invoice_labour';
//             const itemsTable = 'tbl_invoice_labour_cost';

//             await conn.query(
//                 `UPDATE ${mainTable} SET 
//                     inv_cus=?, inv_cus_addres=?, inv_pho=?, inv_cus_gstin=?, 
//                     inv_job_card_no=?, inv_jcard_date=?, inv_inv_date=?, inv_repair_typ=?, inv_km=?, 
//                     in_registr=?, inv_chassis=?, in_engine=?, inv_modl=?,
//                     inv_advisername=?, inv_mechna=?, inv_branch=?,
//                     inv_disc_total=?, inv_taxtotal=?, inv_sgstotal=?, inv_gsttotal=?, inv_total=?,
//                     insurance_id=?, insurance_serveyor=?, inv_sale_date=?, inv_type=?, inv_cesstotal=?
//                 WHERE inv_id=?`,
//                 [
//                     d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '',
//                     d.inv_job_card_no || '', d.inv_jcard_date, d.inv_inv_date, d.inv_repair_typ || '', d.inv_km || '',
//                     d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
//                     d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || null,
//                     d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0,
//                     d.inv_final_amount || d.inv_total || 0,
//                     d.inv_insurance_company || d.insurance_id || null, d.inv_surveyor || d.insurance_serveyor || '',
//                     d.inv_sale_date || '', d.inv_type || '', d.inv_cesstotal || 0,
//                     req.params.id
//                 ]
//             );

//             // Delete old items and re-insert
//             await conn.query(`DELETE FROM ${itemsTable} WHERE ic_inv_id = ?`, [req.params.id]);
//             if (d.items && d.items.length > 0) {
//                 for (const item of d.items) {
//                     await conn.query(
//                         `INSERT INTO ${itemsTable} (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
//                 lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount)
//               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//                         [req.params.id, item.ic_labour_code || item.lc_lab_code || '', item.ic_type || item.lc_type || 'labour',
//                         item.ic_particular || item.lc_lb_name || '', item.ic_hsn || item.lc_sacode || '998729',
//                         String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
//                         String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
//                         String(item.ic_sgst_p || item.lc_sgst_p || 9), String(item.ic_sgst_amt || item.lc_sgst_a || 0),
//                         String(item.ic_cgst_p || item.lc_cgst_p || 9), String(item.ic_cgst_amt || item.lc_cgst_a || 0),
//                         String(item.ic_total || item.lc_amount || 0)]
//                     );
//                 }
//             }

//             await conn.commit();
//             return res.json({ message: 'Invoice updated and remains in Previous Bills' });
//         }

//         // Standard update for non-finalized invoices
//         const mainTable = 'tbl_readyfor_labour';
//         const itemsTable = 'tbl_readyfor_bill';

//         await conn.query(
//             `UPDATE ${mainTable} SET 
//                 inv_cus=?, inv_cus_addres=?, inv_pho=?, inv_cus_gstin=?, 
//                 inv_job_card_no=?, inv_jcard_date=?, inv_inv_date=?, inv_repair_typ=?, inv_km=?, 
//                 in_registr=?, inv_chassis=?, in_engine=?, inv_modl=?,
//                 inv_advisername=?, inv_mechna=?, inv_branch=?,
//                 inv_disc_total=?, inv_taxtotal=?, inv_sgstotal=?, inv_gsttotal=?, inv_total=?,
//                 insurance_id=?, insurance_serveyor=?, inv_sale_date=?, inv_type=?, inv_cesstotal=?
//             WHERE inv_id=?`,
//             [
//                 d.inv_cus || '', d.inv_cus_addres || '', d.inv_pho || '', d.inv_cus_gstin || d.inv_gstin || '',
//                 d.inv_job_card_no || '', d.inv_jcard_date, d.inv_inv_date, d.inv_repair_typ || '', d.inv_km || '',
//                 d.in_registr || '', d.inv_chassis || '', d.in_engine || d.inv_engine || '', d.inv_modl || '',
//                 d.inv_advisername || '', d.inv_mechna || '', d.inv_branch || null,
//                 d.inv_discount || 0, d.inv_taxable_total || d.inv_taxtotal || 0, d.inv_sgst || 0, d.inv_cgst || 0, d.inv_final_amount || d.inv_total || 0,
//                 d.inv_insurance_company || d.insurance_id || null, d.inv_surveyor || d.insurance_serveyor || '',
//                 d.inv_sale_date || '', d.inv_type || '', d.inv_cesstotal || 0,
//                 req.params.id
//             ]
//         );

//         // Delete old items and re-insert
//         await conn.query(`DELETE FROM ${itemsTable} WHERE ic_inv_id = ?`, [req.params.id]);
//         if (d.items && d.items.length > 0) {
//             for (const item of d.items) {
//                 await conn.query(
//                     `INSERT INTO ${itemsTable} (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt,
//             lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount, lc_cess)
//           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//                     [req.params.id, item.ic_labour_code || item.lc_lab_code || '', item.ic_type || item.lc_type || 'labour',
//                     item.ic_particular || item.lc_lb_name || '', item.ic_hsn || item.lc_sacode || '998729',
//                     String(item.ic_rate || item.lc_rate || 0), String(item.ic_disc_per || item.lc_disc_p || 0), String(item.lc_disc || item.ic_disc || 0),
//                     String(item.ic_taxable_amt || item.lc_tax_amunt || 0),
//                     String(item.ic_sgst_p || item.lc_sgst_p || 9), String(item.ic_sgst_amt || item.lc_sgst_a || 0),
//                     String(item.ic_cgst_p || item.lc_cgst_p || 9), String(item.ic_cgst_amt || item.lc_cgst_a || 0),
//                     String(item.ic_total || item.lc_amount || 0), String(item.lc_cess || 0)]
//                 );
//             }
//         }
//         await conn.commit();
//         res.json({ message: 'Invoice updated' });
//     } catch (err) {
//         await conn.rollback();
//         res.status(500).json({ message: 'Server error', error: err.message });
//     } finally {
//         conn.release();
//     }
// };

// Update invoice SP
exports.updateInvoice = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const d = req.body;
        console.log('update table:', d);

        const [result] = await conn.query(
            `CALL updateInvoice(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                req.params.id || d.inv_id || 0,
                d.inv_no || "",
                d.inv_cus || "",
                d.inv_cus_addres || "",
                d.inv_pho || "",
                d.inv_cus_gstin || d.inv_gstin || "",
                d.inv_inv_date,
                d.inv_type || "Cash",
                d.inv_job_card_no || "",
                d.inv_jcard_date,
                d.inv_repair_typ || "",
                d.inv_km || d.inv_km_in || "",
                d.in_registr || "",
                d.inv_chassis || "",
                d.in_engine || d.inv_engine || "",
                d.inv_modl || "",
                d.inv_sale_date || "",
                d.inv_taxpay || "",
                d.inv_advisername || "",
                d.inv_mechna || "",
                d.inv_branch || "",
                d.inv_discount || 0,
                d.inv_taxable_total ?? d.inv_taxtotal ?? 0,
                d.inv_sgst || 0,
                d.inv_cgst || 0,
                d.inv_final_amount || d.inv_total || 0,
                d.inv_insurance_company || d.insurance_id || 0,
                d.inv_surveyor || d.insurance_serveyor || "",
                0,
                JSON.stringify(d.items || []),
                d.isFinalized ? 1 : 0
            ]
        );

        const invId = result[0][0].inv_id;

        if (invId === -2) {
            return res.status(400).json({
                message: `Invoice number already exists: ${d.inv_no}`
            });
        }

        if (invId === -3) {
            return res.status(400).json({
                message: `Jobcard number already exists: ${d.inv_job_card_no}`
            });
        }

        return res.status(200).json({
            message: "Updated successfully",
            id: invId
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    } finally {
        conn.release();
    }
};

// Mark invoice as ready
// exports.markReady = async (req, res) => {
//     console.log('markReady req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     try {
//         // Try updating tbl_readyfor_labour first
//         const [result] = await pool.query('UPDATE tbl_readyfor_labour SET ready_status = 1 WHERE inv_id = ?', [req.params.id]);
//         if (result.affectedRows === 0) {
//             // Fallback to tbl_invoice_labour (unlikely in new flow but safe for migration)
//             await pool.query('UPDATE tbl_invoice_labour SET ready_status = 1 WHERE inv_id = ?', [req.params.id]);
//         }
//         res.json({ message: 'Marked as ready' });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

exports.markReady = async (req, res) => {
    try {
        const [result] = await pool.query(
            'CALL markReady(?)',
            [req.params.id]
        );
        const response = result[0][0];
        if (response.status === 0) {
            return res.status(404).json({
                message: response.message
            });
        }
        return res.json({
            message: response.message
        });
    } catch (err) {
        console.log("getFilterOptions error:", err);

        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};


// Get ready labour bills with pagination
// exports.getReadyLabourBills = async (req, res) => {
//     console.log('getReadyLabourBills req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     try {
//         const { page = 1, pageSize = 10, search = '', branchId } = req.query;
//         const offset = (parseInt(page) - 1) * parseInt(pageSize);
//         const limit = parseInt(pageSize);

//         let whereClause = 'WHERE i.status = 0 AND i.ready_status = 1';
//         const params = [];

//         if (branchId) {
//             whereClause += ' AND i.inv_branch = ?';
//             params.push(branchId);
//         }

//         if (search) {
//             whereClause += ' AND (i.in_registr LIKE ? OR i.inv_cus LIKE ? OR i.inv_job_card_no LIKE ? OR i.inv_no LIKE ?)';
//             const s = `%${search}%`;
//             params.push(s, s, s, s);
//         }

//         const countQuery = `SELECT COUNT(*) as total FROM tbl_readyfor_labour i ${whereClause}`;
//         const [countResult] = await pool.query(countQuery, params);
//         const total = countResult[0].total;

//         const dataQuery = `
//             SELECT i.inv_id, i.in_registr, i.inv_cus, i.inv_pho, i.inv_cus_addres, b.branch_name, i.inv_branch, i.inv_job_card_no, i.inv_no, i.in_engine, i.in_engine AS inv_engine, i.inv_jcard_date, i.inv_repair_typ, i.inv_modl, i.inv_total 
//             FROM tbl_readyfor_labour i 
//             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
//             ${whereClause} 
//             ORDER BY i.inv_id DESC 
//             LIMIT ? OFFSET ?
//         `;
//         console.log(dataQuery);
//         const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

//         res.json({ data: rows, total, page: parseInt(page), pageSize: limit });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

exports.getReadyLabourBills = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            search = '',
            branchId = null
        } = req.query;


        const [result] = await pool.query(
            "CALL getReadyLabourBills(?,?,?,?)",
            [
                parseInt(page),
                parseInt(pageSize),
                search,
                branchId || null
            ]
        );


        const total = result[0][0].total;
        const rows = result[1];


        res.json({
            data: rows,
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });


    } catch (err) {

        console.error("getReadyLabourBills error:", err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
};

// Get ready insurance bills with pagination not sp
// exports.getReadyInsuranceBills = async (req, res) => {
//     console.log('getReadyInsuranceBills req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     try {
//         const { page = 1, pageSize = 10, search = '', branchId } = req.query;
//         const offset = (parseInt(page) - 1) * parseInt(pageSize);
//         const limit = parseInt(pageSize);

//         let whereClause = 'WHERE i.status = 1 AND i.ready_status = 1';
//         const params = [];

//         if (branchId) {
//             whereClause += ' AND i.inv_branch = ?';
//             params.push(branchId);
//         }

//         if (search) {
//             whereClause += ' AND (i.in_registr LIKE ? OR i.inv_cus LIKE ? OR i.inv_job_card_no LIKE ? OR i.inv_no LIKE ?)';
//             const s = `%${search}%`;
//             params.push(s, s, s, s);
//         }

//         const countQuery = `SELECT COUNT(*) as total FROM tbl_readyfor_labour i ${whereClause}`;
//         const [countResult] = await pool.query(countQuery, params);
//         const total = countResult[0].total;

//         const dataQuery = `
//             SELECT i.inv_id, i.in_registr, i.inv_cus, i.inv_pho, i.inv_cus_addres, b.branch_name, i.inv_branch, i.inv_job_card_no, i.inv_no, i.in_engine, i.in_engine AS inv_engine, i.inv_jcard_date, i.inv_repair_typ, i.inv_modl, i.inv_total 
//             FROM tbl_readyfor_labour i 
//             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
//             ${whereClause} 
//             ORDER BY i.inv_id DESC 
//             LIMIT ? OFFSET ?
//         `;
//         const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

//         res.json({ data: rows, total, page: parseInt(page), pageSize: limit });
//     } catch (err) {
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

// Get ready insurance bills with pagination SP
exports.getReadyInsuranceBills = async (req, res) => {
    console.log('getReadyInsuranceBills_SP req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
    try {
        const { page = 1, pageSize = 10, search = '', branchId = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        const params = [
            branchId || null,
            search || null,
            limit,
            offset
        ];

        const [results] = await pool.query('CALL sp_getReadyInsuranceBills(?, ?, ?, ?)', params);

        // results[0] contains the COUNT result set, results[1] contains the DATA result set
        const total = results[0][0].total;
        const rows = results[1];

        res.json({ data: rows, total, page: parseInt(page), pageSize: limit });
    } catch (err) {
        console.error('getReadyInsuranceBills error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get next sequential invoice number string preview
exports.getNextInvoiceNo = async (req, res) => {
    console.log('getNextInvoiceNo req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
    try {
        const [lastInvRows] = await pool.query('SELECT inv_no FROM tbl_invoice_labour ORDER BY inv_id DESC LIMIT 1');
        let lastInvoiceNumber = '';
        if (lastInvRows.length > 0) {
            lastInvoiceNumber = lastInvRows[0].inv_no;
        }

        const today = new Date();
        const generatedPreview = generateNextInvoiceNumber(lastInvoiceNumber, today, 'CI', '11207');

        res.json({ nextNo: generatedPreview });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get labour names for dropdown
exports.getLabourNames = async (req, res) => {
    console.log('getLabourNames req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
    try {
        const [rows] = await pool.query('SELECT labour_title as l_name, sale_price as l_amount, labour_code as l_code FROM tbl_labour_code ORDER BY labour_title');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Finalize Bill not SP

// exports.finalizeBill = async (req, res) => {
//     console.log('finalizeBill req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
//     const conn = await pool.getConnection();
//     try {


//         // 1. Find the invoice in Ready table
//         const [readyInvoices] = await conn.query(
//             `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name, c.icompany_gst AS inv_insurance_gstin, c.icompany_address AS inv_insurance_address, lm.logo_url AS branch_logo_url 
//              FROM tbl_readyfor_labour i 
//              LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
//              LEFT JOIN logo_master lm ON b.logo = lm.logo_id
//              LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
//              LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
//              LEFT JOIN tbl_insurance_company c ON i.insurance_id = c.com_id
//              WHERE i.inv_id = ? AND i.ready_status = 1`,
//             [req.params.id]
//         );

//         if (readyInvoices.length === 0) {
//             // Already finalized or not found
//             // await conn.rollback();
//             // conn.release();
//             return res.status(200).json({ message: 'Bill already finalized or not found', inv_id: req.params.id });
//         }

//         let invoice = readyInvoices[0];
//         invoice.inv_advisername = invoice.adv_name || invoice.inv_advisername;
//         invoice.inv_mechna = invoice.mech_name || invoice.inv_mechna;

//         // 2. Fetch items 
//         const [items] = await conn.query('SELECT * FROM tbl_readyfor_bill WHERE ic_inv_id = ?', [req.params.id]);

//         // 3. Finalize it
//         // 1. Get the latest invoice number with an exclusive row lock
//         await conn.beginTransaction();
//         const [lastInvRows] = await conn.query('SELECT inv_no FROM tbl_invoice_labour ORDER BY inv_id DESC LIMIT 1 FOR UPDATE');
//         let lastInvoiceNumber = '';
//         if (lastInvRows.length > 0) {
//             lastInvoiceNumber = lastInvRows[0].inv_no;
//         }

//         // 2. Generate New Invoice Number dynamically
//         const today = new Date();
//         const generatedInvNo = generateNextInvoiceNumber(lastInvoiceNumber, today, 'CI', '11207');

//         // 3. Insert into tbl_invoice_labour with the generated invoice number
//         const finalizedStatus = (invoice.status === 0) ? 0 : 1;
//         const [insertResult] = await conn.query(
//             'INSERT INTO tbl_invoice_labour (inv_no, inv_cus, inv_cus_addres, inv_pho, inv_cus_gstin, inv_inv_date, inv_type, inv_job_card_no, inv_jcard_date, inv_repair_typ, inv_km, in_registr, inv_chassis, in_engine, inv_modl, inv_sale_date, inv_taxpay, inv_advisername, inv_mechna, inv_branch, inv_disc_total, inv_taxtotal, inv_sgstotal, inv_gsttotal, inv_total, status, ready_status, insurance_id, insurance_serveyor, inv_cesstotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [generatedInvNo, invoice.inv_cus, invoice.inv_cus_addres, invoice.inv_pho, invoice.inv_cus_gstin, invoice.inv_inv_date, invoice.inv_type, invoice.inv_job_card_no, invoice.inv_jcard_date, invoice.inv_repair_typ, invoice.inv_km, invoice.in_registr, invoice.inv_chassis, invoice.in_engine, invoice.inv_modl, invoice.inv_sale_date, invoice.inv_taxpay, invoice.inv_advisername, invoice.inv_mechna, invoice.inv_branch, invoice.inv_disc_total, invoice.inv_taxtotal, invoice.inv_sgstotal, invoice.inv_gsttotal, invoice.inv_total, finalizedStatus, 0, invoice.insurance_id || null, invoice.insurance_serveyor || '', invoice.inv_cesstotal || 0]
//         );
//         const newInvId = insertResult.insertId;

//         // Insert items into tbl_invoice_labour_cost
//         for (const item of items) {
//             await conn.query(
//                 'INSERT INTO tbl_invoice_labour_cost (ic_inv_id, lc_lab_code, lc_type, lc_lb_name, lc_sacode, lc_rate, lc_disc_p, lc_disc, lc_tax_amunt, lc_sgst_p, lc_sgst_a, lc_cgst_p, lc_cgst_a, lc_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//                 [newInvId, item.lc_lab_code, item.lc_type, item.lc_lb_name, item.lc_sacode, item.lc_rate, item.lc_disc_p, item.lc_disc, item.lc_tax_amunt, item.lc_sgst_p, item.lc_sgst_a, item.lc_cgst_p, item.lc_cgst_a, item.lc_amount]
//             );
//         }

//         // Update ready table
//         await conn.query('UPDATE tbl_readyfor_labour SET ready_status = 0 WHERE inv_id = ?', [req.params.id]);

//         await conn.commit();
//         res.json({ message: 'Bill finalized successfully', inv_id: newInvId });
//     } catch (err) {
//         await conn.rollback();
//         console.error('Finalize Bill error:', err);
//         res.status(500).json({ message: 'Server error', error: err.message });
//     } finally {
//         conn.release();
//     }
// };

// Finalize Bill SP

exports.finalizeBill = async (req, res) => {
    console.log('finalizeBill req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
    const d = req.body || {};
    const invId = req.params.id && req.params.id !== '0' ? parseInt(req.params.id, 10) : 0;

    try {
        const [result] = await pool.query(
            'CALL sp_finalizeBill(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                invId,
                d.inv_no || '',
                d.inv_cus || '',
                d.inv_cus_addres || '',
                d.inv_pho || '',
                d.inv_cus_gstin || d.inv_gstin || '',
                d.inv_inv_date || null,
                d.inv_type || 'Cash',
                d.inv_job_card_no || '',
                d.inv_jcard_date || null,
                d.inv_repair_typ || '',
                d.inv_km || d.inv_km_in || '',
                d.in_registr || '',
                d.inv_chassis || '',
                d.in_engine || d.inv_engine || '',
                d.inv_modl || '',
                d.inv_sale_date || '',
                d.inv_taxpay || '',
                d.inv_advisername || '',
                d.inv_mechna || '',
                d.inv_branch || '',
                d.inv_discount || 0,
                d.inv_taxable_total || d.inv_taxtotal || 0,
                d.inv_sgst || 0,
                d.inv_cgst || 0,
                d.inv_final_amount || d.inv_total || 0,
                d.inv_insurance_company || d.insurance_id || null,
                d.inv_surveyor || d.insurance_serveyor || '',
                d.status || 0,
                d.ready_status || 0,
                d.items && d.items.length ? JSON.stringify(d.items) : '[]'
            ]
        );

        const row = result && result[0] && result[0][0] ? result[0][0] : null;

        if (!row || row.invId === 0) {
            return res.status(400).json({ message: row ? row.message : 'Failed to finalize bill' });
        }

        res.json({ message: row.message, inv_id: row.invId });
    } catch (err) {
        console.error('Finalize Bill error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Generate PDF
exports.generatePDF = async (req, res) => {
    console.log('generatePDF req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
    const conn = await pool.getConnection();
    let connectionReleased = false;
    try {
        const [invoices] = await conn.query(
            `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name, c.icompany_gst AS inv_insurance_gstin, c.icompany_address AS inv_insurance_address, lm.logo_url AS branch_logo_url  
             FROM tbl_invoice_labour i 
             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN logo_master lm ON b.logo = lm.logo_id
             LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
             LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
             LEFT JOIN tbl_insurance_company c ON i.insurance_id = c.com_id
             WHERE i.inv_id = ?`,
            [req.params.id]
        );

        if (invoices.length === 0) {
            conn.release();
            connectionReleased = true;
            return res.status(404).json({ message: 'Not found' });
        }

        let invoice = invoices[0];
        invoice.inv_advisername = invoice.adv_name || invoice.inv_advisername;
        invoice.inv_mechna = invoice.mech_name || invoice.inv_mechna;

        const [items] = await conn.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);

        // Fetch active brand
        const [brandConfig] = await conn.query('SELECT * FROM tbl_brand_config WHERE brand_status = 1 LIMIT 1');
        if (brandConfig.length > 0) {
            invoice.active_brand = brandConfig[0].brand_name;
            invoice.active_brand_title = brandConfig[0].brand_title;
            invoice.active_brand_address = brandConfig[0].brand_address;
            invoice.active_brand_state = brandConfig[0].brand_state_code;
            invoice.active_brand_gstin = brandConfig[0].brand_gstin;
        } else {
            invoice.active_brand = '';
        }

        // Release connection BEFORE generating PDF
        conn.release();
        connectionReleased = true;

        const { generateInvoicePDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generateInvoicePDF(invoice, items);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoice.inv_no || invoice.inv_id} - invoice.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        if (!connectionReleased) {
            conn.release();
        }
    }
};

// Generate Word Document
exports.generateWord = async (req, res) => {
    console.log('generateWord req.body:', req.body, 'req.query:', req.query, 'req.params:', req.params);
    const conn = await pool.getConnection();
    let connectionReleased = false;
    try {
        const [invoices] = await conn.query(
            `SELECT i.*, b.branch_name, b.branch_address, b.branch_ph, a.e_first_name AS adv_name, m.e_first_name AS mech_name, c.icompany_gst AS inv_insurance_gstin, c.icompany_address AS inv_insurance_address, lm.logo_url AS branch_logo_url  
             FROM tbl_invoice_labour i 
             LEFT JOIN tbl_branch b ON b.b_id = i.inv_branch 
             LEFT JOIN logo_master lm ON b.logo = lm.logo_id
             LEFT JOIN tbl_employee a ON i.inv_advisername = a.emp_id
             LEFT JOIN tbl_employee m ON i.inv_mechna = m.emp_id
             LEFT JOIN tbl_insurance_company c ON i.insurance_id = c.com_id
             WHERE i.inv_id = ?`,
            [req.params.id]
        );

        if (invoices.length === 0) {
            conn.release();
            connectionReleased = true;
            return res.status(404).json({ message: 'Not found' });
        }

        let invoice = invoices[0];
        invoice.inv_advisername = invoice.adv_name || invoice.inv_advisername;
        invoice.inv_mechna = invoice.mech_name || invoice.inv_mechna;

        const [items] = await conn.query('SELECT * FROM tbl_invoice_labour_cost WHERE ic_inv_id = ?', [req.params.id]);

        // Fetch active brand
        const [brandConfig] = await conn.query('SELECT * FROM tbl_brand_config WHERE brand_status = 1 LIMIT 1');
        if (brandConfig.length > 0) {
            invoice.active_brand = brandConfig[0].brand_name;
            invoice.active_brand_title = brandConfig[0].brand_title;
            invoice.active_brand_address = brandConfig[0].brand_address;
            invoice.active_brand_state = brandConfig[0].brand_state_code;
            invoice.active_brand_gstin = brandConfig[0].brand_gstin;
        } else {
            invoice.active_brand = '';
        }

        // Release connection BEFORE generating Word doc
        conn.release();
        connectionReleased = true;

        const { generateInvoiceWord } = require('../utils/wordGenerator');
        const wordBuffer = await generateInvoiceWord(invoice, items);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.inv_no || invoice.inv_id} - invoice.docx"`);
        res.send(wordBuffer);
    } catch (err) {
        console.error('Word error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        if (!connectionReleased) {
            conn.release();
        }
    }
};
