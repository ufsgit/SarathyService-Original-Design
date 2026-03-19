require('dotenv').config({ path: 'c:/Users/AKSHARA T K/OneDrive/Documents/GitHub/SarathyService-Original-Design/backend/.env' });
const pool = require('c:/Users/AKSHARA T K/OneDrive/Documents/GitHub/SarathyService-Original-Design/backend/config/db');

async function checkSchema() {
  try {
    console.log('--- tbl_login columns ---');
    const [loginCols] = await pool.query('SHOW COLUMNS FROM tbl_login');
    console.log(loginCols.map(c => c.Field));

    console.log('--- tbl_employee columns ---');
    const [empCols] = await pool.query('SHOW COLUMNS FROM tbl_employee');
    console.log(empCols.map(c => c.Field));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
