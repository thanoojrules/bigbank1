document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    console.log("🔐 Token Retrieved:", token);

    // ✅ Fetch User Details
    async function fetchUserDetails() {
        try {
            const response = await fetch("/api/user/details", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user details.");
            }

            const data = await response.json();
            console.log("✅ User Details:", data);

            document.getElementById("debitBalance").textContent = `$${parseFloat(data.balance).toFixed(2)}`;
            document.getElementById("scenePoints").textContent = data.scene_points;
        } catch (error) {
            console.error("❌ User Fetch Error:", error);
        }
    }

    // ✅ Fetch Transaction History & Load Calendar
    async function fetchTransactionHistory() {
        try {
            const response = await fetch("/api/transactions", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch transactions.");
            }

            const transactions = await response.json();
            console.log("✅ Transactions Fetched:", transactions);
            const calendarEl = document.getElementById("calendar");
            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: "dayGridMonth",
                events: transactions.map(txn => ({
                    title: `$${txn.amount} - ${txn.transaction_type}`,
                    start: txn.created_at,
                    color: txn.transaction_type === "transfer" ? "#FF5733" : "#28a745"
                }))
            });

            calendar.render();
        } catch (error) {
            console.error("❌ Transaction Fetch Error:", error);
        }
    }

    // ✅ Navigation Buttons
    document.getElementById("dashboardBtn")?.addEventListener("click", function () {
        window.location.href = "dashboard.html";
    });

    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });

	document.getElementById("downloadStatementBtn")?.addEventListener("click", async function () {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("❌ You must be logged in!");
            return;
        }

        const response = await fetch("/api/credit/statement", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("❌ Failed to generate statement.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Credit_Card_Statement.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert("✅ Credit Card Statement Downloaded!");
    } catch (error) {
        console.error("❌ Error downloading statement:", error);
        alert(error.message);
    }
});
    
document.addEventListener("DOMContentLoaded", () => {
    const downloadBtn = document.getElementById("downloadStatementBtn");

    if (downloadBtn) {
        downloadBtn.addEventListener("click", async function () {
            try {
                // ✅ Retrieve Token and User ID
                const token = localStorage.getItem("token");
                const userId = localStorage.getItem("userId");

                console.log("🔑 Token:", token);
                console.log("👤 User ID:", userId);

                if (!token) throw new Error("❌ Token not found. Please log in again.");
                if (!userId) throw new Error("❌ User ID not found. Please log in again.");

                // ✅ Fetch Credit Card Statement PDF
                const response = await fetch(`/api/credit/statement/${userId}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("❌ Server Response:", errorText);
                    throw new Error("❌ Failed to generate statement.");
                }

                // ✅ Convert Response to PDF and Trigger Download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Statement_${userId}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                console.log("✅ Statement downloaded successfully!");

            } catch (error) {
                console.error("❌ Error downloading statement:", error.message);
                alert(error.message);
            }
        });
    } else {
        console.error("❌ Download button not found!");
    }
});

	// ✅ Fetch Data on Page Load
    fetchUserDetails();
    fetchTransactionHistory();
});
