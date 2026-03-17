import mysql from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'jiwika@199',
    database: process.env.DB_NAME || 'estate_central_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function query(sql: string, params?: any[]) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export const db = {
    query
};
