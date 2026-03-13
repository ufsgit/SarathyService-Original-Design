const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log(`Connected to database: ${process.env.DB_NAME}`);

        // Check tables
        const [tables] = await connection.query('SHOW TABLES');
        const tableList = tables.map(r => Object.values(r)[0]);
        console.log('Tables present:', tableList);

        if (tableList.includes('customer_details')) {
            const [rows] = await connection.query('SELECT count(*) as count FROM customer_details');
            console.log(`Customer record count: ${rows[0].count}`);

            const [all] = await connection.query('SELECT c_name, c_reg_no FROM customer_details LIMIT 5');
            console.log('Sample records:', all);
        } else {
            console.log('Table customer_details NOT FOUND!');
        }

        await connection.end();
    } catch (err) {
        console.error('Test Error:', err.message);
    }
}

test();
