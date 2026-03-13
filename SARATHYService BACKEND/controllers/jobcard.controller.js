const pool = require('../config/db');

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
