// pages/AdminPage.js
import { OrderService }  from '../services/OrderService.js';
import { ProductService } from '../services/ProductService.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const KANBAN_COLS = [
    { status: 'pending',    label: 'Новые',        color: '#f59e0b' },
    { status: 'confirmed',  label: 'Подтверждены', color: '#3b82f6' },
    { status: 'processing', label: 'В обработке',  color: '#8b5cf6' },
    { status: 'shipped',    label: 'Отправлены',   color: '#06b6d4' },
    { status: 'delivered',  label: 'Доставлены',   color: '#10b981' },
    { status: 'cancelled',  label: 'Отменены',     color: '#ef4444' },
];

const CATEGORIES = [
    { value: 'rose',          label: 'Роза' },
    { value: 'carnations',    label: 'Гвоздика' },
    { value: 'chrysanthemums',label: 'Хризантема' },
    { value: 'dahlias',       label: 'Георгин' },
    { value: 'chamomiles',    label: 'Ромашка' },
    { value: 'gerberas',      label: 'Гербера' },
    { value: 'peonies',       label: 'Пион' },
    { value: 'orchids',       label: 'Орхидея' },
    { value: 'tulips',        label: 'Тюльпан' },
    { value: 'sunflowers',    label: 'Подсолнух' },
];

// ─── AdminPage ───────────────────────────────────────────────────────────────

export class AdminPage {
    constructor() {
        this.activeTab            = 'dashboard';
        this.products             = [];
        this.autoProgressInterval = null;
        this.autoProgressSec      = 10;
        this.draggedOrderId       = null;
        this.paletteIndex         = 0;
        this.paletteFiltered      = [];
        this.editingProduct       = null;
    }

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    async init() {
        this._checkAuth();
        this.products = await ProductService.getAll();
        this._render();
        this._mountModal();
        this._mountPalette();
        this._initCommandPalette();
        this._renderDashboard();
    }

    _checkAuth() {
        const user = window.appState?.get('user');
        if (!user || user.role !== 'admin') {
            document.getElementById('admin-main').innerHTML = `
                <div class="admin-access-denied">
                    <h2>🔒 Доступ запрещён</h2>
                    <p>Эта страница доступна только администраторам.</p>
                    <a href="login.html" class="btn btn-primary">Войти</a>
                </div>`;
            return;
        }
    }

    // ─── Shell ───────────────────────────────────────────────────────────────

