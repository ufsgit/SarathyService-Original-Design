require('dotenv').config();
const pool = require('./config/db');

async function checkSchema() {
  try {
    console.log('--- tbl_login columns ---');
    const [loginCols] = await pool.query('SHOW COLUMNS FROM tbl_login');
    console.log(loginCols.map(c => c.Field));

    console.log('--- checking user kollamws.d11207 ---');
    const [userRows] = await pool.query(`
      SELECT l.uname, e.e_first_name, e.e_designation, e.status
      FROM tbl_login l
      LEFT JOIN tbl_employee e ON e.emp_login_id = l.login_id
      WHERE l.uname = 'kollamws.d11207'
    `);
    console.log(userRows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
