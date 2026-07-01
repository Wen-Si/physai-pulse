/* ============================================
   PhysicalAI Pulse — Main Application Logic
   渲染、导航、交互、实时刷新
   ============================================ */

// Module configuration
const MODULE_CONFIG = {
    dynamics: { color: '#00e5ff', gridId: 'gridDynamics' },
    financing: { color: '#00ff88', gridId: 'gridFinancing' },
    tech: { color: '#ff6b35', gridId: 'gridTech' },
    voices: { color: '#b388ff', gridId: 'gridVoices' }
};

// Data store
const dataStore = {
    dynamics: [],
    financing: [],
    tech: [],
    voices: []
};

// ============================================
// Clock
// ============================================
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.textContent = `${h}:${m}:${s} UTC+8`;
    }
}

// ============================================
// Stats Animation
// ============================================
function animateStats() {
    const lang = getLang();
    const stats = {
        statCompanies: { value: 48, suffix: t('companiesUnit') },
        statFunding: { value: 125, suffix: t('fundingUnit') },
        statUpdates: { value: dataStore.dynamics.length + dataStore.financing.length + dataStore.tech.length + dataStore.voices.length, suffix: t('updatesUnit') },
        statSectors: { value: 12, suffix: t('sectorsUnit') }
    };

    Object.entries(stats).forEach(([id, config]) => {
        const el = document.getElementById(id);
        if (!el) return;

        const target = config.value;
        const suffix = config.suffix || '';
        let current = 0;
        const duration = 1200;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(target * eased);
            el.textContent = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target + suffix;
            }
        }
        requestAnimationFrame(step);
    });
}

// ============================================
// Card Renderers
// ============================================
function renderDynamicsCard(item, index) {
    const color = MODULE_CONFIG.dynamics.color;
    return `
        <div class="news-card" style="--card-accent:${color}; animation-delay:${index * 0.08}s">
            <div class="card-top">
                <span class="card-tag">${escapeHtml(item.tag || t('tagDynamics'))}</span>
                <span class="card-date">${escapeHtml(item.date)}</span>
            </div>
            <div class="card-company">${escapeHtml(item.company)}</div>
            <h3 class="card-title">${escapeHtml(item.title)}</h3>
            <p class="card-summary">${escapeHtml(item.summary)}</p>
            <div class="card-footer">
                <div class="card-meta">
                    <span class="card-meta-item">● ${t('aiGenerated')}</span>
                </div>
            </div>
        </div>
    `;
}

function renderFinancingCard(item, index) {
    const color = MODULE_CONFIG.financing.color;
    return `
        <div class="news-card" style="--card-accent:${color}; animation-delay:${index * 0.08}s">
            <div class="card-top">
                <span class="card-tag">${escapeHtml(item.round || t('tagFinancing'))}</span>
                <span class="card-date">${escapeHtml(item.date)}</span>
            </div>
            <div class="card-company">${escapeHtml(item.company)}</div>
            <div class="financing-amount">${escapeHtml(item.amount)}</div>
            <div class="financing-round">${t('round')}: ${escapeHtml(item.round)}</div>
            <div class="financing-detail">
                <div class="financing-detail-item">
                    <div class="financing-detail-label">${t('valuation')}</div>
                    <div class="financing-detail-value">${escapeHtml(item.valuation)}</div>
                </div>
                <div class="financing-detail-item">
                    <div class="financing-detail-label">${t('investors')}</div>
                    <div class="financing-detail-value">${escapeHtml(item.investors)}</div>
                </div>
            </div>
            <p class="card-summary">${escapeHtml(item.summary)}</p>
            <div class="card-footer">
                <div class="card-meta">
                    <span class="card-meta-item">● ${t('aiGenerated')}</span>
                </div>
            </div>
        </div>
    `;
}

