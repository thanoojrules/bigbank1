document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");
    const responseMessage = document.getElementById("responseMessage");

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        // ✅ Validate Fields
        if (!name || !email || !password || !confirmPassword) {
            showMessage("❌ All fields are required!", "error");
            return;
        }

        // ✅ Password Complexity Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{9,}$/;
        if (!passwordRegex.test(password)) {
            showMessage("❌ Password must be at least 9 characters long, contain a number, uppercase letter, and special character.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("❌ Passwords do not match.", "error");
            return;
        }

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage("✅ Account created successfully! Redirecting to login...", "success");
                setTimeout(() => window.location.href = "login.html", 2000);
            } else {
                showMessage(`❌ Signup failed: ${data.error}`, "error");
            }
        } catch (error) {
            console.error("❌ Signup request failed:", error);
            showMessage("❌ An error occurred. Please try again later.", "error");
        }
    });

    // ✅ Function to show feedback message
    function showMessage(message, type) {
        responseMessage.innerHTML = `<p style="color: ${type === 'success' ? 'green' : 'red'}">${message}</p>`;
    }
});