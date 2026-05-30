// pages/HomePage.js
export class HomePage {
    constructor() {
        this.elements = {};
        this.products = [];
    }

    init() {
        this.cacheElements();
        this.loadPopularProducts();
        this.initHeroSlider();
    }

    cacheElements() {
        this.elements = {
            popularProducts: document.querySelector('#popular-products, .products-grid'),
            hero: document.querySelector('.hero')
        };
    }

    async loadPopularProducts() {
        if (!this.elements.popularProducts) return;

        try {
            const { ProductService } = await import('../services/ProductService.js');
            this.products = await ProductService.getAll();
            this.renderPopularProducts(this.products.slice(0, 4));
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            this.elements.popularProducts.innerHTML = '<p>Ошибка загрузки товаров</p>';
        }
    }

    renderPopularProducts(products) {
        if (!this.elements.popularProducts) return;

        this.elements.popularProducts.innerHTML = products.map(product => {
            const variation = product.variations[0];
            return `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-image">
                        <img src="${variation.image || '../images/placeholder.jpg'}" alt="${product.name}"
                             onerror="this.onerror=null; this.src='../images/placeholder.jpg'">
                        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description || ''}</p>
                        <div class="product-price">
                            <span class="current-price">${variation.price.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <button class="btn-add-to-cart" data-id="${product.id}">В корзину</button>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.popularProducts.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.addToCart(id);
            });
        });
    }

    initHeroSlider() {
        
        const hero = this.elements.hero;
        if (hero) {
            
        }
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const variation = product.variations[0];
        const cart = window.appState.get('cart');
        const existingItem = cart.find(
            item => item.originalId === productId && item.color === variation.color
        );

        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({
                id: Date.now(),
                originalId: productId,
                name: `${product.name} (${variation.color})`,
                price: variation.price,
                image: variation.image,
                color: variation.color,
                colorHex: variation.hex,
                quantity: 1
            });
        }

        window.appState.set('cart', cart);
        document.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart } }));
        this.showNotification('Товар добавлен в корзину');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4b5563;
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.375rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    destroy() {
        
    }
}