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
    { name: 'allorigins', url: 'https://api.allorigins.win/raw?url=' },
    { name: 'cors.lol', url: 'https://api.cors.lol/?url=' }
];

let activeProxyIndex = 0;

// ============================================================
// STATE
// ============================================================
let currentService = 'tutwuri';
let history = JSON.parse(localStorage.getItem('fgsi_history') || '[]');
let currentUserId = localStorage.getItem('fgsi_user_id') || generateUserId();
let lastRawResponse = '';

localStorage.setItem('fgsi_user_id', currentUserId);

// ============================================================
// GENERATE USER ID
// ============================================================
function generateUserId() {
    const raw = navigator.userAgent + navigator.language + Date.now() + Math.random();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash = hash & hash;
    }
    return `USR-${Math.abs(hash).toString(36).toUpperCase().substring(0, 8)}`;
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
// RENDER SIDEBAR HISTORY
// ============================================================
function renderSidebarHistory() {
    historyCount.textContent = history.length;
    
    if (history.length === 0) {
        sidebarBody.innerHTML = `
            <div class="sidebar-empty">
                <span class="icon">📭</span>
                Belum ada riwayat bypass
            </div>
        `;
        return;
    }

    sidebarBody.innerHTML = '';
    
    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const shortLink = item.short && item.short !== '#' ? item.short : '#';
        const displayUrl = item.original.length > 60 
            ? item.original.substring(0, 60) + '...' 
            : item.original;
        
        div.innerHTML = `
            <button class="history-item-delete" onclick="deleteHistory(${index})" title="Hapus">×</button>
            <div class="history-item-top">
                <span class="history-item-service">${item.service}</span>
                <span class="history-item-time">${item.timestamp || ''}</span>
            </div>
            <div class="history-item-url">
                <a href="${shortLink}" target="_blank">${displayUrl}</a>
            </div>
            <div class="history-item-actions">
                <button onclick="copyHistory('${shortLink.replace(/'/g, "\\'")}')">📋 Copy</button>
                <a href="${shortLink}" target="_blank">🌍 Buka</a>
            </div>
        `;
        sidebarBody.appendChild(div);
    });
}

window.copyHistory = function(text) {
    if (!text || text === '#') {
        alert('Tidak ada link untuk disalin!');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.textContent = '✅ Link disalin!';
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#28a745;color:white;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:500;z-index:9999;box-shadow:0 4px 20px rgba(40,167,69,0.4);';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }).catch(() => alert('Gagal menyalin'));
};

window.deleteHistory = function(index) {
    history.splice(index, 1);
    localStorage.setItem('fgsi_history', JSON.stringify(history));
    renderSidebarHistory();
};

clearHistoryBtn.addEventListener('click', function() {
    if (history.length === 0) {
        alert('Riwayat sudah kosong!');
        return;
    }
    if (confirm('⚠️ Yakin ingin menghapus semua riwayat?')) {
        history = [];
        localStorage.setItem('fgsi_history', JSON.stringify(history));
        renderSidebarHistory();
    }
});

// ============================================================
// FETCH WITH PROXY
// ============================================================
async function fetchWithProxy(apiUrl) {
    try {
        const res = await fetch(apiUrl, { mode: 'cors' });
        if (res.ok) {
            proxyStatus.textContent = '✅ Direct';
            proxyStatus.style.color = '#28a745';
            return res;
        }
    } catch (e) {
        console.log('Direct failed, trying proxy...');
    }

    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const idx = (activeProxyIndex + i) % CORS_PROXIES.length;
        const proxy = CORS_PROXIES[idx];
        try {
            const res = await fetch(proxy.url + encodeURIComponent(apiUrl), { mode: 'cors' });
            if (res.ok) {
                activeProxyIndex = idx;
                proxyStatus.textContent = `✅ via ${proxy.name}`;
                proxyStatus.style.color = '#28a745';
                return res;
            }
        } catch (e) {
            console.log(`${proxy.name} failed`);
        }
    }

    proxyStatus.textContent = '❌ Semua gagal';
    proxyStatus.style.color = '#dc3545';
    throw new Error('Tidak dapat terhubung ke server');
}

