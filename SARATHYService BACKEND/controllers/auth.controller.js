const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Unified Login
exports.login = async (req, res) => {
    console.log(req.body);
    try {
        const { username, password } = req.body;

        // Single unified query to check tbl_login
        const [rows] = await pool.query(
            `SELECT l.*, e.emp_id, e.e_first_name, e.e_branch, b.branch_name
             FROM tbl_login l
             LEFT JOIN tbl_employee e ON e.emp_login_id = l.login_id
             LEFT JOIN tbl_branch b ON b.b_id = e.e_branch
             WHERE l.uname = ?`, [username]
        );

        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.pwd);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const role = user.role_des === 'admin' ? 'admin' : 'staff';
        const name = user.e_first_name || (role === 'admin' ? 'Admin' : 'Staff');

        const token = jwt.sign(
            { id: user.login_id, empId: user.emp_id, role, branchId: user.e_branch, name },
            process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const userData = {
            id: user.login_id,
            username: user.uname,
            name,
            role,
        };

        if (role === 'staff') {
            userData.empId = user.emp_id;
            userData.branchId = user.e_branch;
            userData.branchName = user.branch_name;
        }

        return res.json({
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change admin password
exports.changeAdminPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const [rows] = await pool.query('SELECT * FROM admin_info WHERE admin_id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await bcrypt.compare(oldPassword, rows[0].admin_password);
        if (!isMatch) return res.status(401).json({ message: 'Old password incorrect' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE admin_info SET admin_password = ? WHERE admin_id = ?', [hashed, req.user.id]);
        res.json({ message: 'Password changed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Change staff password
exports.changeStaffPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const [rows] = await pool.query('SELECT * FROM login_details WHERE lg_id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Staff not found' });

        const isMatch = await bcrypt.compare(oldPassword, rows[0].login_password);
        if (!isMatch) return res.status(401).json({ message: 'Old password incorrect' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE login_details SET login_password = ? WHERE lg_id = ?', [hashed, req.user.id]);
        res.json({ message: 'Password changed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get profile
exports.getProfile = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const [rows] = await pool.query('SELECT admin_id, admin_username, admin_name, admin_email FROM admin_info WHERE admin_id = ?', [req.user.id]);
            return res.json(rows[0]);
        }
        const [rows] = await pool.query(
            `SELECT ld.lg_id, ld.login_id, e.e_first_name, e.e_branch, b.branch_name
       FROM login_details ld
       LEFT JOIN tbl_employee e ON e.emp_id = ld.emp_id
       LEFT JOIN tbl_branch b ON b.b_id = e.e_branch
       WHERE ld.lg_id = ?`, [req.user.id]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
