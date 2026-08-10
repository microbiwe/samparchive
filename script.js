// ===========================================
// 1. ДАННЫЕ (хранятся в localStorage)
// ===========================================

const DEFAULT_DATA = {
    items: [{
        id: 'samp-crime-pack',
        category: 'Сборки',
        title: 'SAMP Crime Pack v3.0',
        description: 'Полная переделка LS под криминальный стиль, новые текстуры и звуки.',
        version: '3.0',
        date: '2026-08-10',
        image: 'https://via.placeholder.com/600x400/7c3aed/ffffff?text=Crime+Pack',
        download: '#',
        rating: 42,
        votes: 0,
        details: 'В этой сборке переработаны все текстуры города, изменены модели машин, добавлены новые скины для банд и полностью переработанная карта.'
    }, {
        id: 'samp-script-anticheat',
        category: 'Скрипты',
        title: 'AntiCheat System v2.1',
        description: 'Продвинутая система защиты от читов для SAMP серверов.',
        version: '2.1',
        date: '2026-08-08',
        image: 'https://via.placeholder.com/600x400/6d28d9/ffffff?text=AntiCheat',
        download: '#',
        rating: 38,
        votes: 0,
        details: 'Обнаруживает подозрительную активность, авто-кликеры, скоростные хаки и телепорты.'
    }, {
        id: 'samp-textures-hd',
        category: 'Текстуры',
        title: 'HD Textures Pack v4.0',
        description: 'Замена всех стандартных текстур SAMP на HD версии (2K).',
        version: '4.0',
        date: '2026-08-05',
        image: 'https://via.placeholder.com/600x400/4a2d8a/ffffff?text=HD+Textures',
        download: '#',
        rating: 56,
        votes: 0,
        details: 'Все текстуры дорог, зданий, неба и воды заменены на качественные аналоги.'
    }, {
        id: 'samp-gun-m4',
        category: 'Оружие',
        title: 'M4 Custom Model v1.2',
        description: 'Новая модель M4 с реалистичной анимацией перезарядки.',
        version: '1.2',
        date: '2026-08-03',
        image: 'https://via.placeholder.com/600x400/7c3aed/ffffff?text=M4+Model',
        download: '#',
        rating: 29,
        votes: 0,
        details: 'Модель M4 с высоким полигоном, реалистичные звуки выстрелов и новая анимация прицеливания.'
    }, {
        id: 'samp-graphic-hud',
        category: 'Графика',
        title: 'Neon HUD v2.0',
        description: 'Неоновый интерфейс с анимированными элементами для SAMP.',
        version: '2.0',
        date: '2026-07-30',
        image: 'https://via.placeholder.com/600x400/2d1b69/ffffff?text=Neon+HUD',
        download: '#',
        rating: 47,
        votes: 0,
        details: 'Полностью переработанный интерфейс: неоновые цвета, анимированные иконки здоровья и брони.'
    }]
};

// Загружаем данные
let data = loadData();

function loadData() {
    try {
        const saved = localStorage.getItem('microbArchiveData');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.items) return parsed;
        }
    } catch (e) {}
    saveData(DEFAULT_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(dataToSave) {
    localStorage.setItem('microbArchiveData', JSON.stringify(dataToSave));
    data = dataToSave;
}

// ===========================================
// 2. ТЕМА
// ===========================================

const THEME_KEY = 'microbTheme';
let currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
const body = document.body;
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
    body.classList.remove('light', 'dark');
    body.classList.add(theme);
    if (themeToggle) themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem(THEME_KEY, theme);
    currentTheme = theme;
}
applyTheme(currentTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
}

// ===========================================
// 3. РЕНДЕРИНГ
// ===========================================

let currentCategory = 'all';
let currentView = 'catalog';
let currentItemId = null;
const mainContent = document.getElementById('mainContent');

