const pool = require('./config/db');

async function checkPatterns() {
    try {
        const [rows] = await pool.query('SELECT inv_job_card_no, inv_jcard_date FROM tbl_invoice_labour ORDER BY inv_id DESC LIMIT 10');
        console.log('Recent Job Cards:', rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPatterns();
