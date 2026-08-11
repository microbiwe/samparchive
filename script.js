// ===========================================
// 1. КОНФИГУРАЦИЯ
// ===========================================

const CONFIG = {
    owner: 'microbiwe',
    repo: 'samparchive',
    path: 'items.json',
    branch: 'main'
};

// ===========================================
// 2. ДАННЫЕ
// ===========================================

let data = { items: [] };
let currentCategory = 'all';
let currentView = 'catalog';
let currentItemId = null;
let editingId = null;
const mainContent = document.getElementById('mainContent');

// ===========================================
// 3. ЗАГРУЗКА ДАННЫХ (СПОКОЙНАЯ ВЕРСИЯ)
// ===========================================

async function loadData() {
    let loaded = false;
    
    // 1. Пытаемся загрузить с GitHub
    try {
        const url = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${CONFIG.path}?t=${Date.now()}`;
        const response = await fetch(url);
        if (response.ok) {
            const jsonData = await response.json();
            if (jsonData && jsonData.items && jsonData.items.length > 0) {
                data = jsonData;
                localStorage.setItem('microbArchiveData', JSON.stringify(data));
                console.log('✅ Загружено с GitHub');
                loaded = true;
            }
        }
    } catch (e) {
        console.log('⚠️ GitHub не отвечает');
    }

    // 2. Если GitHub не помог — берём из localStorage
    if (!loaded) {
        try {
            const saved = localStorage.getItem('microbArchiveData');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.items && parsed.items.length > 0) {
                    data = parsed;
                    console.log('✅ Загружено из localStorage');
                    loaded = true;
                }
            }
        } catch (e) {}
    }

    // 3. Если данных нет — создаём чистый архив
    if (!loaded) {
        data = { items: [] };
        localStorage.setItem('microbArchiveData', JSON.stringify(data));
        console.log('✅ Создан новый архив');
    }

    renderCatalog('all');
    updateAdminUI();
}

// ===========================================
// 4. СОХРАНЕНИЕ (через скачивание файла)
// ===========================================

function downloadJSON() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✅ Файл items.json скачан! Загрузи его в корень репозитория', 'success');
}

// ===========================================
// 5. ОЧИСТКА КЭША
// ===========================================

function clearCacheAndReload() {
    localStorage.removeItem('microbArchiveData');
    localStorage.removeItem('microbTheme');
    // Удаляем все голоса
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('voted_')) {
            localStorage.removeItem(key);
        }
    });
    showToast('🧹 Кэш очищен! Страница перезагрузится...', 'success');
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// ===========================================
// 6. ТЕМА
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
// 7. РЕНДЕРИНГ (БЕЗОПАСНАЯ ВЕРСИЯ)
// ===========================================

window.renderCatalog = function(category) {
    if (!mainContent) return;
    
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
        html += `<p style="grid-column:1/-1;text-align:center;opacity:0.5;padding:40px 0;">Пока нет модов. Добавь первый через админку!</p>`;
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
                <a href="${item.download}" class="btn-download" onclick="event.stopPropagation();" download>⬇️ Скачать</a>
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
                <a href="${item.download}" class="btn-download" style="font-size:1.1rem;padding:12px 32px;" download>⬇️ Скачать ${item.title}</a>
                <a href="#" onclick="renderCatalog('${currentCategory}');return false;" class="btn-detail" style="font-size:1.1rem;padding:12px 32px;">← Ко всем модам</a>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;
};

// ===========================================
// 8. ГОЛОСОВАНИЕ
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
    localStorage.setItem('microbArchiveData', JSON.stringify(data));

    if (currentView === 'detail' && currentItemId === id) {
        showDetail(id);
    } else {
        renderCatalog(currentCategory);
    }
    showToast('✅ Спасибо! Рейтинг изменён', 'success');
};

// ===========================================
// 9. НАВИГАЦИЯ
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
// 10. АДМИНКА (С НОВЫМИ КНОПКАМИ)
// ===========================================

const ADMIN_PASSWORD = 'kska78279';
let adminAuthenticated = false;

function updateAdminUI() {
    // Эта функция обновляет счётчик модов в админке, если она открыта
    const list = document.querySelector('.admin-list h3');
    if (list) {
        list.textContent = `📋 Все моды (${data.items.length})`;
    }
}

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
        `;
    } else {
        html += `
                <p style="margin-bottom:16px;color:#22c55e;">✅ Вы авторизованы как microbiwe</p>
                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
                    <button class="btn-primary" onclick="logoutAdmin()" style="background:#6b7280;">🚪 Выйти</button>
                    <button class="btn-primary" onclick="downloadJSON()" style="background:#22c55e;">💾 Скачать items.json</button>
                    <button class="btn-primary" onclick="clearCacheAndReload()" style="background:#ef4444;">🧹 Очистить кэш</button>
                </div>
                <div style="background:rgba(34,197,94,0.1);border:1px solid #22c55e;border-radius:10px;padding:12px;margin-bottom:20px;">
                    <p style="font-size:0.9rem;margin:0;">
                        📌 <strong>Важно!</strong> После добавления или удаления модов:<br>
                        1️⃣ Нажми <strong>"💾 Скачать items.json"</strong><br>
                        2️⃣ Загрузи этот файл в корень репозитория на GitHub<br>
                        3️⃣ Обнови страницу — изменения появятся!
                    </p>
                </div>
                <hr style="border-color:rgba(124,58,237,0.2);margin:16px 0;">
                <h3>${editingId ? '✏️ Редактировать мод' : '➕ Добавить новый мод'}</h3>
                <form id="addModForm" onsubmit="saveMod(event)">
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

                    <label>Изображение (превью)</label>
                    <input type="text" id="modImage" placeholder="img/preview/название.jpg">
                    <div style="font-size:0.8rem;opacity:0.5;margin-top:4px;">
                        📁 Загрузи картинку в папку img/preview/ на GitHub
                    </div>

                    <label>Ссылка на скачивание</label>
                    <input type="url" id="modDownload" required placeholder="https://drive.google.com/uc?export=download&id=ID">
                    <div style="font-size:0.8rem;opacity:0.5;margin-top:4px;">
                        📥 Вставь прямую ссылку на скачивание
                    </div>

                    <button type="submit" class="btn-primary">
                        ${editingId ? '💾 Сохранить изменения' : '📤 Опубликовать мод'}
                    </button>
                    ${editingId ? `<button type="button" class="btn-primary" onclick="cancelEdit()" style="background:#6b7280;margin-left:12px;">❌ Отменить</button>` : ''}
                </form>

                <div class="admin-list">
                    <h3>📋 Все моды (${data.items.length})</h3>
                    ${data.items.map(item => `
                        <div class="admin-item">
                            <span><strong>${item.title}</strong> <span style="opacity:0.5;font-size:0.85rem;">(${item.category})</span></span>
                            <div>
                                <button class="edit-btn" onclick="editMod('${item.id}')">✏️</button>
                                <button class="delete-btn" onclick="deleteMod('${item.id}')">🗑</button>
                            </div>
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
        if (dateInput && !editingId) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }
};

