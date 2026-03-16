const pool = require('./config/db');
pool.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'").then(([rows]) => {
    console.log(rows);
    pool.end();
}).catch(console.error);