    _render() {
        const main = document.getElementById('admin-main');
        main.innerHTML = `
            <div class="admin-panel container">
                <div class="admin-page-header">
                    <div>
                        <h1 class="admin-page-title">⚙ Панель управления</h1>
                        <p class="admin-page-subtitle">FlowerArt — управление магазином</p>
                    </div>
                    <button class="admin-cmd-btn" id="admin-cmd-open" title="Ctrl+X">
                        <span class="admin-cmd-key">Ctrl+X</span>
                        Команды
                    </button>
                </div>

                <nav class="admin-tabs">
                    <button class="admin-tab-btn active" data-tab="dashboard">📊 Дашборд</button>
                    <button class="admin-tab-btn" data-tab="orders">📦 Заказы</button>
                    <button class="admin-tab-btn" data-tab="catalog">🌸 Каталог</button>
                    <button class="admin-tab-btn" data-tab="settings">⚙ Настройки</button>
                </nav>

                <div class="admin-content">
                    <div class="admin-pane active" id="pane-dashboard"></div>
                    <div class="admin-pane"        id="pane-orders"></div>
                    <div class="admin-pane"        id="pane-catalog"></div>
                    <div class="admin-pane"        id="pane-settings"></div>
                </div>
            </div>
        `;

        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
        });

        document.getElementById('admin-cmd-open')?.addEventListener('click', () => this._openPalette());
    }

    _switchTab(tab) {
        this.activeTab = tab;

        document.querySelectorAll('.admin-tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.tab === tab)
        );
        document.querySelectorAll('.admin-pane').forEach(p =>
            p.classList.toggle('active', p.id === `pane-${tab}`)
        );

        const pane = document.getElementById(`pane-${tab}`);
        if (!pane || pane.dataset.rendered) return;

        if (tab === 'orders')   this._renderKanban();
        if (tab === 'catalog')  this._renderCatalogTab();
        if (tab === 'settings') this._renderSettings();

        pane.dataset.rendered = '1';
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────────────

    _renderDashboard() {
        const stats  = OrderService.getStats();
        const orders = OrderService.getAll();
        const today  = new Date().toISOString().slice(0, 10);
        const todayCount = orders.filter(o => o.date?.startsWith(today)).length;
        const weekRevenue = orders
            .filter(o => {
                const d = new Date(o.date);
                return (Date.now() - d.getTime()) < 7 * 86400000;
            })
            .reduce((s, o) => s + (o.total || 0), 0);

        const pane = document.getElementById('pane-dashboard');
        pane.innerHTML = `
            <div class="metrics-grid">
                ${this._metricCard('📦', 'Заказов сегодня',      todayCount,                             'amber')}
                ${this._metricCard('💰', 'Выручка за 7 дней',    weekRevenue.toLocaleString('ru-RU') + ' ₽', 'green')}
                ${this._metricCard('🌸', 'Товаров в каталоге',   this.products.length,                   'blue')}
                ${this._metricCard('⏳', 'Ожидают обработки',    stats.statusCounts.pending,             'red')}
            </div>

            <div class="dashboard-grid">
                <section class="recent-orders-section">
                    <h3 class="section-title">Последние заказы</h3>
                    <div class="recent-orders-list">
                        ${orders.slice(0, 6).map(o => `
                            <div class="recent-order-row" data-id="${o.id}">
                                <span class="recent-order__id">${o.id}</span>
                                <span class="recent-order__name">${o['first-name'] || ''} ${o['last-name'] || ''}</span>
                                <span class="recent-order__total">${(o.total || 0).toLocaleString('ru-RU')} ₽</span>
                                <span class="status-badge status-${o.status}">${this._statusLabel(o.status)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary admin-btn-sm" id="dash-to-orders" style="margin-top:1rem;">
                        Все заказы →
                    </button>
                </section>

                <section class="assistant-section">
                    <h3 class="section-title">🤖 Умный ассистент</h3>
                    <div id="admin-assistant-tips"></div>
                    <a href="analitick.html" class="btn btn-secondary admin-btn-sm" style="margin-top:1rem;display:inline-block;">
                        Подробная аналитика →
                    </a>
                </section>
            </div>
        `;

        document.getElementById('dash-to-orders')?.addEventListener('click', () => this._switchTab('orders'));
        document.querySelectorAll('.recent-order-row').forEach(row => {
            row.addEventListener('click', () => {
                this._switchTab('orders');
                setTimeout(() => this._highlightOrder(row.dataset.id), 100);
            });
        });

        this._renderAssistant(document.getElementById('admin-assistant-tips'));
        pane.dataset.rendered = '1';
    }

    _renderAssistant(container) {
        if (!container) return;
        const stats = OrderService.getStats();
        const tips  = this._generateTips(stats);

        if (tips.length === 0) {
            container.innerHTML = `<p class="assistant-stub__hint">Недостаточно данных для советов.</p>`;
            return;
        }
        container.innerHTML = tips.map(t => `
            <div class="assistant-tip assistant-tip--${t.type}">
                <span class="assistant-tip__icon">${t.icon}</span>
                <p class="assistant-tip__text">${t.text}</p>
            </div>
        `).join('');
    }

    _generateTips(s) {
        const tips = [];
        const LABELS = { red:'Красный', pink:'Розовый', white:'Белый', yellow:'Жёлтый',
            blue:'Синий', purple:'Фиолетовый', orange:'Оранжевый', green:'Зелёный',
            black:'Чёрный', cream:'Кремовый', burgundy:'Бордовый', blackpink:'Тёмно-розовый' };
        const DAYS = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

        if (s.topProducts.length > 0) {
            const top = s.topProducts[0];
            tips.push({ type: 'success', icon: '🌺',
                text: `"${top.name}" — лидер продаж (${top.count} шт.). Рекомендуем поставить на главную.` });
        }
        if (s.statusCounts.pending > 2) {
            tips.push({ type: 'warning', icon: '⚠️',
                text: `${s.statusCounts.pending} заказ(а) ожидают обработки. Откройте Kanban-доску.` });
        }
        const dayMap = {};
        s.byDay.forEach(d => {
            const dow = new Date(d.date).getDay();
            dayMap[dow] = (dayMap[dow] || 0) + d.orders;
        });
        const peak = Object.entries(dayMap).sort((a,b) => b[1]-a[1])[0];
        if (peak) {
            tips.push({ type: 'info', icon: '📅',
                text: `${DAYS[peak[0]]} — пиковый день. Запускайте акции накануне.` });
        }
        if (s.topColors.length > 0) {
            const tc = s.topColors[0];
            tips.push({ type: 'success', icon: '🎨',
                text: `Цвет "${LABELS[tc.color]||tc.color}" — самый продаваемый (${tc.count} шт.).` });
        }
        return tips.slice(0, 3);
    }

    _metricCard(icon, label, value, color) {
        return `
            <div class="metric-card metric-card--${color}">
                <div class="metric-card__icon">${icon}</div>
                <div class="metric-card__body">
                    <div class="metric-card__value">${value}</div>
                    <div class="metric-card__label">${label}</div>
                </div>
            </div>`;
    }

    // ─── KANBAN ───────────────────────────────────────────────────────────────

    _renderKanban() {
        const pane   = document.getElementById('pane-orders');
        const orders = OrderService.getAll();

        pane.innerHTML = `
            <div class="kanban-toolbar">
                <div class="auto-progress-controls">
                    <label class="auto-progress-label">
                        <div class="toggle-switch">
                            <input type="checkbox" id="auto-toggle">
                            <span class="toggle-slider"></span>
                        </div>
                        <span>🤖 Авто-прогресс (демо)</span>
                    </label>
                    <select class="admin-select" id="auto-speed">
                        <option value="5">5 сек</option>
                        <option value="10" selected>10 сек</option>
                        <option value="30">30 сек</option>
                    </select>
                </div>
                <span class="kanban-hint">Перетащите карточку для смены статуса</span>
            </div>
            <div class="kanban-board" id="kanban-board"></div>
        `;

        this._buildKanbanColumns(orders);
        this._initDragDrop();
        this._bindAutoProgress();
    }

    _buildKanbanColumns(orders) {
        const board = document.getElementById('kanban-board');
        if (!board) return;

        board.innerHTML = KANBAN_COLS.map(col => {
            const colOrders = orders.filter(o => o.status === col.status);
            const cards = colOrders.map(o => `
                <div class="kanban-card" draggable="true" data-order-id="${o.id}">
                    <div class="kanban-card__id">${o.id}</div>
                    <div class="kanban-card__customer">
                        ${o['first-name'] || ''} ${o['last-name'] || ''}
                    </div>
                    <div class="kanban-card__meta">
                        <span class="kanban-card__total">${(o.total || 0).toLocaleString('ru-RU')} ₽</span>
                        <span class="kanban-card__date">${this._formatDate(o.date)}</span>
                    </div>
                    <div class="kanban-card__items">${(o.items || []).length} товар(а)</div>
                </div>
            `).join('');

            return `
                <div class="kanban-col" data-status="${col.status}">
                    <div class="kanban-col__head" style="border-top: 3px solid ${col.color}">
                        <span class="kanban-col__label">${col.label}</span>
                        <span class="kanban-col__count" style="background:${col.color}">${colOrders.length}</span>
                    </div>
                    <div class="kanban-col__body" data-status="${col.status}">
                        ${cards}
                    </div>
                </div>
            `;
        }).join('');
    }

    _initDragDrop() {
        const board = document.getElementById('kanban-board');
        if (!board) return;

        board.addEventListener('dragstart', e => {
            const card = e.target.closest('.kanban-card');
            if (!card) return;
            this.draggedOrderId = card.dataset.orderId;
            card.classList.add('dragging');
        });

        board.addEventListener('dragend', e => {
            e.target.closest('.kanban-card')?.classList.remove('dragging');
            board.querySelectorAll('.kanban-col__body').forEach(b => b.classList.remove('drag-over'));
        });

        board.addEventListener('dragover', e => {
            e.preventDefault();
            const col = e.target.closest('.kanban-col__body');
            if (col) {
                board.querySelectorAll('.kanban-col__body').forEach(b => b.classList.remove('drag-over'));
                col.classList.add('drag-over');
            }
        });

        board.addEventListener('dragleave', e => {
            if (!e.relatedTarget?.closest?.('.kanban-col__body')) {
                board.querySelectorAll('.kanban-col__body').forEach(b => b.classList.remove('drag-over'));
            }
        });

        board.addEventListener('drop', e => {
            e.preventDefault();
            const col = e.target.closest('.kanban-col__body');
            if (!col || !this.draggedOrderId) return;

            const newStatus = col.dataset.status;
            OrderService.updateStatus(this.draggedOrderId, newStatus);
            this.draggedOrderId = null;

            this._buildKanbanColumns(OrderService.getAll());
            this._initDragDrop();
            this._showToast(`Статус обновлён: ${this._statusLabel(newStatus)}`);
        });
    }

    _bindAutoProgress() {
        const toggle = document.getElementById('auto-toggle');
        const speed  = document.getElementById('auto-speed');
        if (!toggle) return;

        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                this.autoProgressSec = parseInt(speed?.value || '10');
                this._startAutoProgress();
            } else {
                this._stopAutoProgress();
            }
        });
        speed?.addEventListener('change', () => {
            if (toggle.checked) {
                this._stopAutoProgress();
                this.autoProgressSec = parseInt(speed.value);
                this._startAutoProgress();
            }
        });
    }

    _startAutoProgress() {
        const FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
        this.autoProgressInterval = setInterval(() => {
            const orders    = OrderService.getAll();
            const candidate = orders
                .filter(o => FLOW.indexOf(o.status) < FLOW.length - 1)
                .sort((a, b) => FLOW.indexOf(a.status) - FLOW.indexOf(b.status))[0];

            if (!candidate) return;

            const next = FLOW[FLOW.indexOf(candidate.status) + 1];
            OrderService.updateStatus(candidate.id, next);
            this._buildKanbanColumns(OrderService.getAll());
            this._initDragDrop();
            this._showToast(`🤖 ${candidate.id}: ${this._statusLabel(candidate.status)} → ${this._statusLabel(next)}`);
        }, this.autoProgressSec * 1000);
    }

    _stopAutoProgress() {
        clearInterval(this.autoProgressInterval);
        this.autoProgressInterval = null;
    }

    // ─── CATALOG ─────────────────────────────────────────────────────────────

    _renderCatalogTab() {
        const pane = document.getElementById('pane-catalog');
        pane.innerHTML = `
            <div class="admin-toolbar">
                <h3 class="admin-toolbar__title">
                    Каталог товаров
                    <span class="catalog-count" id="catalog-count">${this.products.length}</span>
                </h3>
                <button class="btn btn-primary" id="btn-add-product">+ Добавить товар</button>
            </div>
            <div class="admin-product-grid" id="admin-product-grid"></div>
        `;

        this._renderProductGrid();
        document.getElementById('btn-add-product')?.addEventListener('click', () => this._openProductModal());
    }

    _renderProductGrid() {
        const grid = document.getElementById('admin-product-grid');
        if (!grid) return;

        grid.innerHTML = this.products.map(p => {
            const img = p.variations?.[0]?.image || '';
            return `
                <div class="admin-product-card" data-id="${p.id}">
                    <img class="admin-product-card__img"
                         src="${img}" alt="${p.name}"
                         onerror="this.onerror=null;this.src='../images/placeholder.jpg'">
                    <div class="admin-product-card__info">
                        <p class="admin-product-card__name">${p.name}</p>
                        <p class="admin-product-card__meta">
                            ${p.variations?.length || 0} вар.
                            ${p.badge ? `<span class="admin-badge">${p.badge}</span>` : ''}
                        </p>
                    </div>
                    <div class="admin-product-card__actions">
                        <button class="btn-icon btn-edit" data-id="${p.id}" title="Редактировать">✏</button>
                        <button class="btn-icon btn-delete-product" data-id="${p.id}" title="Удалить">🗑</button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const product = this.products.find(p => p.id === parseInt(btn.dataset.id));
                if (product) this._openProductModal(product);
            });
        });

        grid.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Удалить товар?')) return;
                ProductService.delete(parseInt(btn.dataset.id));
                this.products = ProductService.getAllSync();
                this._renderProductGrid();
                const cnt = document.getElementById('catalog-count');
                if (cnt) cnt.textContent = this.products.length;
                this._showToast('Товар удалён');
            });
        });
    }

    // ─── PRODUCT MODAL ───────────────────────────────────────────────────────

    _mountModal() {
        const overlay = document.createElement('div');
        overlay.id        = 'product-modal-overlay';
        overlay.className = 'modal-overlay hidden';
        overlay.innerHTML = `
            <div class="product-modal" id="product-modal">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title">Добавить товар</h3>
                    <button class="cart-drawer__close" id="modal-close">✕</button>
                </div>

                <div class="modal-form-group">
                    <label>Название *</label>
                    <input class="modal-input" id="modal-name" placeholder="Роза шелковая">
                </div>
                <div class="modal-form-group">
                    <label>Описание</label>
                    <input class="modal-input" id="modal-desc" placeholder="Материал: шелк">
                </div>
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label>Категория</label>
                        <select class="modal-input" id="modal-category">
                            ${CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="modal-form-group">
                        <label>Badge</label>
                        <select class="modal-input" id="modal-badge">
                            <option value="">— нет —</option>
                            <option value="Хит">Хит</option>
                            <option value="Новинка">Новинка</option>
                            <option value="Акция">Акция</option>
                        </select>
                    </div>
                </div>

                <div class="modal-variations-header">
                    <label>Вариации (цвет / цена / изображение)</label>
                    <button class="btn btn-secondary admin-btn-sm" id="btn-add-variation">+ Добавить</button>
                </div>
                <div class="variations-list" id="variations-list"></div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" id="modal-cancel">Отмена</button>
                    <button class="btn btn-primary" id="modal-save">Сохранить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => { if (e.target === overlay) this._closeProductModal(); });
        document.getElementById('modal-close')?.addEventListener('click',  () => this._closeProductModal());
        document.getElementById('modal-cancel')?.addEventListener('click', () => this._closeProductModal());
        document.getElementById('modal-save')?.addEventListener('click',   () => this._saveProduct());
        document.getElementById('btn-add-variation')?.addEventListener('click', () => {
            this._addVariationRow(document.getElementById('variations-list'));
        });
    }

    _openProductModal(product = null) {
        this.editingProduct = product;
        const overlay = document.getElementById('product-modal-overlay');
        const title   = document.getElementById('modal-title');
        const varList = document.getElementById('variations-list');

        title.textContent = product ? 'Редактировать товар' : 'Добавить товар';

        document.getElementById('modal-name').value     = product?.name || '';
        document.getElementById('modal-desc').value     = product?.description || '';
        document.getElementById('modal-badge').value    = product?.badge || '';
        document.getElementById('modal-category').value = product?.category || 'rose';

        varList.innerHTML = '';
        const variations = product?.variations?.length ? product.variations : [{}];
        variations.forEach(v => this._addVariationRow(varList, v));

        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    _closeProductModal() {
        document.getElementById('product-modal-overlay')?.classList.add('hidden');
        document.body.style.overflow = '';
        this.editingProduct = null;
    }

    _addVariationRow(container, v = {}) {
        const row = document.createElement('div');
        row.className = 'variation-row';
        row.innerHTML = `
            <input  class="modal-input var-color-name" placeholder="red"   value="${v.color || ''}">
            <input  type="color" class="var-color-hex" value="${v.hex || '#ff0000'}">
            <input  class="modal-input var-price" placeholder="₽" type="number" value="${v.price || ''}">
            <input  class="modal-input var-image" placeholder="URL изображения" value="${v.image || ''}">
            <button class="btn-icon btn-remove-var" title="Удалить">✕</button>
        `;
        row.querySelector('.btn-remove-var').addEventListener('click', () => row.remove());
        container.appendChild(row);
    }

    _saveProduct() {
        const name = document.getElementById('modal-name').value.trim();
        if (!name) { this._showToast('Укажите название товара', 'error'); return; }

        const varRows = document.querySelectorAll('#variations-list .variation-row');
        if (varRows.length === 0) { this._showToast('Добавьте хотя бы одну вариацию', 'error'); return; }

        const variations = Array.from(varRows).map(row => ({
            color: row.querySelector('.var-color-name').value.trim() || 'default',
            hex:   row.querySelector('.var-color-hex').value,
            price: parseFloat(row.querySelector('.var-price').value) || 0,
            image: row.querySelector('.var-image').value.trim(),
        }));

        const product = {
            ...(this.editingProduct || {}),
            name,
            description: document.getElementById('modal-desc').value.trim(),
            category:    document.getElementById('modal-category').value,
            badge:       document.getElementById('modal-badge').value || null,
            variations,
        };

        ProductService.save(product);
        this.products = ProductService.getAllSync();
        this._closeProductModal();

        const pane = document.getElementById('pane-catalog');
        delete pane.dataset.rendered;
        this._renderCatalogTab();
        pane.dataset.rendered = '1';

        this._showToast(this.editingProduct ? 'Товар обновлён' : 'Товар добавлен');
    }

    // ─── SETTINGS ────────────────────────────────────────────────────────────

    _renderSettings() {
        const threshold = localStorage.getItem('flowerart_delivery_threshold') || '5000';
        const promo     = JSON.parse(localStorage.getItem('flowerart_promo_banner') || '{}');
        const pane      = document.getElementById('pane-settings');

        pane.innerHTML = `
            <div class="settings-grid">

                <div class="settings-card">
                    <h3>🚚 Доставка</h3>
                    <div class="settings-group">
                        <label>Бесплатная доставка от (₽)</label>
                        <div class="settings-inline">
                            <input type="number" class="settings-input" id="setting-threshold" value="${threshold}">
                            <button class="btn btn-primary" id="save-threshold">Сохранить</button>
                        </div>
                        <p class="settings-hint">Текущий порог: <strong>${parseInt(threshold).toLocaleString('ru-RU')} ₽</strong></p>
                    </div>
                </div>

                <div class="settings-card">
                    <h3>📢 Промо-баннер</h3>
                    <div class="settings-group">
                        <label class="toggle-label">
                            <div class="toggle-switch">
                                <input type="checkbox" id="promo-active" ${promo.active ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                            Показывать на всех страницах
                        </label>
                    </div>
                    <div class="settings-group">
                        <label>Текст баннера</label>
                        <input type="text" class="settings-input" id="promo-text"
                               value="${promo.text || ''}"
                               placeholder="🌸 Скидка 20% на все розы до 10 июня!">
                    </div>
                    <button class="btn btn-primary" id="save-promo">Применить</button>
                </div>

                <div class="settings-card">
                    <h3>🔄 Управление данными</h3>
                    <div class="settings-group">
                        <p class="settings-hint">Сброс каталога к заводским настройкам (из flowers.js)</p>
                        <button class="btn btn-secondary" id="btn-reset-catalog">Сбросить каталог</button>
                    </div>
                    <div class="settings-group" style="margin-top: 1rem;">
                        <p class="settings-hint">Пересоздать демо-заказы для тестирования</p>
                        <button class="btn btn-secondary" id="btn-reseed">Пересоздать заказы (демо)</button>
                    </div>
                </div>

                <div class="settings-card settings-card--info">
                    <h3>📋 О системе</h3>
                    <div class="settings-info-row">
                        <span>Версия</span><span>FlowerArt v1.0</span>
                    </div>
                    <div class="settings-info-row">
                        <span>Заказов в базе</span>
                        <span>${OrderService.getAll().length}</span>
                    </div>
                    <div class="settings-info-row">
                        <span>Товаров в каталоге</span>
                        <span>${this.products.length}</span>
                    </div>
                    <div class="settings-info-row">
                        <span>Хранилище</span><span>localStorage</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('save-threshold')?.addEventListener('click', () => {
            const val = document.getElementById('setting-threshold').value;
            localStorage.setItem('flowerart_delivery_threshold', val);
            this._showToast(`Порог доставки: ${parseInt(val).toLocaleString('ru-RU')} ₽`);
            const hint = document.querySelector('.settings-hint strong');
            if (hint) hint.textContent = parseInt(val).toLocaleString('ru-RU') + ' ₽';
        });

        document.getElementById('save-promo')?.addEventListener('click', () => {
            const config = {
                active: document.getElementById('promo-active').checked,
                text:   document.getElementById('promo-text').value.trim(),
            };
            localStorage.setItem('flowerart_promo_banner', JSON.stringify(config));
            this._showToast('Баннер сохранён. Обновите страницу сайта чтобы увидеть изменения.');
        });

        document.getElementById('btn-reset-catalog')?.addEventListener('click', async () => {
            if (!confirm('Сбросить каталог к заводским настройкам?')) return;
            this.products = await ProductService.reset();
            const pane = document.getElementById('pane-catalog');
            if (pane) { delete pane.dataset.rendered; this._renderCatalogTab(); pane.dataset.rendered = '1'; }
            this._showToast('Каталог сброшен');
        });

        document.getElementById('btn-reseed')?.addEventListener('click', () => {
            if (!confirm('Очистить все заказы и создать новые демо-заказы?')) return;
            OrderService.clear();
            OrderService.seedIfEmpty();
            this._showToast('Демо-заказы созданы');
            const orderPane = document.getElementById('pane-orders');
            if (orderPane) { delete orderPane.dataset.rendered; }
            this._renderDashboard();
        });
    }

    // ─── COMMAND PALETTE ─────────────────────────────────────────────────────

    _mountPalette() {
        const overlay = document.createElement('div');
        overlay.id        = 'cmd-overlay';
        overlay.className = 'cmd-overlay';
        overlay.innerHTML = `
            <div class="cmd-palette">
                <div class="cmd-search-row">
                    <span class="cmd-search-icon">🔍</span>
                    <input class="cmd-input" id="cmd-input" placeholder="Поиск команд, заказов, товаров..." autocomplete="off">
                    <span class="cmd-esc-hint">ESC</span>
                </div>
                <div class="cmd-results" id="cmd-results"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) this._closePalette(); });
    }

    _initCommandPalette() {
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
                e.preventDefault();
                this.isOpen ? this._closePalette() : this._openPalette();
            }
            if (e.key === 'Escape') this._closePalette();
        });

        document.getElementById('cmd-input')?.addEventListener('input', e => {
            this._filterAndRender(e.target.value);
        });

        document.getElementById('cmd-input')?.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.paletteIndex = Math.min(this.paletteIndex + 1, this.paletteFiltered.length - 1);
                this._highlightPaletteItem();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.paletteIndex = Math.max(this.paletteIndex - 1, 0);
                this._highlightPaletteItem();
            } else if (e.key === 'Enter') {
                const cmd = this.paletteFiltered[this.paletteIndex];
                if (cmd) this._executeCommand(cmd);
            }
        });
    }

    _openPalette() {
        this.isOpen = true;
        this.paletteIndex = 0;
        document.getElementById('cmd-overlay')?.classList.add('open');
        document.getElementById('cmd-input').value = '';
        this._filterAndRender('');
        setTimeout(() => document.getElementById('cmd-input')?.focus(), 50);
    }

    _closePalette() {
        this.isOpen = false;
        document.getElementById('cmd-overlay')?.classList.remove('open');
    }

    _buildCommands() {
        const base = [
            { label: '📊 Дашборд',             hint: 'Перейти на дашборд',        action: () => this._switchTab('dashboard') },
            { label: '📦 Заказы / Kanban',      hint: 'Управление заказами',       action: () => this._switchTab('orders') },
            { label: '🌸 Каталог товаров',      hint: 'Управление каталогом',      action: () => this._switchTab('catalog') },
            { label: '⚙ Настройки магазина',   hint: 'Настройки',                 action: () => this._switchTab('settings') },
            { label: '📈 Аналитика',            hint: 'Открыть страницу аналитики',action: () => { window.location.href = 'analitick.html'; } },
            { label: '🏪 Главная страница',     hint: 'Открыть сайт',              action: () => { window.location.href = 'index.html'; } },
            { label: '📋 Каталог магазина',     hint: 'Открыть каталог',           action: () => { window.location.href = 'catalog.html'; } },
            { label: '+ Добавить товар',        hint: 'Создать новый товар',        action: () => { this._switchTab('catalog'); setTimeout(() => this._openProductModal(), 200); } },
        ];

        const orderCmds = OrderService.getAll().slice(0, 15).map(o => ({
            label: `🧾 ${o.id} — ${o['first-name'] || ''} ${o['last-name'] || ''}`,
            hint:  `${(o.total || 0).toLocaleString('ru-RU')} ₽ · ${this._statusLabel(o.status)}`,
            action: () => { this._switchTab('orders'); setTimeout(() => this._highlightOrder(o.id), 200); },
        }));

        const productCmds = this.products.slice(0, 15).map(p => ({
            label: `🌺 ${p.name}`,
            hint:  `Редактировать товар · ${p.variations?.length || 0} вар.`,
            action: () => { this._switchTab('catalog'); setTimeout(() => this._openProductModal(p), 200); },
        }));

        return [...base, ...orderCmds, ...productCmds];
    }

    _filterAndRender(query) {
        const all    = this._buildCommands();
        const q      = query.toLowerCase().trim();
        this.paletteFiltered = q
            ? all.filter(c => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q))
            : all;
        this.paletteIndex = 0;
        this._renderPaletteResults();
    }

    _renderPaletteResults() {
        const container = document.getElementById('cmd-results');
        if (!container) return;

        if (this.paletteFiltered.length === 0) {
            container.innerHTML = `<div class="cmd-empty">Ничего не найдено</div>`;
            return;
        }

        container.innerHTML = this.paletteFiltered.map((cmd, i) => `
            <div class="cmd-item ${i === this.paletteIndex ? 'active' : ''}" data-index="${i}">
                <span class="cmd-item__label">${cmd.label}</span>
                ${cmd.hint ? `<span class="cmd-item__hint">${cmd.hint}</span>` : ''}
            </div>
        `).join('');

        container.querySelectorAll('.cmd-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.paletteIndex = parseInt(item.dataset.index);
                this._highlightPaletteItem();
            });
            item.addEventListener('click', () => {
                this._executeCommand(this.paletteFiltered[parseInt(item.dataset.index)]);
            });
        });
    }

    _highlightPaletteItem() {
        document.querySelectorAll('.cmd-item').forEach((item, i) =>
            item.classList.toggle('active', i === this.paletteIndex)
        );
        document.querySelector('.cmd-item.active')?.scrollIntoView({ block: 'nearest' });
    }

    _executeCommand(cmd) {
        this._closePalette();
        cmd.action();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    _statusLabel(status) {
        const map = {
            pending:    'Новый',
            confirmed:  'Подтверждён',
            processing: 'В обработке',
            shipped:    'Отправлен',
            delivered:  'Доставлен',
            cancelled:  'Отменён',
        };
        return map[status] || status;
    }

    _formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }

    _highlightOrder(orderId) {
        const card = document.querySelector(`.kanban-card[data-order-id="${orderId}"]`);
        if (!card) return;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('kanban-card--highlight');
        setTimeout(() => card.classList.remove('kanban-card--highlight'), 2000);
    }

    _showToast(message, type = 'success') {
        const existing = document.querySelector('.admin-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `admin-toast admin-toast--${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('admin-toast--visible'));
        setTimeout(() => {
            toast.classList.remove('admin-toast--visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    destroy() {
        this._stopAutoProgress();
        document.getElementById('product-modal-overlay')?.remove();
        document.getElementById('cmd-overlay')?.remove();
    }
}

export default AdminPage;
