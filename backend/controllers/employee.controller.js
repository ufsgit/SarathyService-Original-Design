const pool = require('../config/db');

// Get all employees
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.*, b.branch_name FROM tbl_employee e 
       LEFT JOIN tbl_branch b ON b.b_id = e.e_branch 
       ORDER BY e.emp_id DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single employee
exports.getById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.*, b.branch_name FROM tbl_employee e 
       LEFT JOIN tbl_branch b ON b.b_id = e.e_branch 
       WHERE e.emp_id = ?`, [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create employee
exports.create = async (req, res) => {
    try {
        const { e_first_name, emp_intial, e_address, e_mobile, e_email, e_designation, e_branch, e_code, login_id, login_password } = req.body;
        const [result] = await pool.query(
            'INSERT INTO tbl_employee (e_first_name, emp_intial, e_address, e_mobile, e_email, e_designation, e_branch, e_code, status) VALUES (?,?,?,?,?,?,?,?,1)',
            [e_first_name, emp_intial || null, e_address || null, e_mobile || null, e_email || null, e_designation || null, e_branch || null, e_code || null]
        );
        // Create login if login_id provided
        if (login_id && login_password) {
            const bcrypt = require('bcryptjs');
            const hashed = await bcrypt.hash(login_password, 10);
            await pool.query(
                'INSERT INTO login_details (login_id, login_password, emp_id, login_status, login_type, login_branch) VALUES (?,?,?,1,?,?)',
                [login_id, hashed, result.insertId, 'staff', e_branch || null]
            );
        }
        res.status(201).json({ message: 'Employee created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update employee
exports.update = async (req, res) => {
    try {
        const { e_first_name, emp_intial, e_address, e_mobile, e_email, e_designation, e_branch, e_code } = req.body;
        await pool.query(
            'UPDATE tbl_employee SET e_first_name=?, emp_intial=?, e_address=?, e_mobile=?, e_email=?, e_designation=?, e_branch=?, e_code=? WHERE emp_id=?',
            [e_first_name, emp_intial, e_address, e_mobile, e_email, e_designation, e_branch, e_code, req.params.id]
        );
        res.json({ message: 'Employee updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update employee status
exports.updateStatus = async (req, res) => {
    try {
        await pool.query('UPDATE tbl_employee SET status = ? WHERE emp_id = ?', [req.body.status, req.params.id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete employee
exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM login_details WHERE emp_id = ?', [req.params.id]);
        await pool.query('DELETE FROM tbl_employee WHERE emp_id = ?', [req.params.id]);
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get login details for employee
exports.getLogin = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT lg_id, login_id, login_status FROM login_details WHERE emp_id = ?', [req.params.id]);
        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update login credentials
exports.updateLogin = async (req, res) => {
    try {
        const { login_id, login_password } = req.body;
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(login_password, 10);
        await pool.query('UPDATE login_details SET login_id = ?, login_password = ? WHERE emp_id = ?', [login_id, hashed, req.params.id]);
        res.json({ message: 'Login updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get mechanics (optionally filtered by branch)
exports.getMechanics = async (req, res) => {
    try {
        const { branchId } = req.query;
        let query = `SELECT e.emp_id, e.e_first_name, e.e_code 
            FROM tbl_employee e 
            WHERE e.e_designation = 'Mechanic' AND e.status = 'active'`;
        const params = [];
        if (branchId) {
            query += ` AND e.e_branch = (SELECT branch_name FROM tbl_branch WHERE b_id = ? LIMIT 1)`;
            params.push(branchId);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get advisors (optionally filtered by branch)
exports.getAdvisors = async (req, res) => {
    try {
        const { branchId } = req.query;
        let query = `SELECT e.emp_id, e.e_first_name, e.e_code 
            FROM tbl_employee e 
            WHERE e.e_designation = 'Service Advisor' AND e.status = 'active'`;
        const params = [];
        if (branchId) {
            query += ` AND e.e_branch = (SELECT branch_name FROM tbl_branch WHERE b_id = ? LIMIT 1)`;
            params.push(branchId);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
