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

        // ✅ Check if recipient exists
        const recipientQuery = await pool.query("SELECT id FROM users WHERE email = $1", [recipientEmail]);
        if (recipientQuery.rows.length === 0) {
            console.log(`❌ Recipient Not Found: ${recipientEmail}`);
            return res.status(400).json({ error: "❌ Recipient not found!" });
        }
        const recipientId = recipientQuery.rows[0].id;

        if (recipientId === senderId) {
            console.log("❌ Self-transfer Attempt Blocked");
            return res.status(400).json({ error: "❌ You cannot send money to yourself!" });
        }

        // ✅ Check sender balance
        const senderBalanceQuery = await pool.query("SELECT balance FROM users WHERE id = $1", [senderId]);
        if (senderBalanceQuery.rows.length === 0) {
            console.log("❌ Sender Not Found");
            return res.status(400).json({ error: "❌ Sender not found!" });
        }
        const senderBalance = parseFloat(senderBalanceQuery.rows[0].balance);

        if (senderBalance < amount) {
            console.log("❌ Insufficient Balance");
            return res.status(400).json({ error: "❌ Insufficient balance!" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // ✅ Deduct from sender
            await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, senderId]);
            // ✅ Add to recipient
            await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, recipientId]);

            // ✅ Insert Transaction Record
            const transaction = await client.query(
                `INSERT INTO transactions (user_id, transaction_type, amount, recipient_id, fraud_flag, status, created_at) 
                 VALUES ($1, 'transfer', $2, $3, false, 'completed', NOW()) RETURNING *`,
                [senderId, amount, recipientId]
            );

            // ✅ Insert Notifications
            await client.query(
                `INSERT INTO notifications (user_id, message, created_at) VALUES 
                 ($1, $2, NOW()), 
                 ($3, $4, NOW())`,
                [
                    senderId, `You sent $${amount} to ${recipientEmail}.`,
                    recipientId, `You received $${amount} from ${req.user.email}.`
                ]
            );

            await client.query("COMMIT");

            console.log(`✅ Transfer Successful: Sender=${senderId}, Recipient=${recipientId}, Amount=$${amount}`);

            res.json({
                message: "✅ Transfer successful!",
                updatedBalance: senderBalance - amount,
                transaction: transaction.rows[0]
            });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("❌ Transaction Error:", error);
            res.status(500).json({ error: "Internal server error during transaction!" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("❌ Transfer Error:", error);
        res.status(500).json({ error: "Internal server error!" });
    }
});

module.exports = router;
