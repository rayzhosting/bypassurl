// ============================================================
// KONFIGURASI API
// ============================================================
const API_CONFIG = {
    tutwuri: { name: 'Tutwuri/SFL', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/tutwuri', apikey: 'fgsiapi-19ddf32a-6d', domains: ['sfl.gl', 'tutwuri.com', 'tutwuri.id', 'sf1.gl'] },
    adlinksumo: { name: 'AdLinkSumo', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/adlinksumo', apikey: 'fgsiapi-19ddf32a-6d', domains: ['adlinksumo.com', 'kalimbachords.net'] },
    droplink: { name: 'Droplink', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/droplink', apikey: 'fgsiapi-19ddf32a-6d', domains: ['droplink.co'] },
    linkvertise: { name: 'Linkvertise', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/linkvertise', apikey: 'fgsiapi-19ddf32a-6d', domains: ['linkvertise.com'] },
    ouo: { name: 'Ouo.io', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/ouo', apikey: 'fgsiapi-19ddf32a-6d', domains: ['ouo.io'] },
    shortig: { name: 'Shortig', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/shortig', apikey: 'fgsiapi-19ddf32a-6d', domains: ['shortig.com'] },
    shortxlinks: { name: 'ShortXLinks', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/shortxlinks', apikey: 'fgsiapi-19ddf32a-6d', domains: ['shortxlinks.in'] },
    sub4unlock: { name: 'Sub4Unlock', endpoint: 'https://fgsi.dpdns.org/api/tools/skip/sub4unlock', apikey: 'fgsiapi-19ddf32a-6d', domains: ['sub4unlock.com', 'sub4unlock.co', 'sub4unlock.id', 'sub4unlock.io'] }
};

// ============================================================
// CORS PROXY
// ============================================================
const CORS_PROXIES = [
    { name: 'corsproxy.io', url: 'https://corsproxy.io/?url=' },
    { name: 'api.allorigins.win', url: 'https://api.allorigins.win/raw?url=' },
    { name: 'cors.lol', url: 'https://api.cors.lol/?url=' },
    { name: 'thingproxy', url: 'https://thingproxy.freeboard.io/fetch/' }
];

let activeProxyIndex = 0;

// ============================================================
// STATE
// ============================================================
let currentService = 'tutwuri';
let localHistory = JSON.parse(localStorage.getItem('fgsi_history') || '[]');
let globalHistory = JSON.parse(localStorage.getItem('fgsi_global_history') || '[]');
let userSessions = JSON.parse(localStorage.getItem('fgsi_user_sessions') || '[]');
let currentTab = 'local';
let currentUserId = localStorage.getItem('fgsi_user_id') || generateUserId();
let lastOriginalUrl = '';
let lastRawResponse = '';

// Simpan user ID
localStorage.setItem('fgsi_user_id', currentUserId);

// ============================================================
// GENERATE USER ID (Fingerprint)
// ============================================================
function generateUserId() {
    const ua = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lang = navigator.language;
    
    const raw = `${ua}|${screen}|${tz}|${lang}|${Date.now()}|${Math.random()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hashStr = Math.abs(hash).toString(36).toUpperCase();
    return `USR-${hashStr.substring(0, 8)}`;
}

// ============================================================
// DOM
// ============================================================
const urlInput = document.getElementById('urlInput');
const bypassBtn = document.getElementById('bypassBtn');
const resultArea = document.getElementById('resultArea');
const resultContent = document.getElementById('resultContent');
const resultLink = document.getElementById('resultLink');
const resultTitle = document.getElementById('resultTitle');
const resultService = document.getElementById('resultService');
const copyBtn = document.getElementById('copyBtn');
const loading = document.getElementById('loading');
const showOriginalBtn = document.getElementById('showOriginalBtn');
const originalUrlDisplay = document.getElementById('originalUrlDisplay');
const originalUrlText = document.getElementById('originalUrlText');
const autoDetect = document.getElementById('autoDetect');
const detectedService = document.getElementById('detectedService');
const debugInfo = document.getElementById('debugInfo');
const socialActions = document.getElementById('socialActions');
const socialActionsList = document.getElementById('socialActionsList');
const refreshDeviceBtn = document.getElementById('refreshDeviceInfo');
const proxyStatus = document.getElementById('proxyStatus');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarBody = document.getElementById('sidebarBody');
const historyCount = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const sidebarFooter = document.getElementById('sidebarFooter');

// ============================================================
// SIDEBAR TABS
// ============================================================
document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        renderSidebarHistory();
    });
});

// ============================================================
// SIDEBAR
// ============================================================
function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    hamburgerBtn.classList.add('active');
    renderSidebarHistory();
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
}

hamburgerBtn.addEventListener('click', function() {
    if (sidebar.classList.contains('active')) closeSidebar();
    else openSidebar();
});

sidebarOverlay.addEventListener('click', closeSidebar);

// ============================================================
// RENDER SIDEBAR HISTORY (MULTI-TAB)
// ============================================================
function renderSidebarHistory() {
    if (currentTab === 'local') {
        renderLocalHistory();
    } else if (currentTab === 'global') {
        renderGlobalHistory();
    } else if (currentTab === 'stats') {
        renderStats();
    }
}

// --- LOCAL HISTORY ---
function renderLocalHistory() {
    historyCount.textContent = localHistory.length;
    sidebarFooter.textContent = `📱 ${localHistory.length} riwayat di perangkat ini`;
    
    if (localHistory.length === 0) {
        sidebarBody.innerHTML = `
            <div class="sidebar-empty">
                <span class="icon">📭</span>
                Belum ada riwayat bypass
            </div>
        `;
        return;
    }

    sidebarBody.innerHTML = '';
    
    localHistory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const shortLink = item.short && item.short !== '#' ? item.short : '#';
        const displayUrl = item.original.length > 60 
            ? item.original.substring(0, 60) + '...' 
            : item.original;
        
        div.innerHTML = `
            <button class="history-item-delete" onclick="deleteLocalHistory(${index})" title="Hapus">×</button>
            <div class="history-item-top">
                <span class="history-item-service">${item.service}</span>
                <span class="history-item-time">${item.timestamp || ''}</span>
            </div>
            <div class="history-item-url">
                <a href="${shortLink}" target="_blank" title="${item.original}">${displayUrl}</a>
            </div>
            <div class="history-item-actions">
                <button onclick="copyHistory('${shortLink.replace(/'/g, "\\'")}')">📋 Copy</button>
                <a href="${shortLink}" target="_blank">🌍 Buka</a>
            </div>
        `;
        sidebarBody.appendChild(div);
    });
}

// --- GLOBAL HISTORY ---
function renderGlobalHistory() {
    historyCount.textContent = globalHistory.length;
    sidebarFooter.textContent = `🌍 ${globalHistory.length} bypass dari semua user`;
    
    if (globalHistory.length === 0) {
        sidebarBody.innerHTML = `
            <div class="sidebar-empty">
                <span class="icon">🌍</span>
                Belum ada riwayat global<br>
                <small style="font-size:11px;color:#444;">Riwayat dari semua user akan muncul di sini</small>
            </div>
        `;
        return;
    }

    sidebarBody.innerHTML = '';
    
    globalHistory.slice(0, 50).forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const shortLink = item.short && item.short !== '#' ? item.short : '#';
        const displayUrl = item.original.length > 55 
            ? item.original.substring(0, 55) + '...' 
            : item.original;
        const displayUser = item.user_id || 'Anonymous';
        const displayDevice = item.device || 'Unknown';
        
        div.innerHTML = `
            <div class="history-item-top">
                <span class="history-item-service">${item.service}</span>
                <span class="history-item-time">${item.timestamp || ''}</span>
            </div>
            <div class="history-item-url">
                <a href="${shortLink}" target="_blank" title="${item.original}">${displayUrl}</a>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                <span style="font-size:10px;color:#666;background:rgba(255,255,255,0.04);padding:2px 8px;border-radius:6px;">🆔 ${displayUser}</span>
                <span style="font-size:10px;color:#666;background:rgba(255,255,255,0.04);padding:2px 8px;border-radius:6px;">📱 ${displayDevice}</span>
            </div>
            <div class="history-item-actions" style="margin-top:8px;">
                <button onclick="copyHistory('${shortLink.replace(/'/g, "\\'")}')">📋 Copy</button>
                <a href="${shortLink}" target="_blank">🌍 Buka</a>
            </div>
        `;
        sidebarBody.appendChild(div);
    });
}

// --- STATS ---
function renderStats() {
    historyCount.textContent = localHistory.length + globalHistory.length;
    
    const allBypass = [...localHistory, ...globalHistory];
    const totalBypass = allBypass.length;
    const uniqueUsers = new Set(allBypass.map(b => b.user_id).filter(Boolean)).size;
    const totalServices = new Set(allBypass.map(b => b.service)).size;
    
    // Hitung by service
    const serviceCount = {};
    allBypass.forEach(b => {
        serviceCount[b.service] = (serviceCount[b.service] || 0) + 1;
    });
    const sortedServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]);
    
    // Hitung by device
    const deviceCount = {};
    allBypass.forEach(b => {
        const d = b.device || 'Unknown';
        deviceCount[d] = (deviceCount[d] || 0) + 1;
    });
    const sortedDevices = Object.entries(deviceCount).sort((a, b) => b[1] - a[1]);
    
    const maxServiceCount = sortedServices[0]?.[1] || 1;
    const maxDeviceCount = sortedDevices[0]?.[1] || 1;
    
    sidebarBody.innerHTML = `
        <div class="stats-section">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${totalBypass}</div>
                    <div class="stat-label">Total Bypass</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${uniqueUsers}</div>
                    <div class="stat-label">Unique Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalServices}</div>
                    <div class="stat-label">Services</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${localHistory.length}</div>
                    <div class="stat-label">Riwayat Saya</div>
                </div>
            </div>
            
            ${sortedServices.length > 0 ? `
                <div class="stats-title">🔗 Bypass by Service</div>
                ${sortedServices.map(([name, count]) => `
                    <div class="stats-bar-item">
                        <span class="stats-bar-label">${name}</span>
                        <div class="stats-bar-track">
                            <div class="stats-bar-fill" style="width:${(count/maxServiceCount*100).toFixed(0)}%"></div>
                        </div>
                        <span class="stats-bar-count">${count}</span>
                    </div>
                `).join('')}
            ` : ''}
            
            ${sortedDevices.length > 0 ? `
                <div class="stats-title" style="margin-top:16px;">📱 Bypass by Device</div>
                ${sortedDevices.map(([name, count]) => `
                    <div class="stats-bar-item">
                        <span class="stats-bar-label">${name}</span>
                        <div class="stats-bar-track">
                            <div class="stats-bar-fill" style="width:${(count/maxDeviceCount*100).toFixed(0)}%"></div>
                        </div>
                        <span class="stats-bar-count">${count}</span>
                    </div>
                `).join('')}
            ` : ''}
        </div>
    `;
    
    sidebarFooter.textContent = '📊 Statistik real-time';
}

// ============================================================
// COPY HISTORY
// ============================================================
window.copyHistory = function(text) {
    if (!text || text === '#') {
        alert('Tidak ada link untuk disalin!');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.textContent = '✅ Link disalin!';
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #28a745; color: white; padding: 10px 24px; border-radius: 10px;
            font-size: 14px; font-weight: 500; z-index: 9999;
            box-shadow: 0 4px 20px rgba(40, 167, 69, 0.4);
            animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }).catch(() => alert('Gagal menyalin link'));
};

// ============================================================
// DELETE LOCAL HISTORY
// ============================================================
window.deleteLocalHistory = function(index) {
    localHistory.splice(index, 1);
    localStorage.setItem('fgsi_history', JSON.stringify(localHistory));
    renderSidebarHistory();
};

clearHistoryBtn.addEventListener('click', function() {
    if (currentTab === 'local') {
        if (localHistory.length === 0) {
            alert('Riwayat sudah kosong!');
            return;
        }
        if (confirm('⚠️ Yakin ingin menghapus semua riwayat lokal?')) {
            localHistory = [];
            localStorage.setItem('fgsi_history', JSON.stringify(localHistory));
            renderSidebarHistory();
        }
    } else if (currentTab === 'global') {
        if (globalHistory.length === 0) {
            alert('Riwayat global sudah kosong!');
            return;
        }
        if (confirm('⚠️ Yakin ingin menghapus cache riwayat global?')) {
            globalHistory = [];
            localStorage.setItem('fgsi_global_history', JSON.stringify(globalHistory));
            renderSidebarHistory();
        }
    } else {
        alert('Statistik tidak bisa dihapus');
    }
});

// ============================================================
// FETCH WITH PROXY
// ============================================================
async function fetchWithProxy(apiUrl) {
    try {
        const directRes = await fetch(apiUrl, { mode: 'cors' });
        if (directRes.ok) {
            proxyStatus.textContent = '✅ Direct connection';
            proxyStatus.style.color = '#28a745';
            return directRes;
        }
    } catch (e) {
        console.log('Direct fetch failed, trying proxies...');
    }

    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const idx = (activeProxyIndex + i) % CORS_PROXIES.length;
        const proxy = CORS_PROXIES[idx];
        const proxyUrl = proxy.url + encodeURIComponent(apiUrl);
        
        try {
            console.log(`🔄 Trying proxy: ${proxy.name}`);
            const res = await fetch(proxyUrl, { mode: 'cors' });
            
            if (res.ok) {
                activeProxyIndex = idx;
                proxyStatus.textContent = `✅ Connected via ${proxy.name}`;
                proxyStatus.style.color = '#28a745';
                return res;
            }
        } catch (e) {
            console.log(`❌ Proxy ${proxy.name} failed:`, e.message);
        }
    }

    proxyStatus.textContent = '❌ Semua proxy gagal';
    proxyStatus.style.color = '#dc3545';
    throw new Error('Tidak dapat terhubung ke server. Coba lagi nanti.');
}

// ============================================================
// DEVICE INFO
// ============================================================
function detectDeviceModel(ua) {
    const iPhoneMatch = ua.match(/iPhone(?:\d+,\d+)?/);
    if (iPhoneMatch) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';

    const samsungMatch = ua.match(/SM-[A-Z0-9]+/);
    if (samsungMatch) return `Samsung ${samsungMatch[0]}`;

    const xiaomiMatch = ua.match(/(?:Mi|Redmi|POCO)\s?[A-Za-z0-9\s]+/i);
    if (xiaomiMatch) return xiaomiMatch[0].trim();

    const huaweiMatch = ua.match(/(?:HUAWEI|Huawei)\s?[A-Za-z0-9\s]+/);
    if (huaweiMatch) return huaweiMatch[0].trim();

    const oppoMatch = ua.match(/OPPO\s?[A-Za-z0-9\s]+/i);
    if (oppoMatch) return oppoMatch[0].trim();

    const vivoMatch = ua.match(/vivo\s?[A-Za-z0-9\s]+/i);
    if (vivoMatch) return vivoMatch[0].trim();

    const realmeMatch = ua.match(/realme\s?[A-Za-z0-9\s]+/i);
    if (realmeMatch) return realmeMatch[0].trim();

    const oneplusMatch = ua.match(/(?:ONEPLUS|OnePlus)\s?[A-Za-z0-9\s]+/i);
    if (oneplusMatch) return oneplusMatch[0].trim();

    const pixelMatch = ua.match(/Pixel\s?[A-Za-z0-9\s]+/i);
    if (pixelMatch) return pixelMatch[0].trim();

    const infinixMatch = ua.match(/Infinix\s?[A-Za-z0-9\s]+/i);
    if (infinixMatch) return infinixMatch[0].trim();

    const tecnoMatch = ua.match(/TECNO\s?[A-Za-z0-9\s]+/i);
    if (tecnoMatch) return tecnoMatch[0].trim();

    const buildMatch = ua.match(/Build\/[^;)]+/);
    if (buildMatch) return buildMatch[0].replace('Build/', '');

    return 'Tidak terdeteksi';
}

async function getDeviceInfo() {
    const info = {};
    const ua = navigator.userAgent;

    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        info.ip = ipData.ip;
    } catch {
        info.ip = 'Tidak terdeteksi';
    }

    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
        info.device = '📱 Mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
        info.device = '📱 Tablet';
    } else {
        info.device = '💻 Desktop';
    }

    info.model = detectDeviceModel(ua);

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includ