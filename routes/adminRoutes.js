const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/db');

// ✅ Middleware to check if the user is an admin
async function adminCheck(req, res, next) {
    try {
        const userId = req.userId;  // Ensure userId is extracted from JWT
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized. Token invalid or missing." });
        }

        const [adminQuery] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);

        if (adminQuery.length === 0 || adminQuery[0].role !== 'admin') {
            return res.status(403).json({ error: '🚫 Access denied. Admins only.' });
        }

        next();
    } catch (error) {
        console.error("❌ Admin Check Error:", error);
        res.status(500).json({ error: 'Server error during admin check' });
    }
}

// ✅ Get all users (Admin Only)
router.get('/users', authMiddleware, adminCheck, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, role, balance FROM users ORDER BY id ASC');
        res.json(users);
    } catch (error) {
        console.error("❌ Fetch Users Error:", error);
        res.status(500).json({ error: 'Server error while fetching users' });
    }
});

// ✅ Get all transactions (Admin Only)
router.get('/transactions', authMiddleware, adminCheck, async (req, res) => {
    try {
        const [transactions] = await pool.query(`
            SELECT t.id, u.email AS user_email, t.type, t.amount, t.created_at
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(transactions);
    } catch (error) {
        console.error("❌ Fetch Transactions Error:", error);
        res.status(500).json({ error: 'Server error while fetching transactions' });
    }
});

// ✅ Update user role (Admin Only)
router.put('/users/:id/role', authMiddleware, adminCheck, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ error: "🚨 Invalid role. Choose 'user' or 'admin'." });
        }

        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        res.json({ message: '✅ User role updated successfully' });
    } catch (error) {
        console.error("❌ Update Role Error:", error);
        res.status(500).json({ error: 'Server error while updating role' });
    }
});

// ✅ Update User Password (Admin Only, Plain Text)
router.put('/users/:id/password', authMiddleware, adminCheck, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.params.id;

        if (!password) {
            return res.status(400).json({ error: "🚨 Password is required." });
        }

        // ✅ Update password as plain text
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, userId]);
        res.json({ message: '✅ User password updated successfully.' });
    } catch (error) {
        console.error("❌ Update Password Error:", error);
        res.status(500).json({ error: 'Server error while updating password.' });
    }
});

// ✅ Delete user (Admin Only, cannot delete self)
router.delete('/users/:id', authMiddleware, adminCheck, async (req, res) => {
    try {
        const userId = req.params.id;
        if (userId == req.userId) {
            return res.status(400).json({ error: "🚫 You cannot delete yourself!" });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: '✅ User deleted successfully.' });
    } catch (error) {
        console.error("❌ Delete User Error:", error);
        res.status(500).json({ error: 'Server error while deleting user.' });
    }
});

module.exports = router;