// ============================================================
// DEVICE INFO
// ============================================================
function detectDeviceModel(ua) {
    const iPhone = ua.match(/iPhone/);
    if (iPhone) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    const samsung = ua.match(/SM-[A-Z0-9]+/);
    if (samsung) return `Samsung ${samsung[0]}`;
    const xiaomi = ua.match(/(?:Mi|Redmi|POCO)\s?[A-Za-z0-9\s]+/i);
    if (xiaomi) return xiaomi[0].trim();
    const huawei = ua.match(/(?:HUAWEI|Huawei)\s?[A-Za-z0-9\s]+/);
    if (huawei) return huawei[0].trim();
    const oppo = ua.match(/OPPO\s?[A-Za-z0-9\s]+/i);
    if (oppo) return oppo[0].trim();
    const vivo = ua.match(/vivo\s?[A-Za-z0-9\s]+/i);
    if (vivo) return vivo[0].trim();
    const realme = ua.match(/realme\s?[A-Za-z0-9\s]+/i);
    if (realme) return realme[0].trim();
    const oneplus = ua.match(/(?:ONEPLUS|OnePlus)\s?[A-Za-z0-9\s]+/i);
    if (oneplus) return oneplus[0].trim();
    const pixel = ua.match(/Pixel\s?[A-Za-z0-9\s]+/i);
    if (pixel) return pixel[0].trim();
    const infinix = ua.match(/Infinix\s?[A-Za-z0-9\s]+/i);
    if (infinix) return infinix[0].trim();
    const tecno = ua.match(/TECNO\s?[A-Za-z0-9\s]+/i);
    if (tecno) return tecno[0].trim();
    return 'Tidak terdeteksi';
}

async function getDeviceInfo() {
    const info = {};
    const ua = navigator.userAgent;

    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        info.ip = data.ip;
    } catch {
        info.ip = 'Tidak terdeteksi';
    }

    if (/Mobi|Android|iPhone|iPad/i.test(ua)) info.device = '📱 Mobile';
    else if (/Tablet|iPad/i.test(ua)) info.device = '📱 Tablet';
    else info.device = '💻 Desktop';

    info.model = detectDeviceModel(ua);

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    let browser = 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';

    info.osBrowser = `${os} • ${browser}`;
    info.screen = `${window.screen.width} × ${window.screen.height} px`;

    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            const level = Math.round(battery.level * 100);
            info.battery = `${level}%`;
            info.batteryLevel = level;
            info.batteryCharging = battery.charging;
        } catch {
            info.battery = 'N/A';
            info.batteryLevel = -1;
            info.batteryCharging = false;
        }
    } else {
        info.battery = 'Tidak didukung';
        info.batteryLevel = -1;
        info.batteryCharging = false;
    }

    info.network = navigator.onLine ? '🟢 Online' : '🔴 Offline';
    info.time = new Date().toLocaleString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return info;
}

function updateDeviceInfoUI(info) {
    document.getElementById('deviceIp').textContent = info.ip || '-';
    document.getElementById('deviceName').textContent = info.device || '-';
    document.getElementById('deviceModel').textContent = info.model || '-';
    document.getElementById('deviceOsBrowser').textContent = info.osBrowser || '-';
    document.getElementById('deviceScreen').textContent = info.screen || '-';
    document.getElementById('deviceNetwork').textContent = info.network || '-';
    document.getElementById('deviceTime').textContent = info.time || '-';
    document.getElementById('deviceTimezone').textContent = info.timezone || '-';
    document.getElementById('deviceUserId').textContent = currentUserId;
    document.getElementById('deviceUserId').style.color = '#28a745';
    document.getElementById('deviceUserId').style.fontWeight = '700';
    document.getElementById('deviceUserId').style.fontFamily = 'monospace';

    const batteryEl = document.getElementById('deviceBattery');
    if (info.batteryLevel >= 0) {
        let cls = 'battery-medium';
        if (info.batteryLevel > 60) cls = 'battery-high';
        else if (info.batteryLevel < 30) cls = 'battery-low';
        if (info.batteryCharging) cls = 'battery-charging';
        batteryEl.innerHTML = `${info.battery} <span class="battery-level ${cls}">${info.batteryCharging ? '⚡ Charging' : ''}</span>`;
    } else {
        batteryEl.textContent = info.battery || '-';
    }

    if (info.ip && info.ip !== 'Tidak terdeteksi') {
        document.getElementById('deviceIp').className = 'value device-info-ip';
    }
}