window.renderCatalog = function(category) {
    currentCategory = category || 'all';
    currentView = 'catalog';
    currentItemId = null;

    const filtered = currentCategory === 'all' ?
        data.items :
        data.items.filter(item => item.category === currentCategory);

    // Обновляем навигацию
    document.querySelectorAll('.nav a').forEach(link => {
        link.classList.toggle('active', link.dataset.category === currentCategory);
    });

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;padding:20px 0 10px;">
            <h2 style="font-size:1.8rem;">${currentCategory === 'all' ? '📚 Все моды' : currentCategory}</h2>
            <span style="opacity:0.6;">${filtered.length} модов</span>
        </div>
        <div class="catalog">
    `;

    if (filtered.length === 0) {
        html += `<p style="grid-column:1/-1;text-align:center;opacity:0.5;padding:40px 0;">Пока нет модов в этой категории</p>`;
    }

    filtered.forEach(item => {
        html += `
            <div class="card">
                <img class="preview" src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400/7c3aed/ffffff?text=No+Preview'">
                <h3>${item.title}</h3>
                <div class="meta">📌 ${item.category} • v${item.version} • ${item.date}</div>
                <div class="desc">${item.description}</div>
                <div class="rating">
                    <span class="score">⭐ ${item.rating}</span>
                    <button onclick="vote('${item.id}', 1)">👍</button>
                    <button onclick="vote('${item.id}', -1)">👎</button>
                    <span style="font-size:0.8rem;opacity:0.5;">${item.votes || 0} голосов</span>
                </div>
                <a href="#" onclick="showDetail('${item.id}');return false;" class="btn-detail">🔍 Подробнее</a>
                <a href="${item.download}" class="btn-download" onclick="event.stopPropagation();">⬇️ Скачать</a>
            </div>
        `;
    });

    html += '</div>';
    mainContent.innerHTML = html;
};

window.showDetail = function(id) {
    const item = data.items.find(i => i.id === id);
    if (!item) { renderCatalog('all'); return; }

    currentView = 'detail';
    currentItemId = id;

    let html = `
        <div class="detail-page">
            <a href="#" onclick="renderCatalog('${currentCategory}');return false;" class="back-link">← Назад к каталогу</a>
            <h2 style="font-size:2.2rem;">${item.title}</h2>
            <div style="display:flex;gap:16px;flex-wrap:wrap;opacity:0.7;margin:8px 0 16px;">
                <span>📌 ${item.category}</span>
                <span>📦 v${item.version}</span>
                <span>📅 ${item.date}</span>
                <span>⭐ ${item.rating}</span>
            </div>
            <img class="detail-preview" src="${item.image}" alt="${item.title}" onerror="this.style.display='none'">
            <div style="font-size:1.1rem;line-height:1.8;margin:20px 0;">
                ${item.details || item.description}
            </div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:20px;">
                <a href="${item.download}" class="btn-download" style="font-size:1.1rem;padding:12px 32px;">⬇️ Скачать ${item.title}</a>
                <a href="#" onclick="renderCatalog('${currentCategory}');return false;" class="btn-detail" style="font-size:1.1rem;padding:12px 32px;">← Ко всем модам</a>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;
};

// ===========================================
// 4. ГОЛОСОВАНИЕ
// ===========================================

window.vote = function(id, delta) {
    const item = data.items.find(i => i.id === id);
    if (!item) return;

    const votedKey = 'voted_' + id;
    if (localStorage.getItem(votedKey)) {
        showToast('Вы уже голосовали за этот мод!', 'error');
        return;
    }

    item.rating += delta;
    item.votes = (item.votes || 0) + 1;
    localStorage.setItem(votedKey, 'true');
    saveData(data);

    if (currentView === 'detail' && currentItemId === id) {
        showDetail(id);
    } else {
        renderCatalog(currentCategory);
    }
    showToast('✅ Спасибо! Рейтинг изменён', 'success');
};

// ===========================================
// 5. НАВИГАЦИЯ
// ===========================================

document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const cat = this.dataset.category;

        if (cat === 'admin') {
            showAdminPanel();
            return;
        }

        renderCatalog(cat);
    });
});

// ===========================================
// 6. АДМИНКА
// ===========================================

// ⚠️ СМЕНИ ПАРОЛЬ ЗДЕСЬ!
const ADMIN_PASSWORD = 'microb2026';

let adminAuthenticated = false;

