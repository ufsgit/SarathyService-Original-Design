require('dotenv').config();
const pool = require('./config/db');

async function checkSchema() {
    const tables = ['tbl_readyfor_labour', 'tbl_invoice_labour', 'tbl_readyfor_bill', 'tbl_invoice_labour_cost'];
    try {
        for (const table of tables) {
            console.log(`\nColumns in ${table}:`);
            const [rows] = await pool.query(`DESCRIBE ${table}`);
            rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
        }
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