async function loadDeviceInfo() {
    const info = await getDeviceInfo();
    updateDeviceInfoUI(info);
}

// ============================================================
// SERVICE SELECTOR
// ============================================================
document.querySelectorAll('.service-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentService = this.dataset.service;
        urlInput.placeholder = `Masukkan URL untuk ${API_CONFIG[currentService].name}...`;
        resultArea.style.display = 'none';
        autoDetect.style.display = 'none';
    });
});

// ============================================================
// AUTO DETECT
// ============================================================
function detectService(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        for (const [key, config] of Object.entries(API_CONFIG)) {
            for (const domain of config.domains) {
                if (hostname.includes(domain) || domain.includes(hostname)) return key;
            }
        }
        return null;
    } catch { return null; }
}

urlInput.addEventListener('input', function() {
    const url = this.value.trim();
    if (url) {
        const detected = detectService(url);
        if (detected) {
            autoDetect.style.display = 'block';
            detectedService.textContent = API_CONFIG[detected].name + (detected === currentService ? ' ✅' : '');
            detectedService.style.color = detected === currentService ? '#28a745' : '#ffc107';
        } else {
            autoDetect.style.display = 'none';
        }
    } else {
        autoDetect.style.display = 'none';
    }
});

// ============================================================
// BYPASS
// ============================================================
async function bypassUrl() {
    const url = urlInput.value.trim();
    if (!url) { alert('⚠️ Masukkan URL dulu!'); return; }

    try { new URL(url); } catch {
        alert('⚠️ URL tidak valid!'); return;
    }

    const detected = detectService(url);
    let serviceToUse = currentService;
    if (detected && API_CONFIG[detected]) {
        serviceToUse = detected;
        document.querySelectorAll('.service-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.service === detected);
        });
    }

    loading.style.display = 'block';
    resultArea.style.display = 'none';
    bypassBtn.disabled = true;
    debugInfo.style.display = 'none';
    socialActions.style.display = 'none';
    proxyStatus.textContent = '';

    try {
        const config = API_CONFIG[serviceToUse];
        const apiUrl = `${config.endpoint}?apikey=${config.apikey}&url=${encodeURIComponent(url)}`;
        const response = await fetchWithProxy(apiUrl);
        const data = await response.json();
        lastRawResponse = JSON.stringify(data, null, 2);

        if (data.status === false) {
            throw new Error(data.message || data.data?.message || 'Gagal bypass!');
        }

        displayResult(data, url, config.name);
        saveHistory(url, data, config.name);
    } catch (error) {
        console.error('❌', error);
        showError(error.message);
    } finally {
        loading.style.display = 'none';
        bypassBtn.disabled = false;
    }
}

// ============================================================
// SHOW ERROR
// ============================================================
function showError(message) {
    resultArea.style.display = 'block';
    const card = document.querySelector('.result-card');
    card.classList.remove('result-warning');
    card.classList.add('result-error');
    resultTitle.textContent = '❌ Error';
    resultTitle.style.color = '#dc3545';
    resultService.textContent = '';
    resultContent.textContent = message;
    resultLink.style.display = 'none';
    showOriginalBtn.style.display = 'none';
    originalUrlDisplay.style.display = 'none';
    socialActions.style.display = 'none';
    setTimeout(() => {
        card.classList.remove('result-error');
        resultTitle.style.color = '#28a745';
    }, 5000);
}

