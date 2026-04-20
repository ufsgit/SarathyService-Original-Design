const pool = require('../config/db');
const { getFinancialYearPrefix, generateNextJobCardNo } = require('../utils/jobCardHelper');

// Create job card (links customer to invoice via job card fields)
exports.create = async (req, res) => {
    try {
        const {
            inv_job_card_no, in_registr, inv_cus, inv_cus_addres, inv_pho,
            inv_modl, inv_chassis, inv_engine, inv_km,
            inv_jcard_date, inv_mechna, inv_advisername, inv_branch,
            inv_repair_typ, inv_service_typ, inv_customer_voice
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO tbl_invoice_labour (inv_job_card_no, in_registr, inv_cus, inv_cus_addres, inv_pho,
       inv_modl, inv_chassis, in_engine, inv_km, inv_jcard_date,
       inv_mechna, inv_advisername, inv_branch, inv_repair_typ, inv_service_typ, inv_customer_voice, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
            [inv_job_card_no, in_registr, inv_cus, inv_cus_addres, inv_pho,
                inv_modl, inv_chassis, inv_engine, inv_km, inv_jcard_date,
                inv_mechna, inv_advisername, inv_branch, inv_repair_typ, inv_service_typ, inv_customer_voice]
        );

        res.status(201).json({ message: 'Job card created successfully', id: result.insertId });
    } catch (error) {
        console.error('Create job card error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// List job cards
exports.getAll = async (req, res) => {
    try {
        const branchId = req.query.branchId;
        let query = `SELECT il.*, b.branch_name, e1.e_first_name AS adviser, e2.e_first_name AS mechanic
                 FROM tbl_invoice_labour il
                 LEFT JOIN tbl_branch b ON b.b_id = il.inv_branch
                 LEFT JOIN tbl_employee e1 ON e1.emp_id = il.inv_advisername
                 LEFT JOIN tbl_employee e2 ON e2.emp_id = il.inv_mechna
                 WHERE 1=1`;
        let params = [];
        if (branchId) { query += ' AND il.inv_branch = ?'; params.push(branchId); }
        query += ' ORDER BY il.inv_id DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single job card
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT il.*, b.branch_name, e1.e_first_name AS adviser, e2.e_first_name AS mechanic
       FROM tbl_invoice_labour il
       LEFT JOIN tbl_branch b ON b.b_id = il.inv_branch
       LEFT JOIN tbl_employee e1 ON e1.emp_id = il.inv_advisername
       LEFT JOIN tbl_employee e2 ON e2.emp_id = il.inv_mechna
       WHERE il.inv_id = ?`, [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Job card not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if job card number is unique
exports.checkJobCardNo = async (req, res) => {
    try {
        const { job_card_no } = req.body;
        const [rows] = await pool.query('SELECT inv_id FROM tbl_invoice_labour WHERE inv_job_card_no = ?', [job_card_no]);
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get next available job card number based on financial year
 */
exports.getNextNumber = async (req, res) => {
    try {
        const { date } = req.query; // Optional date, defaults to today
        const nextNo = await generateNextJobCardNo(date || new Date());
        res.json({ nextNumber: nextNo });
    } catch (error) {
        console.error('Error generating next job card no:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Validate all existing job card numbers against their dates
 */
exports.validateJobCards = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT inv_id, inv_job_card_no, inv_jcard_date FROM tbl_invoice_labour');
        
        const mismatches = rows.filter(row => {
            if (!row.inv_job_card_no || !row.inv_jcard_date) return false;
            const expectedPrefix = getFinancialYearPrefix(row.inv_jcard_date);
            const actualPrefix = String(row.inv_job_card_no).substring(0, 2);
            return expectedPrefix !== actualPrefix;
        });

        const duplicates = [];
        const seen = new Set();
        rows.forEach(row => {
            if (row.inv_job_card_no) {
                if (seen.has(row.inv_job_card_no)) {
                    duplicates.push(row);
                }
                seen.add(row.inv_job_card_no);
            }
        });

        res.json({
            totalChecked: rows.length,
            mismatchCount: mismatches.length,
            duplicateCount: duplicates.length,
            mismatches: mismatches.map(m => ({
                id: m.inv_id,
                jobCardNo: m.inv_job_card_no,
                date: m.inv_jcard_date,
                expectedPrefix: getFinancialYearPrefix(m.inv_jcard_date),
                actualPrefix: String(m.inv_job_card_no).substring(0, 2)
            })),
            duplicates: duplicates.map(d => ({
                id: d.inv_id,
                jobCardNo: d.inv_job_card_no
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Correct mismatched job card numbers (Dangerous operation, creates a report first)
 */
exports.fixJobCardNumbers = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query('SELECT inv_id, inv_job_card_no, inv_jcard_date FROM tbl_invoice_labour');
        
        let updateCount = 0;
        for (const row of rows) {
            if (!row.inv_job_card_no || !row.inv_jcard_date) continue;
            const expectedPrefix = getFinancialYearPrefix(row.inv_jcard_date);
            const actualPrefix = String(row.inv_job_card_no).substring(0, 2);
            
            if (expectedPrefix !== actualPrefix) {
                const newNo = expectedPrefix + String(row.inv_job_card_no).substring(2);
                await conn.query('UPDATE tbl_invoice_labour SET inv_job_card_no = ? WHERE inv_id = ?', [newNo, row.inv_id]);
                updateCount++;
            }
        }
        
        await conn.commit();
        res.json({ message: 'Correction complete', updatedRecords: updateCount });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        conn.release();
    }
};
