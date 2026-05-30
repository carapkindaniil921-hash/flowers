// pages/CatalogPage.js

export class CatalogPage {
    constructor() {
        this.elements = {};
        this.products = [];
    }

    init() {
        console.log('CatalogPage initialized');
        this.cacheElements();
        this.loadProducts();
    }

    cacheElements() {
        this.elements = {
            productsGrid: document.getElementById('products-grid'),
            productsCount: document.getElementById('products-count')
        };
    }

    async loadProducts() {
        try {
            const { flowers } = await import('../data/flowers.js');
            this.products = flowers;
            this.renderProducts(this.products);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

  
    getCategoryName(cat) {
        const map = {
            'rose': 'Роза',
            'carnations': 'Гвоздика',
            'chrysanthemums': 'Хризантема',
            'dahlias': 'Георгин',
            'gerberas': 'Гербера',
            'peonies': 'Пион',
            'chamomiles': 'Ромашка',
            'orchids': 'Орхидея',
            'tulips': 'Тюльпан',
            'sunflowers': 'Подсолнух'
        };
        return map[cat] || cat;
    }
    getMaterial(desc) {
        if (!desc) return 'Ткань';
        if (desc.includes('атлас')) return 'Атлас';
        if (desc.includes('шелк')) return 'Шелк';
        if (desc.includes('латекс')) return 'Латекс';
        return 'Ткань';
    }

    getSize(cat) {
        const sizes = {
            'roses': '13 см',
            'carnations': '10,5 см',
            'chrysanthemums': '15 см',
            'dahlias': '13 см',
            'gerberas': '11 см',
            'peonies': '14 см',
            'chamomiles': '8 см',
            'orchids': '20 см',
            'tulips': '10 см',
            'sunflowers': '18 см'
        };
        return sizes[cat] || '12 см';
    }

    getColorHex(colorName) {
        const colors = {
            'red': '#dc2626',
            'pink': '#ec4899',
            'white': '#f3f4f6',
            'yellow': '#fbbf24',
            'blue': '#3b82f6',
            'purple': '#a855f7',
            'orange': '#f97316',
            'green': '#22c55e',
            'black': '#1f2937',
            'cream': '#fef3c7',
            'burgundy': '#7f1d1d'
        };
        return colors[colorName] || '#ccc';
    }

    renderProducts(products) {
        if (!this.elements.productsGrid) {
            console.error('products-grid not found!');
            return;
        }

        if (products.length === 0) {
            this.elements.productsGrid.innerHTML = '<p class="no-products">Товары не найдены</p>';
            return;
        }

        this.elements.productsGrid.innerHTML = products.map((product, productIndex) => {
            if (!product.variations || product.variations.length === 0) {
                product.variations = [{
                    color: product.color || 'default',
                    hex: this.getColorHex(product.color) || '#ccc',
                    price: product.price || 0,
                    image: product.image || 'images/placeholder.jpg'
                }];
            }

            const defaultVariation = product.variations[0];

          
            const colorsHtml = product.variations.map((variation, varIndex) => `
                <div class="color-dot" 
                     style="background: ${variation.hex}; ${variation.color === 'white' ? 'border: 1px solid #ccc;' : ''}" 
                     title="${variation.color}"
                     data-product-index="${productIndex}" 
                     data-variation-index="${varIndex}">
                </div>
            `).join('');

            const material = this.getMaterial(product.description);
            const categoryRu = this.getCategoryName(product.category);
            const size = this.getSize(product.category);

            return `
                <div class="product-card" data-id="${product.id}" data-product-index="${productIndex}">
                    <div class="product-image">
                        <img src="${defaultVariation.image}" alt="${product.name}" 
                             class="product-img"
                             onerror="this.onerror=null; this.src='images/placeholder.jpg'">
                        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    </div>
                    
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        
                        <div class="product-specs">
                            <span>Материал: ${material}</span>
                            <span>Тип: ${categoryRu}</span>
                            <span>Размер: ${size}</span>
                        </div>
                        
                        <div class="product-colors">
                            ${colorsHtml}
                        </div>
                    </div>
                    
                    <div class="product-actions">
                        <div class="product-price">
                            <span class="price-value">${defaultVariation.price}</span> <span>руб</span>
                        </div>
                        <div class="price-label">Цена за единицу</div>
                        <button class="btn-add-to-cart" 
                                data-product-id="${product.id}"
                                data-product-index="${productIndex}"
                                data-variation-index="0">
                            В корзину
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    
        if (this.elements.productsCount) {
            this.elements.productsCount.textContent = products.length;
        }

        this.initInteractions();
    }

    initInteractions() {
        const colorDots = document.querySelectorAll('.color-dot');
        colorDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const productIndex = e.target.dataset.productIndex;
                const variationIndex = e.target.dataset.variationIndex;
                
                const product = this.products[productIndex];
                const selectedVariation = product.variations[variationIndex];
                const card = e.target.closest('.product-card');

             
                const img = card.querySelector('.product-img');
                if (img) img.src = selectedVariation.image;

                
                const priceEl = card.querySelector('.price-value');
                if (priceEl) priceEl.textContent = selectedVariation.price;

                
                const btn = card.querySelector('.btn-add-to-cart');
                if (btn) {
                    btn.dataset.variationIndex = variationIndex;
                }

                card.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        
        const buttons = document.querySelectorAll('.btn-add-to-cart');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productIndex = e.target.dataset.productIndex;
                const variationIndex = e.target.dataset.variationIndex;
                
                const product = this.products[productIndex];
                const selectedVariation = product.variations[variationIndex];

                const cart = window.appState?.get('cart') || [];
                
                
                const existingItem = cart.find(item => 
                    item.originalId === product.id && item.color === selectedVariation.color
                );

                if (existingItem) {
                    existingItem.quantity = (existingItem.quantity || 1) + 1;
                } else {
                    cart.push({
                        id: Date.now(),
                        originalId: product.id,
                        name: `${product.name} (${selectedVariation.color})`,
                        price: selectedVariation.price,
                        image: selectedVariation.image,
                        color: selectedVariation.color,
                        quantity: 1
                    });
                }

                if (window.appState) {
                    window.appState.set('cart', cart);
                }

                
                const headerEvent = new CustomEvent('cart-updated', { detail: { cart } });
                document.dispatchEvent(headerEvent);

                alert(`${product.name} (${selectedVariation.color}) добавлен в корзину!`);
            });
        });
    }

    destroy() {
    
    }
}