window.showAdminPanel = function() {
    let html = `
        <div class="admin-section">
            <div class="admin-panel">
                <h2>🔒 Админ-панель</h2>
    `;

    if (!adminAuthenticated) {
        html += `
                <p style="margin-bottom:16px;">Введите пароль для управления модами</p>
                <div class="password-input">
                    <input type="password" id="adminPassword" placeholder="Введите пароль" style="width:100%;padding:12px;border-radius:10px;border:1px solid #7c3aed;">
                </div>
                <button class="btn-primary" onclick="loginAdmin()">🔑 Войти</button>
                <div style="margin-top:12px;font-size:0.8rem;opacity:0.4;">Пароль: microb2026 (смените его в коде)</div>
        `;
    } else {
        html += `
                <p style="margin-bottom:16px;color:#22c55e;">✅ Вы авторизованы как microbiwe</p>
                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
                    <button class="btn-primary" onclick="logoutAdmin()" style="background:#6b7280;">🚪 Выйти</button>
                    <button class="btn-primary" onclick="exportData()" style="background:#3b82f6;">💾 Экспорт</button>
                    <button class="btn-primary" onclick="importData()" style="background:#8b5cf6;">📥 Импорт</button>
                </div>
                <hr style="border-color:rgba(124,58,237,0.2);margin:16px 0;">
                <h3>➕ Добавить новый мод</h3>
                <form id="addModForm" onsubmit="addMod(event)">
                    <label>Название</label>
                    <input type="text" id="modTitle" required placeholder="Название мода">

                    <label>Категория</label>
                    <select id="modCategory" required>
                        <option value="Сборки">Сборки</option>
                        <option value="Скрипты">Скрипты</option>
                        <option value="Текстуры">Текстуры</option>
                        <option value="Графика">Графика</option>
                        <option value="Оружие">Оружие</option>
                    </select>

                    <label>Краткое описание</label>
                    <textarea id="modDesc" required placeholder="Кратко о моде"></textarea>

                    <label>Полное описание</label>
                    <textarea id="modDetails" placeholder="Подробное описание..."></textarea>

                    <label>Версия</label>
                    <input type="text" id="modVersion" required placeholder="1.0">

                    <label>Дата</label>
                    <input type="date" id="modDate" required>

                    <label>Ссылка на превью</label>
                    <input type="url" id="modImage" placeholder="https://example.com/preview.jpg">

                    <label>Ссылка на скачивание</label>
                    <input type="url" id="modDownload" required placeholder="https://example.com/mod.zip">

                    <button type="submit" class="btn-primary">📤 Опубликовать мод</button>
                </form>

                <div class="admin-list">
                    <h3>📋 Все моды (${data.items.length})</h3>
                    ${data.items.map(item => `
                        <div class="admin-item">
                            <span><strong>${item.title}</strong> <span style="opacity:0.5;font-size:0.85rem;">(${item.category})</span></span>
                            <button class="delete-btn" onclick="deleteMod('${item.id}')">🗑 Удалить</button>
                        </div>
                    `).join('')}
                </div>
        `;
    }

    html += `</div></div>`;
    mainContent.innerHTML = html;
    currentView = 'admin';

    if (adminAuthenticated) {
        const dateInput = document.getElementById('modDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    }
};

window.loginAdmin = function() {
    const input = document.getElementById('adminPassword');
    if (!input) return;
    if (input.value === ADMIN_PASSWORD) {
        adminAuthenticated = true;
        showToast('✅ Добро пожаловать, microbiwe!', 'success');
        showAdminPanel();
    } else {
        showToast('❌ Неверный пароль!', 'error');
        input.value = '';
        input.focus();
    }
};

window.logoutAdmin = function() {
    adminAuthenticated = false;
    showAdminPanel();
    showToast('👋 Вы вышли из админ-панели', 'success');
};

window.addMod = function(e) {
    e.preventDefault();
    if (!adminAuthenticated) {
        showToast('❌ Сначала авторизуйтесь!', 'error');
        return;
    }

    const title = document.getElementById('modTitle').value.trim();
    const category = document.getElementById('modCategory').value;
    const desc = document.getElementById('modDesc').value.trim();
    const details = document.getElementById('modDetails').value.trim() || desc;
    const version = document.getElementById('modVersion').value.trim();
    const date = document.getElementById('modDate').value;
    const image = document.getElementById('modImage').value.trim() ||
        'https://via.placeholder.com/600x400/7c3aed/ffffff?text=' + encodeURIComponent(title);
    const download = document.getElementById('modDownload').value.trim();

    if (!title || !desc || !version || !date || !download) {
        showToast('❌ Заполните все обязательные поля!', 'error');
        return;
    }

    const id = 'mod-' + Date.now();

    data.items.push({
        id,
        category,
        title,
        description: desc,
        details,
        version,
        date,
        image,
        download,
        rating: 0,
        votes: 0
    });

    saveData(data);
    showToast(`✅ Мод "${title}" успешно добавлен!`, 'success');
    renderCatalog(currentCategory);

    document.getElementById('addModForm').reset();
    document.getElementById('modDate').value = new Date().toISOString().split('T')[0];
};

window.deleteMod = function(id) {
    if (!adminAuthenticated) {
        showToast('❌ Сначала авторизуйтесь!', 'error');
        return;
    }
    const item = data.items.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`Удалить мод "${item.title}"?`)) return;

    data.items = data.items.filter(i => i.id !== id);
    saveData(data);
    showToast(`🗑 Мод "${item.title}" удалён`, 'success');
    showAdminPanel();
};

window.exportData = function() {
    if (!adminAuthenticated) {
        showToast('❌ Сначала авторизуйтесь!', 'error');
        return;
    }
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microb-archive-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 Данные экспортированы!', 'success');
};

window.importData = function() {
    if (!adminAuthenticated) {
        showToast('❌ Сначала авторизуйтесь!', 'error');
        return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (imported && imported.items) {
                    data.items = imported.items;
                    saveData(data);
                    showToast('📥 Данные импортированы!', 'success');
                    showAdminPanel();
                } else {
                    showToast('❌ Неверный формат файла!', 'error');
                }
            } catch (err) {
                showToast('❌ Ошибка чтения файла!', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// ===========================================
// 7. УВЕДОМЛЕНИЯ
// ===========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// ===========================================
// 8. ЗАПУСК
// ===========================================

renderCatalog('all');

if (window.location.search.includes('admin')) {
    showAdminPanel();
}

console.log('🚀 Microb Archive загружен!');
console.log('📦 Всего модов:', data.items.length);
console.log('🔒 Пароль админа:', ADMIN_PASSWORD);
console.log('💡 Чтобы открыть админку, нажми "Админ" в навигации');
