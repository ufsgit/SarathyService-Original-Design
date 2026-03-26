const pool = require('./config/db');
async function check() {
    try {
        const [rows] = await pool.query('SELECT inv_branch, COUNT(*) as count FROM tbl_invoice_labour GROUP BY inv_branch');
        console.log('inv_branch values:', rows);
        const [branches] = await pool.query('SELECT b_id, branch_id, branch_name FROM tbl_branch');
        console.log('Branches:', branches);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
