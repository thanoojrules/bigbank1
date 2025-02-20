const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");

dotenv.config();
const app = express();
app.use(express.json());

// 🌐 CORS Configuration (Allow all origins for now)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ MySQL Connection
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

// ✅ API Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "✅ API is running smoothly!" });
});

// ✅ Auth Route Example
app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "test@example.com" && password === "Password@123") {
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login successful!", token });
    } else {
        res.status(401).json({ error: "Invalid email or password." });
    }
});

// ✅ Static Frontend Path
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ Serve index.html for SPA
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));