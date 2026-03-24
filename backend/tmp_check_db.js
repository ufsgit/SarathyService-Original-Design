require('dotenv').config();
const pool = require('./config/db');

async function checkSchema() {
    try {
        const [rows] = await pool.query('DESCRIBE tbl_branch');
        console.log('Columns in tbl_branch:');
        rows.forEach(row => console.log(`- ${row.Field}`));
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
