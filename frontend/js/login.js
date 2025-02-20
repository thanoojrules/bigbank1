document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error("❌ Login form not found in the DOM.");
        return;
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent form refresh

        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value.trim();

        if (!email || !password) {
            alert("⚠️ Please enter both email and password.");
            return;
        }

        try {
            // Determine API base URL based on environment
            const API_BASE_URL = window.location.hostname === "localhost"
                ? "http://localhost:5000/api"  // Local development
                : "http://3.237.171.168:5000/api"; // AWS EC2 Public IP (replace with your actual IP or domain)

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("🔍 API Response:", data);

            if (response.ok && data.token) {
                localStorage.setItem("token", data.token);
                alert("✅ Login successful! Redirecting...");
                window.location.href = "dashboard.html"; // Redirect to dashboard
            } else {
                alert(`🚨 Login failed: ${data.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("❌ Login request failed:", error);
            alert("🚨 Network error. Try again later.");
        }
    });
});