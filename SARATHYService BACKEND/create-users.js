const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // Create Staff - find a branch
    const [branches] = await pool.query('SELECT b_id FROM tbl_branch LIMIT 1');
    let branchId;
    if (branches.length === 0) {
        const [result] = await pool.query("INSERT INTO tbl_branch (branch_name, branch_code) VALUES ('Main Branch', 'MAIN')");
        branchId = result.insertId;
        console.log('Created default branch: Main Branch');
    } else {
        branchId = branches[0].b_id;
    }

    // Create employee (using actual column names from existing DB)
    const [existingEmp] = await pool.query("SELECT emp_id FROM tbl_employee WHERE e_first_name = 'Staff User'");
    let empId;
    if (existingEmp.length === 0) {
        const [empResult] = await pool.query(
            'INSERT INTO tbl_employee (e_first_name, e_mobile, e_designation, e_branch, status) VALUES (?, ?, ?, ?, ?)',
            ['Staff User', '9876543210', 'Staff', branchId, 1]
        );
        empId = empResult.insertId;
    } else {
        empId = existingEmp[0].emp_id;
    }

    // Create staff login
    const staffPass = await bcrypt.hash('staff123', 10);
    await pool.query(
        'INSERT INTO login_details (login_id, login_password, emp_id, login_status, login_type, login_branch) VALUES (?, ?, ?, 1, ?, ?) ON DUPLICATE KEY UPDATE login_password = VALUES(login_password)',
        ['staff', staffPass, empId, 'staff', branchId]
    );
    console.log('Staff created:  username = staff  |  password = staff123');

    await pool.end();
    console.log('Done!');
})().catch(e => console.error('Error:', e.message));
