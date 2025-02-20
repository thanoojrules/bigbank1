const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();

// 🔑 Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// ✅ User Signup
router.post("/signup", async (req, res) => {
    const { name, email, password, role = "user" } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "❌ Name, email, and password are required!" });
    }

    try {
        // ✅ Check if user exists
        const [existingUser] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "❌ User already exists!" });
        }

        // ✅ Insert new user
        const [result] = await pool.query(
            "INSERT INTO users (name, email, password, role, balance, savings) VALUES (?, ?, ?, ?, 2000.00, 1000.00)",
            [name, email, password, role]
        );

        if (result.affectedRows === 1) {
            // ✅ Generate JWT token
            const token = jwt.sign({ id: result.insertId, email, role }, JWT_SECRET, { expiresIn: "1h" });
            res.json({ message: "✅ User registered successfully!", token });
        } else {
            res.status(500).json({ error: "❌ Failed to register user." });
        }
    } catch (error) {
        console.error("❌ Signup Error:", error.message);
        res.status(500).json({ error: `❌ Server error during signup: ${error.message}` });
    }
});

// ✅ User Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "❌ Email and password are required!" });
    }

    try {
        const [users] = await pool.query("SELECT id, name, email, password, role FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: "❌ User not found!" });
        }

        const user = users[0];

        // ✅ Plain text password comparison
        if (user.password !== password) {
            return res.status(401).json({ error: "❌ Invalid credentials!" });
        }

        // ✅ Generate JWT Token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        console.log("✅ Login successful! Token:", token);

        // ✅ Send back user info and token
        res.json({
            message: "✅ Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("❌ Login Error:", error.message);
        res.status(500).json({ error: "❌ Server error during login." });
    }
});
module.exports = router;