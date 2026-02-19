const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_X7xRpT1gPVUt@ep-muddy-sky-ahty71s6.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30";

async function testConnection() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        console.log('Connecting to database (direct)...');
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0].now);
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.end();
    }
}

testConnection();
