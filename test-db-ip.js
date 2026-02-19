const { Client } = require('pg');

// Using one of the IPs that resolved earlier
const connectionString = "postgresql://neondb_owner:npg_X7xRpT1gPVUt@18.215.6.120:5432/neondb?sslmode=require";

async function testConnection() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        console.log('Connecting to database via IP...');
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
