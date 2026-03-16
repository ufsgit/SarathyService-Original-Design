const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'DESKTOP-IK6ME8M',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'sarathynew_ser',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8'
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection failed:', err.message);
  });

module.exports = pool;
