const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Utility bar replacements
    content = content.replace(/<span>© 2026 Government of Assam<\/span>/g, '<span data-i18n="top_copy">© 2026 Government of Assam</span>');
    content = content.replace(/<a href="index\.html" style="color: rgba\(255,255,255,0\.7\);">← Back to Home<\/a>/g, '<a href="index.html" style="color: rgba(255,255,255,0.7);" data-i18n="back_home">← Back to Home</a>');
    content = content.replace(/<a href="index\.html" class="back-btn">← Back to Home<\/a>/g, '<a href="index.html" class="back-btn" data-i18n="back_home">← Back to Home</a>');
    
    // login.html specific
    if (file === 'login.html') {
        content = content.replace(/<a href="index\.html" style="color:var\(--text-secondary\); font-weight:600; text-decoration:none;">← Back to Home<\/a>/g, '<a href="index.html" style="color:var(--text-secondary); font-weight:600; text-decoration:none;" data-i18n="back_home">← Back to Home</a>');
        content = content.replace(/<h1 class="login-title">Suvidha Portal<\/h1>/g, '<h1 class="login-title" data-i18n="login_title">Suvidha Portal</h1>');
        content = content.replace(/<p class="login-subtitle">Government of Assam Digital Services<\/p>/g, '<p class="login-subtitle" data-i18n="login_subtitle">Government of Assam Digital Services</p>');
        content = content.replace(/<label id="phoneLabel">Mobile Number<\/label>/g, '<label id="phoneLabel" data-i18n="lbl_mobile">Mobile Number</label>');
        content = content.replace(/<button class="btn btn-primary" onclick="sendOTP\(event\)">Send OTP<\/button>/g, '<button class="btn btn-primary" onclick="sendOTP(event)" data-i18n="btn_send_otp">Send OTP</button>');
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Injection complete.');