// ===========================================
// 11. АВТОРИЗАЦИЯ
// ===========================================

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
    editingId = null;
    showAdminPanel();
    showToast('👋 Вы вышли из админ-панели', 'success');
};

window.cancelEdit = function() {
    editingId = null;
    showAdminPanel();
};

// ===========================================
// 12. УПРАВЛЕНИЕ МОДАМИ
// ===========================================

window.editMod = function(id) {
    if (!adminAuthenticated) {
        showToast('❌ Сначала авторизуйтесь!', 'error');
        return;
    }

    const item = data.items.find(i => i.id === id);
    if (!item) return;

    editingId = id;
    showAdminPanel();

    setTimeout(() => {
        document.getElementById('modTitle').value = item.title;
        document.getElementById('modCategory').value = item.category;
        document.getElementById('modDesc').value = item.description;
        document.getElementById('modDetails').value = item.details || '';
        document.getElementById('modVersion').value = item.version;
        document.getElementById('modDate').value = item.date;
        document.getElementById('modImage').value = item.image || '';
        document.getElementById('modDownload').value = item.download || '';
    }, 50);
};

window.saveMod = function(e) {
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

    if (editingId) {
        const item = data.items.find(i => i.id === editingId);
        if (item) {
            item.title = title;
            item.category = category;
            item.description = desc;
            item.details = details;
            item.version = version;
            item.date = date;
            item.image = image;
            item.download = download;
            showToast(`✅ Мод "${title}" обновлён!`, 'success');
        }
        editingId = null;
    } else {
        const id = 'mod-' + Date.now();
        data.items.push({
            id, category, title, description: desc, details, version, date, image, download,
            rating: 0, votes: 0
        });
        showToast(`✅ Мод "${title}" добавлен!`, 'success');
    }

    // Сохраняем в localStorage
    localStorage.setItem('microbArchiveData', JSON.stringify(data));
    
    renderCatalog(currentCategory);
    showAdminPanel();
    updateAdminUI();
    
    // Напоминаем про скачивание JSON
    showToast('📌 Не забудь скачать items.json и загрузить на GitHub!', 'success');
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
    localStorage.setItem('microbArchiveData', JSON.stringify(data));
    
    showToast(`🗑 Мод "${item.title}" удалён`, 'success');
    showAdminPanel();
    updateAdminUI();
    
    // Напоминаем про скачивание JSON
    showToast('📌 Не забудь скачать items.json и загрузить на GitHub!', 'success');
};

// ===========================================
// 13. УВЕДОМЛЕНИЯ
// ===========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ===========================================
// 14. ЗАПУСК
// ===========================================

loadData();

if (window.location.search.includes('admin')) {
    setTimeout(showAdminPanel, 500);
}

console.log('🚀 Microb Archive загружен!');
console.log('📦 Всего модов:', data.items.length);
console.log('📌 Чтобы сохранить изменения, нажми "Скачать items.json" в админке');
