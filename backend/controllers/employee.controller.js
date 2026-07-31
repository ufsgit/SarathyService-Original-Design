const pool = require('../config/db');

// Get all employees
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.*, COALESCE(b.branch_name, e.e_branch) AS branch_name FROM tbl_employee e 
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
            `SELECT e.*, COALESCE(b.branch_name, e.e_branch) AS branch_name, l.uname AS login_id 
       FROM tbl_employee e 
       LEFT JOIN tbl_branch b ON b.b_id = e.e_branch 
       LEFT JOIN tbl_login l ON l.login_id = e.emp_login_id
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
        const { e_first_name, emp_intial, e_address, e_mobile, e_email, e_designation, e_branch, e_code, login_id, login_password, add_as_user } = req.body;

        if (!e_first_name) return res.status(400).json({ message: 'Name is required' });
        if (!e_branch) return res.status(400).json({ message: 'Branch Name is required' });
        if (!e_code) return res.status(400).json({ message: 'Employee Code is required' });
        if (!e_designation) return res.status(400).json({ message: 'Employee Designation is required' });
        if (add_as_user) {
            if (!login_id) return res.status(400).json({ message: 'Username is required' });
            if (!login_password) return res.status(400).json({ message: 'Password is required' });
        }

        // Check duplicate employee code
        const [codeCheck] = await pool.query('SELECT emp_id FROM tbl_employee WHERE e_code = ?', [e_code]);
        if (codeCheck.length > 0) return res.status(409).json({ message: 'Employee Code already exists' });

        // Check duplicate username in tbl_login
        const [userCheck] = await pool.query('SELECT login_id FROM tbl_login WHERE uname = ?', [login_id]);
        if (userCheck.length > 0) return res.status(409).json({ message: 'Username already exists' });

        const [result] = await pool.query(
            'INSERT INTO tbl_employee (e_first_name, emp_intial, e_address, e_mobile, e_email, e_designation, e_branch, e_code, status) VALUES (?,?,?,?,?,?,?,?,?)',
            [e_first_name, emp_intial || '', e_address || '', e_mobile || '', e_email || '', e_designation || '', e_branch || '', e_code || '', 'active']
        );
        // Create login if login_id provided
        if (login_id && login_password) {
            const bcrypt = require('bcryptjs');
            const hashed = await bcrypt.hash(login_password, 10);
            const [loginResult] = await pool.query(
                'INSERT INTO tbl_login (uname, pwd, role, role_des) VALUES (?, ?, 2, ?)',
                [login_id, hashed, 'employee']
            );
            await pool.query(
                'UPDATE tbl_employee SET emp_login_id = ? WHERE emp_id = ?',
                [loginResult.insertId, result.insertId]
            );
        }
        res.status(201).json({ message: 'Employee created', id: result.insertId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update employee
exports.update = async (req, res) => {
    try {
        const { e_first_name, emp_intial, e_address, e_mobile, e_email, e_designation, e_branch, e_code, login_id, login_password, add_as_user } = req.body;
        const id = req.params.id;

        if (!e_first_name) return res.status(400).json({ message: 'Name is required' });
        if (!e_branch) return res.status(400).json({ message: 'Branch Name is required' });
        if (!e_code) return res.status(400).json({ message: 'Employee Code is required' });
        if (!e_designation) return res.status(400).json({ message: 'Employee Designation is required' });
        if (add_as_user && !login_id) return res.status(400).json({ message: 'Username is required' });
        // login_password might be handled as: if provided, update it. 
        // But user said "Password... are required". 

        // Check duplicate employee code
        const [codeCheck] = await pool.query('SELECT emp_id FROM tbl_employee WHERE e_code = ? AND emp_id != ?', [e_code, id]);
        if (codeCheck.length > 0) return res.status(409).json({ message: 'Employee Code already exists' });

        // Get employee to find login_id
        const [emp] = await pool.query('SELECT emp_login_id FROM tbl_employee WHERE emp_id = ?', [id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee not found' });
        const loginRecordId = emp[0].emp_login_id;

        // Check duplicate username in tbl_login
        if (add_as_user && loginRecordId) {
            const [userCheck] = await pool.query('SELECT login_id FROM tbl_login WHERE uname = ? AND login_id != ?', [login_id, loginRecordId]);
            if (userCheck.length > 0) return res.status(409).json({ message: 'Username already exists' });
        }

        await pool.query(
            'UPDATE tbl_employee SET e_first_name=?, emp_intial=?, e_address=?, e_mobile=?, e_email=?, e_designation=?, e_branch=?, e_code=? WHERE emp_id=?',
            [e_first_name, emp_intial || '', e_address || '', e_mobile || '', e_email || '', e_designation || '', e_branch || '', e_code || '', id]
        );

        // Update login info
        if (loginRecordId) {
            if (!add_as_user) {
                await pool.query('UPDATE tbl_employee SET emp_login_id = NULL WHERE emp_id = ?', [id]);
                await pool.query('DELETE FROM tbl_login WHERE login_id = ?', [loginRecordId]);
            } else {
                if (login_password) {
                    const bcrypt = require('bcryptjs');
                    const hashed = await bcrypt.hash(login_password, 10);
                    await pool.query('UPDATE tbl_login SET uname = ?, pwd = ? WHERE login_id = ?', [login_id, hashed, loginRecordId]);
                } else if (login_id) {
                    await pool.query('UPDATE tbl_login SET uname = ? WHERE login_id = ?', [login_id, loginRecordId]);
                }
            }
        } else if (add_as_user && login_id) {
            if (!login_password) return res.status(400).json({ message: 'Password is required to create a new user account' });
            
            const [userCheck] = await pool.query('SELECT login_id FROM tbl_login WHERE uname = ?', [login_id]);
            if (userCheck.length > 0) return res.status(409).json({ message: 'Username already exists' });

            const bcrypt = require('bcryptjs');
            const hashed = await bcrypt.hash(login_password, 10);
            const [loginResult] = await pool.query(
                'INSERT INTO tbl_login (uname, pwd, role, role_des) VALUES (?, ?, 2, ?)',
                [login_id, hashed, 'employee']
            );
            await pool.query(
                'UPDATE tbl_employee SET emp_login_id = ? WHERE emp_id = ?',
                [loginResult.insertId, id]
            );
        }

        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error('Update employee error:', err);
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
            query += ` AND (e.e_branch = ? OR e.e_branch = (SELECT branch_name FROM tbl_branch WHERE b_id = ? LIMIT 1))`;
            params.push(branchId, branchId);
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
            query += ` AND (e.e_branch = ? OR e.e_branch = (SELECT branch_name FROM tbl_branch WHERE b_id = ? LIMIT 1))`;
            params.push(branchId, branchId);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get paginated employees
exports.getPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        let query = `SELECT e.*, COALESCE(b.branch_name, e.e_branch) AS branch_name FROM tbl_employee e LEFT JOIN tbl_branch b ON b.b_id = e.e_branch`;
        let countQuery = `SELECT COUNT(*) as total FROM tbl_employee e LEFT JOIN tbl_branch b ON b.b_id = e.e_branch`;
        let params = [];
        
        if (search) {
            const searchClause = ` WHERE e.e_first_name LIKE ? OR e.e_code LIKE ? OR e.e_email LIKE ? OR b.branch_name LIKE ? OR e.e_designation LIKE ?`;
            query += searchClause;
            countQuery += searchClause;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY e.emp_id DESC LIMIT ? OFFSET ?';
        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query(countQuery, params.slice(0, search ? 5 : 0));
        
        res.json({
            data: rows,
            total: countResult[0].total,
            page: page,
            limit: limit
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
