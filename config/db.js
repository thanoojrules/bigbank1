require("dotenv").config();
const mysql = require("mysql2/promise");  // ✅ Use 'mysql2/promise' for async/await

// ✅ Create a MySQL Connection Pool with Promises
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,         // AWS RDS endpoint
    user: process.env.DB_USER,         // MySQL username
    password: process.env.DB_PASS,     // MySQL password
    database: process.env.DB_NAME,     // MySQL database name
    port: process.env.DB_PORT || 3306, // Default MySQL port
    ssl: { rejectUnauthorized: false } // Needed if AWS RDS requires SSL
});

// ✅ Test Database Connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Connected to AWS MySQL Database!");
        connection.release();
    } catch (err) {
        console.error("❌ Database connection error:", err.message);
        process.exit(1);
    }
})();

// ✅ Export pool for use in other files
module.exports = pool;