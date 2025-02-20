const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Transfer Money API
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { recipientEmail, amount } = req.body;
        const senderId = req.user.id;

        if (!recipientEmail || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "❌ Invalid recipient email or amount!" });
        }

        console.log(`📌 Transfer Request: SenderID=${senderId}, Recipient=${recipientEmail}, Amount=${amount}`);

        // ✅ Check recipient exists
        const [recipientQuery] = await pool.query("SELECT id FROM users WHERE email = ?", [recipientEmail]);
        if (recipientQuery.length === 0) {
            console.log(`❌ Recipient Not Found: ${recipientEmail}`);
            return res.status(400).json({ error: "❌ Recipient not found!" });
        }
        const recipientId = recipientQuery[0].id;

        if (recipientId === senderId) {
            console.log("❌ Self-transfer Attempt Blocked");
            return res.status(400).json({ error: "❌ You cannot send money to yourself!" });
        }

        // ✅ Check sender balance
        const [senderBalanceQuery] = await pool.query("SELECT balance FROM users WHERE id = ?", [senderId]);
        if (senderBalanceQuery.length === 0) {
            console.log("❌ Sender Not Found");
            return res.status(400).json({ error: "❌ Sender not found!" });
        }
        const senderBalance = parseFloat(senderBalanceQuery[0].balance);

        if (senderBalance < amount) {
            console.log("❌ Insufficient Balance");
            return res.status(400).json({ error: "❌ Insufficient balance!" });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // ✅ Deduct from sender
            await connection.query("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, senderId]);

            // ✅ Add to recipient
            await connection.query("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, recipientId]);

            // ✅ Insert Transaction
            const [transaction] = await connection.query(
                `INSERT INTO transactions (user_id, transaction_type, amount, recipient_id, fraud_flag, status, created_at) 
                 VALUES (?, 'transfer', ?, ?, false, 'completed', NOW())`,
                [senderId, amount, recipientId]
            );

            // ✅ Insert Notifications
            await connection.query(
                `INSERT INTO notifications (user_id, message, created_at) VALUES 
                 (?, ?, NOW()), 
                 (?, ?, NOW())`,
                [
                    senderId, `You sent $${amount} to ${recipientEmail}.`,
                    recipientId, `You received $${amount} from ${req.user.email}.`
                ]
            );

            await connection.commit();
            console.log(`✅ Transfer Successful: Sender=${senderId}, Recipient=${recipientId}, Amount=$${amount}`);

            res.json({
                message: "✅ Transfer successful!",
                updatedBalance: senderBalance - amount
            });
        } catch (error) {
            await connection.rollback();
            console.error("❌ Transaction Error:", error);
            res.status(500).json({ error: "❌ Internal server error during transaction!" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("❌ Transfer Error:", error);
        res.status(500).json({ error: "❌ Internal server error!" });
    }
});

module.exports = router;