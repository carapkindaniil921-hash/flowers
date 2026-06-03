// components/ShoppingCart.js
export class ShoppingCart {
    constructor() {
        this.isOpen = false;
        this._unsubscribe = null;
        this.el = {};
    }

    init() {
        this._mount();
        this._cacheElements();
        this._subscribeToState();
        this._bindEvents();
        this._updateBadge(window.appState?.get('cart') || []);
    }

    // ─── DOM mounting ────────────────────────────────────────────────────────

    _mount() {
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.className = 'cart-overlay';

        const drawer = document.createElement('aside');
        drawer.id = 'cart-drawer';
        drawer.className = 'cart-drawer';
        drawer.setAttribute('aria-label', 'Корзина товаров');
        drawer.innerHTML = `
            <div class="cart-drawer__header">
                <h2 class="cart-drawer__title">Корзина</h2>
                <button class="cart-drawer__close" id="cart-close" aria-label="Закрыть корзину">✕</button>
            </div>
            <div class="cart-drawer__items" id="cart-items"></div>
            <div class="cart-drawer__footer" id="cart-footer"></div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
    }

    _cacheElements() {
        this.el = {
            drawer:   document.getElementById('cart-drawer'),
            overlay:  document.getElementById('cart-overlay'),
            close:    document.getElementById('cart-close'),
            items:    document.getElementById('cart-items'),
            footer:   document.getElementById('cart-footer'),
            cartIcon: document.getElementById('cart-icon'),
        };
    }

    // ─── State & persistence ─────────────────────────────────────────────────

    _subscribeToState() {
        this._unsubscribe = window.appState?.subscribe((state) => {
            const cart = state.cart || [];
            localStorage.setItem('flowerart_cart', JSON.stringify(cart));
            this._updateBadge(cart);
        });
    }

    _getCart() {
        return window.appState?.get('cart') || [];
    }

    _saveCart(cart) {
        window.appState?.set('cart', cart);
    }

    _updateBadge(cart) {
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = count;
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    _bindEvents() {
        this.el.close?.addEventListener('click', () => this.close());
        this.el.overlay?.addEventListener('click', () => this.close());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        this.el.cartIcon?.addEventListener('click', () => this.open());

        document.addEventListener('cart-updated', () => {
            this._animateCartIcon();
            if (this.isOpen) {
                this._renderItems();
                this._renderFooter();
            }
        });
    }

    // ─── Open / Close ────────────────────────────────────────────────────────

    open() {
        this.isOpen = true;
        this._renderItems();
        this._renderFooter();
        this.el.drawer?.classList.add('open');
        this.el.overlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        this.el.drawer?.classList.remove('open');
        this.el.overlay?.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ─── Render: items ───────────────────────────────────────────────────────

    _renderItems() {
        const cart = this._getCart();
        if (!this.el.items) return;

        if (cart.length === 0) {
            this.el.items.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty__icon">🛒</div>
                    <p class="cart-empty__text">Ваша корзина пуста</p>
                    <a href="catalog.html" class="btn btn-primary btn-cart-catalog" id="btn-to-catalog">
                        Перейти в каталог
                    </a>
                </div>
            `;
            document.getElementById('btn-to-catalog')?.addEventListener('click', () => this.close());
            return;
        }

        this.el.items.innerHTML = cart.map(item => {
            const isWhite = item.colorHex === '#ffffff' || item.colorHex === '#f3f4f6';
            const colorDotStyle = item.colorHex
                ? `background:${item.colorHex};${isWhite ? 'border:1px solid #ccc;' : ''}`
                : '';
            const lineTotal = ((item.price || 0) * (item.quantity || 1)).toLocaleString('ru-RU');

            return `
                <div class="cart-item" data-id="${item.id}">
                    <img
                        class="cart-item__img"
                        src="${item.image || ''}"
                        alt="${item.name || 'Товар'}"
                        onerror="this.onerror=null; this.src='../images/placeholder.jpg'"
                    >
                    <div class="cart-item__info">
                        <span class="cart-item__name">${item.name || 'Товар'}</span>
                        ${colorDotStyle ? `
                        <span class="cart-item__color">
                            <span class="cart-item__color-dot" style="${colorDotStyle}"></span>
                        </span>` : ''}
                        <div class="cart-item__qty-row">
                            <button class="cart-qty-btn" data-action="decrease" data-id="${item.id}">−</button>
                            <span class="cart-item__qty">${item.quantity || 1}</span>
                            <button class="cart-qty-btn" data-action="increase" data-id="${item.id}">+</button>
                            <span class="cart-item__price">${lineTotal} ₽</span>
                        </div>
                    </div>
                    <button class="cart-item__remove" data-id="${item.id}" aria-label="Удалить товар">✕</button>
                </div>
            `;
        }).join('');

