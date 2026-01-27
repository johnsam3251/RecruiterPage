const BOT_TOKEN = '8424484193:AAFvLn7GwjI3US_nVBUKBOGKUGPuH-xcZo4';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const chatId = '7867274282';

// Telegram Website Visitor Tracker
async function trackWebsiteVisit() {
    try {
        const pageUrl = window.location.href;
        const userAgent = navigator.userAgent;
        const referrer = document.referrer || 'Direct visit';
        const screenSize = `${window.screen.width}x${window.screen.height}`;
        
        // Get IP address (requires an external service)
        let ip = 'Unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ip = ipData.ip;
        } catch (ipError) {
            console.log('IP fetch failed:', ipError);
        }
        
        // Prepare the tracking message
        const trackingMessage = `🌐 New Website Visitor\n\n` +
                               `📅 Time: ${new Date().toLocaleString()}\n` +
                               `🔗 Page: ${pageUrl}\n` +
                               `🌍 IP: ${ip}\n` +
                               `📱 Device: ${getDeviceType()}\n` +
                               `🖥️ Screen: ${screenSize}\n` +
                               `🔗 Referrer: ${referrer}\n` +
                               `🌐 Browser: ${getBrowserName()}`;
        
        // Send to Telegram
        await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: trackingMessage,
                parse_mode: 'HTML'
            })
        });
        
    } catch (error) {
        console.error('Tracking error:', error);
    }
}

// Helper function to detect device type
function getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        return 'Tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return 'Mobile';
    }
    return 'Desktop';
}

// Helper function to detect browser
function getBrowserName() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    
    if (userAgent.indexOf("Chrome") > -1) {
        browser = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
        browser = "Safari";
    } else if (userAgent.indexOf("Firefox") > -1) {
        browser = "Firefox";
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) {
        browser = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
        browser = "Edge";
    } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
        browser = "Opera";
    }
    
    return browser;
}

// Track when page loads
document.addEventListener('DOMContentLoaded', trackWebsiteVisit);

// Optional: Track when user leaves
window.addEventListener('beforeunload', () => {
    // You can send a departure message here
    console.log('User leaving site');
});