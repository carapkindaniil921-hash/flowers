// pages/CatalogPage.js

export class CatalogPage {
    constructor() {
        this.elements = {};
        this.products = [];
        this.filteredProducts = [];
    }

    init() {
        console.log('CatalogPage initialized');
        this.cacheElements();
        this.loadProducts();
        this.initFilters();
        this.initSort();
    }

    cacheElements() {
        this.elements = {
            productsGrid: document.getElementById('products-grid'),
            productsCount: document.getElementById('products-count'),
            priceRange: document.getElementById('price-range'),
            priceValue: document.getElementById('price-value'),
            sortSelect: document.getElementById('sort-select')
        };
        
        console.log('Elements cached:', this.elements);
    }

    async loadProducts() {
        console.log('Loading products...');
        try {
            const { flowers } = await import('../data/flowers.js');
            console.log('Products loaded:', flowers);
            
            this.products = flowers;
            this.filteredProducts = flowers;
            this.renderProducts(this.products);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }

    renderProducts(products) {
        console.log('Rendering products:', products);
        
        if (!this.elements.productsGrid) {
            console.error('products-grid element not found!');
            return;
        }

        if (products.length === 0) {
            this.elements.productsGrid.innerHTML = '<p class="no-products">Товары не найдены</p>';
            return;
        }

        this.elements.productsGrid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}" data-price="${product.price}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.onerror=null; this.src='images/placeholder.jpg'; console.error('Failed to load:', '${product.image}')">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">
                        <span class="current-price">${product.price} руб</span>
                    </div>
                    <button class="btn btn-add-to-cart" data-id="${product.id}">В корзину</button>
                </div>
            </div>
        `).join('');

        if (this.elements.productsCount) {
            this.elements.productsCount.textContent = products.length;
        }

    
        this.elements.productsGrid.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                console.log('Add to cart:', id);
                this.addToCart(id);
            });
        });

        console.log('Products rendered successfully');
    }

    initFilters() {
    
        if (this.elements.priceRange) {
            this.elements.priceRange.addEventListener('input', (e) => {
                if (this.elements.priceValue) {
                    this.elements.priceValue.textContent = `${e.target.value} ₽`;
                }
                this.applyFilters();
            });
        }
    }

    initSort() {
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', () => {
                this.applySort();
            });
        }
    }

    applyFilters() {
        this.filteredProducts = this.products;
        this.renderProducts(this.filteredProducts);
    }

    applySort() {
        this.renderProducts(this.filteredProducts);
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            const cart = window.appState?.get('cart') || [];
            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            if (window.appState) {
                window.appState.set('cart', cart);
            }

            console.log('Added to cart:', product);
            alert(`${product.name} добавлен в корзину!`);
        }
    }

    destroy() {
        
    }
}