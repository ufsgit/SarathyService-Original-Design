const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  // host: process.env.DB_HOST || 'DESKTOP-IK6ME8M',
  // user: process.env.DB_USER || 'root',
  // password: process.env.DB_PASSWORD || 'root',
  // database: process.env.DB_NAME || 'sarathynew_ser',
  //  host: process.env.DB_HOST || 'localhost',
  // user: process.env.DB_USER || 'root',
  // password: process.env.DB_PASSWORD || 'password',
  // database: process.env.DB_NAME || 'sarathi_service',

  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8'
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Connected successfullyyyy');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection failed:', err.message);
  });

module.exports = pool;
