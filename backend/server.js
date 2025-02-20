const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");  // ✅ Changed from PostgreSQL to MySQL

// ✅ Route Imports
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const transferRoutes = require("./routes/transferRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const creditCardRoutes = require("./routes/creditCardRoutes");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// ✅ MySQL Connection
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,         // From .env
    user: process.env.DB_USER,         // From .env
    password: process.env.DB_PASS,     // From .env
    database: process.env.DB_NAME,     // From .env
    port: process.env.DB_PORT || 3306  // Default MySQL port
});

// ✅ Check MySQL Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection error:", err);
        process.exit(1);
    }
    console.log("✅ Connected to AWS RDS MySQL!");
    connection.release();
});

// ✅ User ID Middleware (Token Extraction)
app.use((req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.id;
            console.log("✅ Extracted User ID:", req.userId);
        } catch (err) {
            console.warn("⚠️ Invalid or expired token.");
        }
    }
    next();
});

// ✅ Static Frontend Path
const frontendPath = path.join(__dirname, "../frontend/public");
app.use(express.static(frontendPath));

// ✅ Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/credit", creditCardRoutes);

// ✅ Serve customer.html
app.get("/customer.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "customer.html"));
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

module.exports = pool;  // Export pool for use in routes