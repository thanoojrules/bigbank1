require("dotenv").config();
const mysql = require("mysql2");

// ✅ Create a MySQL Connection Pool
const pool = mysql.createPool({
    connectionLimit: 10, // Adjust as needed
    host: process.env.DB_HOST, // AWS RDS endpoint
    user: process.env.DB_USER, // MySQL username
    password: process.env.DB_PASS, // MySQL password
    database: process.env.DB_NAME, // MySQL database
    port: process.env.DB_PORT || 3306, // Default MySQL port
    ssl: { rejectUnauthorized: false } // Needed if AWS RDS requires SSL
});

// ✅ Test Database Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection error:", err.message);
        process.exit(1); // Exit if unable to connect
    } else {
        console.log("✅ Connected to AWS MySQL Database!");
        connection.release(); // Release the connection back to the pool
    }
});

// ✅ Export pool for use in other files
module.exports = pool;