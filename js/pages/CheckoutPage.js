// pages/CheckoutPage.js
import { OrderService } from '../services/OrderService.js';

export class CheckoutPage {
    constructor() {
        this.elements   = {};
        this.orderItems = [];
    }

    init() {
        this.cacheElements();
        this.loadOrderItems();
        this.bindSubmit();
    }

    // ─── Setup ───────────────────────────────────────────────────────────────

    cacheElements() {
        this.elements = {
            orderItems:    document.getElementById('order-items'),
            subtotal:      document.getElementById('subtotal'),
            shipping:      document.getElementById('shipping'),
            total:         document.getElementById('total'),
            placeOrderBtn: document.querySelector('.btn-place-order'),
        };
    }

    loadOrderItems() {
        this.orderItems = window.appState?.get('cart') || [];
        this.renderOrderItems();
    }

    // ─── Render order summary ─────────────────────────────────────────────────

    renderOrderItems() {
        if (!this.elements.orderItems) return;

        if (this.orderItems.length === 0) {
            this.elements.orderItems.innerHTML = '<p class="cart-empty__text">Корзина пуста</p>';
            if (this.elements.placeOrderBtn) {
                this.elements.placeOrderBtn.disabled = true;
                this.elements.placeOrderBtn.style.opacity = '0.5';
            }
            return;
        }

        this.elements.orderItems.innerHTML = this.orderItems.map(item => `
            <div class="order-item">
                <span class="order-item__name">${item.name || 'Товар #' + item.id}</span>
                <span class="order-item__qty-price">
                    ${item.quantity} × ${(item.price || 0).toLocaleString('ru-RU')} ₽
                </span>
            </div>
        `).join('');

        this.calculateTotals();
    }

    calculateTotals() {
        const threshold = parseInt(localStorage.getItem('flowerart_delivery_threshold') || '5000');
        const subtotal  = this.orderItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
        );
        const shipping = subtotal > threshold ? 0 : 500;
        const total    = subtotal + shipping;

        if (this.elements.subtotal) {
            this.elements.subtotal.textContent = `${subtotal.toLocaleString('ru-RU')} ₽`;
        }
        if (this.elements.shipping) {
            this.elements.shipping.textContent = shipping === 0
                ? 'Бесплатно'
                : `${shipping.toLocaleString('ru-RU')} ₽`;
        }
        if (this.elements.total) {
            this.elements.total.textContent = `${total.toLocaleString('ru-RU')} ₽`;
        }

        this._cache = { subtotal, shipping, total };
    }

    // ─── Form binding ─────────────────────────────────────────────────────────

    bindSubmit() {
        // Кнопка находится вне <form>, поэтому биндим click напрямую
        this.elements.placeOrderBtn?.addEventListener('click', () => this.submitOrder());
    }

    // ─── Submit & save ────────────────────────────────────────────────────────

    submitOrder() {
        if (this.orderItems.length === 0) return;

        if (!this._validateForm()) return;

        const get = id => document.getElementById(id)?.value?.trim() || '';
        const getRadio = name =>
            document.querySelector(`input[name="${name}"]:checked`)?.value || '';

        const subtotal = this._cache?.subtotal ?? 0;
        const shipping = this._cache?.shipping ?? 500;
        const total    = this._cache?.total    ?? subtotal + shipping;

        const orderData = {
            'first-name': get('first-name'),
            'last-name':  get('last-name'),
            email:        get('email'),
            phone:        get('phone'),
            city:         get('city'),
            address:      get('address'),
            'postal-code': get('postal-code'),
            payment:      getRadio('payment'),
            items:        this.orderItems,
            subtotal,
            shipping,
            total,
        };

        const savedOrder = OrderService.save(orderData);
        console.log('Заказ сохранён:', savedOrder);

        window.appState?.set('cart', []);

        this._showSuccess(savedOrder.id);
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    _validateForm() {
        const required = ['email', 'phone', 'city', 'address', 'first-name', 'last-name'];
        let firstInvalid = null;

        required.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (!el.value.trim()) {
                el.classList.add('input-error');
                if (!firstInvalid) firstInvalid = el;
            } else {
                el.classList.remove('input-error');
            }
        });

        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalid.focus();
            return false;
        }
        return true;
    }

    // ─── Success screen ───────────────────────────────────────────────────────

    _showSuccess(orderId) {
        const main = document.querySelector('main');
        if (!main) return;

        main.innerHTML = `
            <div class="order-success">
                <div class="order-success__icon">✅</div>
                <h2 class="order-success__title">Заказ оформлен!</h2>
                <p class="order-success__id">Номер заказа: <strong>${orderId}</strong></p>
                <p class="order-success__text">
                    Мы свяжемся с вами для подтверждения в ближайшее время.
                </p>
                <div class="order-success__actions">
                    <a href="index.html" class="btn btn-primary">На главную</a>
                    <a href="catalog.html" class="btn btn-secondary">Продолжить покупки</a>
                </div>
            </div>
        `;
    }

    destroy() {}
}