        this.el.items.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._changeQty(
                    parseInt(e.currentTarget.dataset.id),
                    e.currentTarget.dataset.action
                );
            });
        });

        this.el.items.querySelectorAll('.cart-item__remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._removeItem(parseInt(e.currentTarget.dataset.id));
            });
        });
    }

    // ─── Render: footer totals ───────────────────────────────────────────────

    _renderFooter() {
        const cart = this._getCart();
        if (!this.el.footer) return;

        if (cart.length === 0) {
            this.el.footer.innerHTML = '';
            return;
        }

        const threshold = parseInt(localStorage.getItem('flowerart_delivery_threshold') || '5000');
        const subtotal  = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
        const shipping  = subtotal >= threshold ? 0 : 500;
        const total    = subtotal + shipping;

        this.el.footer.innerHTML = `
            <div class="cart-totals">
                <div class="cart-totals__row">
                    <span>Подытог</span>
                    <span>${subtotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div class="cart-totals__row">
                    <span>Доставка</span>
                    <span class="${shipping === 0 ? 'cart-totals__free' : ''}">
                        ${shipping === 0 ? 'Бесплатно' : shipping + ' ₽'}
                    </span>
                </div>
                ${shipping > 0 ? `<p class="cart-totals__hint">Бесплатная доставка от ${threshold.toLocaleString('ru-RU')} ₽</p>` : ''}
                <div class="cart-totals__row cart-totals__total">
                    <span>Итого</span>
                    <span>${total.toLocaleString('ru-RU')} ₽</span>
                </div>
            </div>
            <div class="cart-actions">
                <button class="btn btn-primary btn-large" id="btn-to-checkout">Оформить заказ</button>
                <button class="btn btn-secondary cart-btn-clear" id="btn-clear-cart">Очистить корзину</button>
            </div>
        `;

        document.getElementById('btn-to-checkout')?.addEventListener('click', () => {
            this.close();
            window.location.href = 'checkout.html';
        });

        document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
            this._clearCart();
        });
    }

    // ─── Cart mutations ──────────────────────────────────────────────────────

    _changeQty(id, action) {
        const cart = this._getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;

        if (action === 'increase') {
            item.quantity = (item.quantity || 1) + 1;
        } else {
            item.quantity = (item.quantity || 1) - 1;
            if (item.quantity <= 0) {
                this._removeItem(id);
                return;
            }
        }

        this._saveCart(cart);
        this._renderItems();
        this._renderFooter();
    }

    _removeItem(id) {
        this._saveCart(this._getCart().filter(i => i.id !== id));
        this._renderItems();
        this._renderFooter();
    }

    _clearCart() {
        this._saveCart([]);
        this._renderItems();
        this._renderFooter();
    }

    // ─── Animations ──────────────────────────────────────────────────────────

    _animateCartIcon() {
        const icon = document.getElementById('cart-icon');
        if (!icon) return;
        icon.classList.remove('cart-bounce');
        void icon.offsetWidth;
        icon.classList.add('cart-bounce');
        setTimeout(() => icon.classList.remove('cart-bounce'), 600);
    }

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    destroy() {
        this._unsubscribe?.();
        this.el.drawer?.remove();
        this.el.overlay?.remove();
    }
}

export default ShoppingCart;