// ============================================================
// DISPLAY RESULT
// ============================================================
function displayResult(data, originalUrl, serviceName) {
    resultArea.style.display = 'block';
    const card = document.querySelector('.result-card');
    card.classList.remove('result-error', 'result-warning');
    
    let shortUrl = '#';
    let resultText = '';
    let originalLink = originalUrl;

    socialActions.style.display = 'none';
    socialActionsList.innerHTML = '';

    if (data && data.status === true) {
        if (data.data) {
            const keys = ['url', 'link', 'result', 'short_url', 'shortUrl', 'bypass', 'destination', 'target', 'location', 'linkGo'];
            let found = false;
            for (const key of keys) {
                if (data.data[key]) {
                    shortUrl = data.data[key];
                    resultText = data.data[key];
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (typeof data.data === 'string' && data.data.startsWith('http')) {
                    shortUrl = data.data;
                    resultText = data.data;
                } else {
                    resultText = JSON.stringify(data.data, null, 2);
                    const m = resultText.match(/"linkGo":\s*"([^"]+)"/);
                    if (m && m[1]) { shortUrl = m[1]; resultText = m[1]; }
                    if (data.data.socialActions) showSocialActions(data.data.socialActions);
                }
            } else if (data.data.socialActions) {
                showSocialActions(data.data.socialActions);
            }
            if (data.data.original) originalLink = data.data.original;
        } else if (data.linkGo) {
            shortUrl = data.linkGo; resultText = data.linkGo;
        } else if (data.url) {
            shortUrl = data.url; resultText = data.url;
        } else if (data.result) {
            shortUrl = data.result; resultText = data.result;
        } else {
            resultText = JSON.stringify(data, null, 2);
        }
    } else if (typeof data === 'string') {
        resultText = data; shortUrl = data;
    } else if (data.linkGo) {
        shortUrl = data.linkGo; resultText = data.linkGo;
    } else if (data.short_url || data.shortUrl) {
        shortUrl = data.short_url || data.shortUrl; resultText = shortUrl;
    } else if (data.result) {
        shortUrl = data.result; resultText = data.result;
    } else if (data.url) {
        shortUrl = data.url; resultText = data.url;
    } else {
        resultText = JSON.stringify(data, null, 2);
    }

    if (shortUrl && !shortUrl.startsWith('http') && shortUrl !== '#' && shortUrl !== 'null') {
        shortUrl = 'https://' + shortUrl;
    }

    const valid = shortUrl && shortUrl !== '#' && shortUrl !== 'null' && shortUrl.startsWith('http');
    
    if (!valid) {
        resultContent.textContent = '⚠️ Tidak ada URL hasil.\n\nResponse:\n' + resultText;
        resultLink.style.display = 'none';
        resultTitle.textContent = '⚠️ Perlu Diperiksa';
        resultTitle.style.color = '#ffc107';
        card.classList.add('result-warning');
        debugInfo.textContent = 'Raw: ' + JSON.stringify(data, null, 2);
        debugInfo.style.display = 'block';
    } else {
        resultContent.textContent = resultText;
        resultLink.href = shortUrl;
        resultLink.target = '_blank';
        resultLink.style.display = 'inline-block';
        resultTitle.textContent = '✅ Hasil Bypass';
        resultTitle.style.color = '#28a745';
        debugInfo.style.display = 'none';
    }
    
    resultService.textContent = `via ${serviceName}`;
    
    if (originalLink && originalLink !== shortUrl && originalLink !== '#') {
        showOriginalBtn.style.display = 'inline-block';
        originalUrlText.textContent = originalLink;
    } else {
        showOriginalBtn.style.display = 'none';
        originalUrlDisplay.style.display = 'none';
    }
}

