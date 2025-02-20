document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html";
        return;
    }

    console.log("🔐 Token Retrieved:", token);

    // 🌐 Dynamic API base URL based on environment
    const API_BASE_URL = window.location.hostname === "localhost"
        ? "http://localhost:5000/api"  // Local development
        : "http://3.82.218.179:5000/api"; // Replace with your EC2 IP or domain

    // ✅ Fetch User Profile
    async function fetchUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const text = await response.text(); // Debugging step
            console.log("🔍 API Response (Profile):", text);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${text}`);
            }

            const data = JSON.parse(text);
            document.getElementById("userEmail").textContent = data.email;
            document.getElementById("balance").textContent = `$${parseFloat(data.balance).toFixed(2)}`;
            document.getElementById("savings").textContent = `$${parseFloat(data.savings).toFixed(2)}`;
        } catch (error) {
            console.error("❌ Profile Fetch Error:", error);
            document.getElementById("balance").textContent = "$0.00";
            document.getElementById("savings").textContent = "$0.00";
        }
    }

    // ✅ Fetch Transaction History
    async function fetchTransactionHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("❌ Failed to fetch transactions.");
            }

            const transactions = await response.json();
            console.log("✅ Transaction Data Fetched:", transactions);

            const transactionList = document.getElementById("transactionList");
            if (!transactionList) {
                console.error("❌ Transaction List Element Not Found in HTML.");
                return;
            }

            transactionList.innerHTML = ""; // Clear previous data

            if (transactions.length === 0) {
                transactionList.innerHTML = "<li>No transactions available.</li>";
                return;
            }

            transactions.forEach(txn => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <strong>${txn.transaction_type.toUpperCase()}</strong>: 
                    ${txn.sender_email ? `Sent to: ${txn.recipient_email}` : `Received from: ${txn.sender_email}`}
                    <span style="color: ${txn.transaction_type === 'transfer' ? 'red' : 'green'};">
                        $${txn.amount}
                    </span>
                    <small>(${new Date(txn.created_at).toLocaleString()})</small>
                `;
                transactionList.appendChild(listItem);
            });

        } catch (error) {
            console.error("❌ Transaction Fetch Error:", error);
        }
    }

    // ✅ Fetch Notifications
    async function fetchNotifications() {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("❌ Failed to fetch notifications.");
            }

            const notifications = await response.json();
            const notificationList = document.getElementById("notificationList");
            if (!notificationList) {
                console.error("❌ Notification List Element Not Found in HTML.");
                return;
            }

            notificationList.innerHTML = "";

            if (notifications.length === 0) {
                notificationList.innerHTML = "<li>No notifications available.</li>";
                return;
            }

            notifications.forEach(notif => {
                const listItem = document.createElement("li");
                listItem.textContent = `${notif.message} - ${new Date(notif.created_at).toLocaleString()}`;
                notificationList.appendChild(listItem);
            });
        } catch (error) {
            console.error("❌ Notification Fetch Error:", error);
        }
    }

    // ✅ Fetch Everything on Page Load
    fetchUserProfile();
    fetchTransactionHistory();
    fetchNotifications();
});