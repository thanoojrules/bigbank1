const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Fetch Notifications API
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await pool.query(
            "SELECT id, message, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        console.log(`✅ Notifications Fetched: ${notifications.rows.length} records`);
        res.json(notifications.rows);
    } catch (error) {
        console.error("❌ Notification Fetch Error:", error);
        res.status(500).json({ error: "Internal server error while fetching notifications" });
    }
});

module.exports = router;