function showSocialActions(actions) {
    if (!actions || actions.length === 0) return;
    socialActions.style.display = 'block';
    socialActionsList.innerHTML = '';
    actions.forEach(a => {
        if (a.url) {
            const link = document.createElement('a');
            link.href = a.url;
            link.target = '_blank';
            link.textContent = `${a.icon || '🔗'} ${a.type || 'Link'}`;
            socialActionsList.appendChild(link);
        }
    });
}

showOriginalBtn.addEventListener('click', function() {
    if (originalUrlDisplay.style.display === 'none') {
        originalUrlDisplay.style.display = 'block';
        showOriginalBtn.textContent = '🙈 Sembunyikan';
    } else {
        originalUrlDisplay.style.display = 'none';
        showOriginalBtn.textContent = '📄 Lihat Original';
    }
});

// ============================================================
// SAVE HISTORY
// ============================================================
function saveHistory(originalUrl, data, serviceName) {
    let shortUrl = '#';
    
    if (data && data.status === true && data.data) {
        const keys = ['url', 'link', 'result', 'short_url', 'shortUrl', 'bypass', 'destination', 'target', 'linkGo'];
        for (const key of keys) {
            if (data.data[key]) { shortUrl = data.data[key]; break; }
        }
        if (shortUrl === '#' && typeof data.data === 'string' && data.data.startsWith('http')) {
            shortUrl = data.data;
        }
        if (shortUrl === '#') {
            const m = JSON.stringify(data.data).match(/"linkGo":\s*"([^"]+)"/);
            if (m && m[1]) shortUrl = m[1];
        }
    } else if (data && data.url) {
        shortUrl = data.url;
    } else if (typeof data === 'string') {
        shortUrl = data;
    } else if (data.short_url || data.shortUrl) {
        shortUrl = data.short_url || data.shortUrl;
    } else if (data.result) {
        shortUrl = data.result;
    }

    if (shortUrl && !shortUrl.startsWith('http') && shortUrl !== '#' && shortUrl !== '') {
        shortUrl = 'https://' + shortUrl;
    }

    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    if (/Mobi|Android|iPhone/i.test(ua)) deviceType = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

    history.unshift({
        user_id: currentUserId,
        original: originalUrl,
        short: shortUrl,
        service: serviceName,
        device: deviceType,
        model: detectDeviceModel(ua),
        timestamp: new Date().toLocaleString('id-ID'),
        iso_time: new Date().toISOString()
    });

    if (history.length > 50) history = history.slice(0, 50);
    
    localStorage.setItem('fgsi_history', JSON.stringify(history));
    renderSidebarHistory();
}

// ============================================================
// COPY
// ============================================================
copyBtn.addEventListener('click', function() {
    const text = resultContent.textContent;
    if (!text || text === '#') { alert('Tidak ada link!'); return; }
    
    let clean = text;
    if (clean.includes('Response:')) clean = clean.split('Response:')[1]?.trim() || clean;

    navigator.clipboard.writeText(clean).then(() => {
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = clean;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
    });
});

// ============================================================
// EVENTS
// ============================================================
urlInput.addEventListener('keypress', e => { if (e.key === 'Enter') bypassUrl(); });
bypassBtn.addEventListener('click', bypassUrl);
refreshDeviceBtn.addEventListener('click', function() {
    this.textContent = '🔄 Memuat...';
    this.disabled = true;
    loadDeviceInfo().then(() => {
        this.textContent = '🔄 Refresh Info';
        this.disabled = false;
    });
});

// ============================================================
// INIT
// ============================================================
renderSidebarHistory();
urlInput.placeholder = `Masukkan URL untuk ${API_CONFIG.tutwuri.name}...`;
loadDeviceInfo();
proxyStatus.textContent = '🔄 Siap digunakan';
proxyStatus.style.color = '#667eea';

console.log('🚀 FGSI Tools Loaded!');
console.log('🆔 User ID:', currentUserId);
console.log('📜 Riwayat:', history.length);