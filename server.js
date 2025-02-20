const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");

// ✅ Route Imports
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const transferRoutes = require("./routes/transferRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const creditCardRoutes = require("./routes/creditCardRoutes");
const adminRoutes = require("./routes/adminRoutes");  // ✅ Added Admin Routes

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// ✅ MySQL Connection (Using Promises)
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
}).promise();

// ✅ Test Database Connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Connected to AWS RDS MySQL!");
        connection.release();
    } catch (err) {
        console.error("❌ Database connection error:", err.message);
        process.exit(1);
    }
})();

// ✅ User ID Middleware (Token Extraction)
app.use((req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;  // Attach decoded user to request
            console.log("✅ Extracted User ID:", req.user.id);
        } catch (err) {
            console.warn("⚠️ Invalid or expired token.");
        }
    }
    next();
});

// ✅ Static Frontend Path
const frontendPath = path.join(__dirname, "/frontend");
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
app.use("/api/admin", adminRoutes);  // ✅ Registered Admin Routes

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

module.exports = pool;