const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    const connection = await mysql.createConnection({
        host: 'DESKTOP-IK6ME8M',
        user: 'root',
        password: 'root',
        multipleStatements: true
    });

    console.log('Connected to MySQL...');
    const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
    await connection.query(schema);
    console.log('✅ Schema executed successfully! All tables created.');
    await connection.end();
}

runSchema().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
