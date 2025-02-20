const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ Get upcoming reminders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [reminders] = await pool.query(
            `SELECT id, description, amount, due_date, status 
             FROM transactions 
             WHERE user_id = ? AND due_date >= CURDATE() 
             ORDER BY due_date ASC`, 
            [req.user.id]
        );

        res.json(reminders);
    } catch (error) {
        console.error('❌ Error fetching reminders:', error);
        res.status(500).json({ error: '❌ Server error' });
    }
});

// ✅ Mark reminder as paid
router.post('/mark-paid/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE transactions SET status = 'paid' WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        res.json({ message: '✅ Reminder marked as paid' });
    } catch (error) {
        console.error('❌ Error updating reminder:', error);
        res.status(500).json({ error: '❌ Server error' });
    }
});

module.exports = router;