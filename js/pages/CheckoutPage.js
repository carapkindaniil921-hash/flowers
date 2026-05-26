// pages/CheckoutPage.js
export class CheckoutPage {
    constructor() {
        this.elements = {};
        this.orderItems = [];
    }

    init() {
        this.cacheElements();
        this.loadOrderItems();
        this.initForm();
    }

    cacheElements() {
        this.elements = {
            orderItems: document.getElementById('order-items'),
            subtotal: document.getElementById('subtotal'),
            shipping: document.getElementById('shipping'),
            total: document.getElementById('total'),
            form: document.querySelector('.checkout-form'),
            placeOrderBtn: document.querySelector('.btn-place-order')
        };
    }

    loadOrderItems() {
        const cart = window.appState.get('cart') || [];
        this.orderItems = cart;
        this.renderOrderItems();
    }

    renderOrderItems() {
        if (!this.elements.orderItems) return;

        if (this.orderItems.length === 0) {
            this.elements.orderItems.innerHTML = '<p>Корзина пуста</p>';
            if (this.elements.placeOrderBtn) {
                this.elements.placeOrderBtn.disabled = true;
            }
            return;
        }

        this.elements.orderItems.innerHTML = this.orderItems.map(item => `
            <div class="order-item">
                <span>${item.name || 'Товар #' + item.id}</span>
                <span>${item.quantity} x ${item.price?.toLocaleString() || 0} ₽</span>
            </div>
        `).join('');

        this.calculateTotals();
    }

    calculateTotals() {
        const subtotal = this.orderItems.reduce((sum, item) => {
            return sum + (item.price || 0) * (item.quantity || 1);
        }, 0);

        const shipping = subtotal > 5000 ? 0 : 500;
        const total = subtotal + shipping;

        if (this.elements.subtotal) {
            this.elements.subtotal.textContent = `${subtotal.toLocaleString()} ₽`;
        }
        if (this.elements.shipping) {
            this.elements.shipping.textContent = shipping === 0 ? 'Бесплатно' : `${shipping} ₽`;
        }
        if (this.elements.total) {
            this.elements.total.textContent = `${total.toLocaleString()} ₽`;
        }
    }

    initForm() {
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitOrder();
            });
        }
    }

    submitOrder() {
        const formData = new FormData(this.elements.form);
        const orderData = Object.fromEntries(formData);

        const order = {
            ...orderData,
            items: this.orderItems,
            date: new Date().toISOString(),
            status: 'pending'
        };

        
        console.log('Заказ:', order);
        
        
        window.appState.set('cart', []);
        
        
        alert('Заказ успешно оформлен!');
        
       
        window.location.href = 'index.html';
    }

    destroy() {
        
    }
}