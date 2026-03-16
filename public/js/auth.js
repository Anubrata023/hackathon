const API_BASE = '/api';

// --- Session Logic ---
function getToken() { return sessionStorage.getItem('authToken'); }
function setToken(t) { sessionStorage.setItem('authToken', t); }
function removeToken() { sessionStorage.clear(); }
function getUserData() { 
    const d = sessionStorage.getItem('userData'); 
    return d ? JSON.parse(d) : null; 
}
function setUserData(d) { sessionStorage.setItem('userData', JSON.stringify(d)); }

// --- Security: 3 OTPs / 10 Mins ---
function checkOTPLimit() {
    const MAX = 3, WINDOW = 10 * 60 * 1000, now = Date.now();
    let logs = JSON.parse(localStorage.getItem('suvidha_logs')) || [];
    logs = logs.filter(ts => (now - ts) < WINDOW);
    if (logs.length >= MAX) {
        return { allowed: false, waitMinutes: Math.ceil((WINDOW - (now - logs[0])) / 60000) };
    }
    logs.push(now);
    localStorage.setItem('suvidha_logs', JSON.stringify(logs));
    return { allowed: true };
}

// --- API Wrapper ---
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        const token = getToken();
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        if (body) options.body = JSON.stringify(body);
        
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        if (res.status === 401) { removeToken(); window.location.href = 'login.html'; }
        
        const data = await res.json();
        return { success: res.ok, data };
    } catch (e) {
        return { success: false, data: { message: "Network Error" } };
    }
}

// --- UI Helpers ---
function showLoading(btn) { btn.dataset.txt = btn.innerText; btn.innerText = "Wait..."; btn.disabled = true; }
function hideLoading(btn) { btn.innerText = btn.dataset.txt || "Submit"; btn.disabled = false; }
function showMessage(msg, type = 'info') {
    // Basic fallback alert if a custom toast system isn't in place
    alert(`[${type.toUpperCase()}] ${msg}`);
}

// --- Auth Enforcement ---
function requireAuth() {
    if (!getToken()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function logout() {
    removeToken();
    window.location.href = '/index.html';
}

// --- EXPORT (Must be at the bottom) ---
window.SuvidhaAuth = { getToken, setToken, removeToken, getUserData, setUserData, checkOTPLimit, apiCall, showLoading, hideLoading, showMessage, requireAuth, logout };
console.log("✅ SuvidhaAuth Online");