function renderTechCard(item, index) {
    const color = MODULE_CONFIG.tech.color;
    return `
        <div class="news-card" style="--card-accent:${color}; animation-delay:${index * 0.08}s">
            <div class="card-top">
                <span class="card-tag">${t('tagTech')}</span>
                <span class="card-date">${escapeHtml(item.date)}</span>
            </div>
            <div class="card-company">${escapeHtml(item.company)}</div>
            <h3 class="card-title">${escapeHtml(item.title)}</h3>
            <p class="card-summary">${escapeHtml(item.summary)}</p>
            <div class="tech-significance">
                <span class="tech-significance-label">${t('significance')}</span>
                <span class="tech-significance-text">${escapeHtml(item.significance)}</span>
            </div>
            <div class="card-footer">
                <div class="card-meta">
                    <span class="card-meta-item">● ${t('aiGenerated')}</span>
                </div>
            </div>
        </div>
    `;
}

function renderVoicesCard(item, index) {
    const color = MODULE_CONFIG.voices.color;
    const initials = getInitials(item.name);
    return `
        <div class="news-card" style="--card-accent:${color}; animation-delay:${index * 0.08}s">
            <div class="card-top">
                <span class="card-tag">${t('tagVoices')}</span>
                <span class="card-date">${escapeHtml(item.date)}</span>
            </div>
            <div class="voice-quote">
                <p class="voice-quote-text">${escapeHtml(item.quote)}</p>
            </div>
            <div class="voice-person">
                <div class="voice-avatar">${initials}</div>
                <div class="voice-info">
                    <div class="voice-name">${escapeHtml(item.name)}</div>
                    <div class="voice-title">${escapeHtml(item.title)}</div>
                </div>
            </div>
            <p class="card-summary" style="margin-top:12px">${escapeHtml(item.context)}</p>
            <div class="card-footer">
                <div class="card-meta">
                    <span class="card-meta-item">● ${t('aiGenerated')}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// Render Module
// ============================================
function renderModule(module) {
    const config = MODULE_CONFIG[module];
    const grid = document.getElementById(config.gridId);
    if (!grid) return;

    const data = dataStore[module] || [];

    if (data.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📡</div>
                <p class="empty-state-text">${t('emptyText')}</p>
                <p class="empty-state-hint">${t('emptyHint')}</p>
            </div>
        `;
        return;
    }

    const renderers = {
        dynamics: renderDynamicsCard,
        financing: renderFinancingCard,
        tech: renderTechCard,
        voices: renderVoicesCard
    };

    grid.innerHTML = data.map((item, i) => renderers[module](item, i)).join('');
}

// ============================================
// Render All Modules
// ============================================
function renderAll() {
    Object.keys(MODULE_CONFIG).forEach(module => renderModule(module));
    animateStats();
}

// ============================================
// Loading Overlay
// ============================================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// ============================================
// Toast Notification
// ============================================
let toastTimer = null;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Generate Module Content
// ============================================
async function generateModule(module) {
    const btn = document.querySelector(`.refresh-btn[data-module="${module}"]`);
    if (btn) btn.classList.add('loading');

    showToast(t('toastLoading'), 'success');

    try {
        const data = await ZHIPU_API.generateModule(module, getLang());
        if (data && data.length > 0) {
            dataStore[module] = data;
            renderModule(module);
            animateStats();
            showToast(t('toastSuccess'), 'success');
        } else {
            showToast(t('toastError'), 'error');
        }
    } catch (error) {
        console.error('Generate error:', error);
        showToast(t('toastError'), 'error');
    } finally {
        if (btn) btn.classList.remove('loading');
    }
}

// ============================================
// Generate All Modules
// ============================================
async function generateAll() {
    showLoading();
    try {
        const data = await ZHIPU_API.generateAll(getLang());
        dataStore.dynamics = data.dynamics || [];
        dataStore.financing = data.financing || [];
        dataStore.tech = data.tech || [];
        dataStore.voices = data.voices || [];
        dataSource = 'ai';
        renderAll();
        showToast(t('toastSuccess'), 'success');
    } catch (error) {
        console.error('Generate all error:', error);
        showToast(t('toastError'), 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// Navigation
// ============================================
function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const module = tab.dataset.module;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show/hide modules
            const sections = document.querySelectorAll('.module-section');
            if (module === 'all') {
                sections.forEach(s => s.classList.remove('hidden'));
            } else {
                sections.forEach(s => {
                    if (s.dataset.module === module) {
                        s.classList.remove('hidden');
                    } else {
                        s.classList.add('hidden');
                    }
                });
                // Scroll to the section
                const targetSection = document.querySelector(`.module-section[data-module="${module}"]`);
                if (targetSection) {
                    setTimeout(() => {
                        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
        });
    });
}

// ============================================
// Language Toggle
// ============================================
function setupLanguageToggle() {
    const toggle = document.getElementById('langToggle');
    toggle.addEventListener('click', () => {
        const newLang = getLang() === 'zh' ? 'en' : 'zh';
        applyTranslations(newLang);
        reloadForLanguage();
    });
}

// ============================================
// Refresh Buttons
// ============================================
function setupRefreshButtons() {
    const buttons = document.querySelectorAll('.refresh-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const module = btn.dataset.module;
            generateModule(module);
        });
    });
}

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ============================================
// Initialize
// ============================================

// Track whether data source is RPA or AI
let dataSource = 'fallback'; // 'rpa', 'ai', 'fallback'

/**
 * Load RPA-collected data first, fall back to AI generation
 */
async function loadInitialData() {
    const lang = getLang();

    // Step 1: Show fallback data immediately for instant display
    Object.keys(MODULE_CONFIG).forEach(module => {
        dataStore[module] = ZHIPU_API.getFallbackData(module, lang);
    });
    renderAll();

    // Step 2: Try to load RPA-collected data
    console.log('[Init] Attempting to load RPA data...');
    const rpaData = await ZHIPU_API.loadRPAData(lang);

    if (rpaData && (rpaData.dynamics.length > 0 || rpaData.financing.length > 0)) {
        console.log('[Init] RPA data loaded successfully');
        dataStore.dynamics = rpaData.dynamics;
        dataStore.financing = rpaData.financing;
        dataStore.tech = rpaData.tech;
        dataStore.voices = rpaData.voices;
        dataSource = 'rpa';
        renderAll();
        showRPABadge(rpaData.meta);
        showToast(t('rpaUpdated'), 'success');
        return;
    }

    // Step 3: RPA data not available, use AI generation
    console.log('[Init] RPA data not available, generating via AI...');
    await generateAll();
}

/**
 * Show RPA badge with last update time
 */
function showRPABadge(meta) {
    const badge = document.getElementById('rpaBadge');
    const timeEl = document.getElementById('rpaTime');

    if (badge && meta) {
        badge.style.display = 'flex';
        if (meta.last_updated) {
            // Show shortened date/time
            const dateStr = meta.last_updated.split(' ')[0];
            timeEl.textContent = dateStr;
        }
    }
}

/**
 * Reload data when language changes
 */
async function reloadForLanguage() {
    const lang = getLang();

    if (dataSource === 'rpa') {
        // Reload RPA data for new language
        const rpaData = await ZHIPU_API.loadRPAData(lang);
        if (rpaData && (rpaData.dynamics.length > 0 || rpaData.financing.length > 0)) {
            dataStore.dynamics = rpaData.dynamics;
            dataStore.financing = rpaData.financing;
            dataStore.tech = rpaData.tech;
            dataStore.voices = rpaData.voices;
            renderAll();
            return;
        }
    }

    // If RPA data not available for this language or using AI, reload fallback
    Object.keys(MODULE_CONFIG).forEach(module => {
        dataStore[module] = ZHIPU_API.getFallbackData(module, lang);
    });
    renderAll();
}

async function init() {
    // Apply default language
    applyTranslations('zh');

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Setup interactions
    setupNavigation();
    setupLanguageToggle();
    setupRefreshButtons();

    // Load initial data (RPA first, then AI fallback)
    await loadInitialData();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
