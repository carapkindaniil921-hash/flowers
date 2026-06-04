export class CatalogPage {
    constructor() {
        this.elements = {};
        this.products = [];
        this.filteredProducts = [];
        
        this.filters = {
            categories: [],
            priceRange: [0, 100],
            colors: [],
            sort: 'popular'
        };
    }

    init() {
        console.log('CatalogPage initialized');
        this.cacheElements();
        this.loadProducts();
    }

    cacheElements() {
        this.elements = {
            productsGrid: document.getElementById('products-grid'),
            productsCount: document.getElementById('products-count'),
            categoryCheckboxes: document.querySelectorAll('input[name="category"]'),
            priceRange: document.querySelector('.price-range'),
            priceValues: document.querySelectorAll('.price-values span'),
            colorDots: document.querySelectorAll('.color-filters .color-dot'),
            sortSelect: document.querySelector('.sort-select')
        };
    }

    async loadProducts() {
        try {
            const { ProductService } = await import('../services/ProductService.js');
            this.products = await ProductService.getAll();
            this.filteredProducts = [...this.products];
            this.renderProducts(this.filteredProducts);
            this.initFilters();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    initFilters() {
      
        this.elements.categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateCategoryFilters();
                this.applyFilters();
            });
        });

      
        if (this.elements.priceRange) {
            this.elements.priceRange.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.filters.priceRange[1] = value;
                
            
                if (this.elements.priceValues[1]) {
                    this.elements.priceValues[1].textContent = `${value} ₽`;
                }
                
                this.applyFilters();
            });
        }

        
        this.elements.colorDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                e.target.classList.toggle('active');
                
                if (this.filters.colors.includes(color)) {
                    this.filters.colors = this.filters.colors.filter(c => c !== color);
                } else {
                    this.filters.colors.push(color);
                }
                
                this.applyFilters();
            });
        });

       
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }
    }

    updateCategoryFilters() {
        this.filters.categories = Array.from(this.elements.categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    applyFilters() {
        let result = [...this.products];

        
        if (this.filters.categories.length > 0) {
            result = result.filter(product => 
                this.filters.categories.includes(product.category)
            );
        }

        result = result.filter(product => {
            if (!product.variations || product.variations.length === 0) return false;
            const minPrice = Math.min(...product.variations.map(v => v.price));
            return minPrice <= this.filters.priceRange[1];
        });

  
        if (this.filters.colors.length > 0) {
            result = result.filter(product => {
                if (!product.variations) return false;
                return product.variations.some(variation => 
                    this.filters.colors.includes(variation.color)
                );
            });
        }

     
        result = this.applySorting(result);

        this.filteredProducts = result;
        this.renderProducts(this.filteredProducts);
    }

    applySorting(products) {
        const sorted = [...products];

        switch (this.filters.sort) {
            case 'price-asc':
                sorted.sort((a, b) => {
                    const priceA = a.variations?.[0]?.price || 0;
                    const priceB = b.variations?.[0]?.price || 0;
                    return priceA - priceB;
                });
                break;

            case 'price-desc':
                sorted.sort((a, b) => {
                    const priceA = a.variations?.[0]?.price || 0;
                    const priceB = b.variations?.[0]?.price || 0;
                    return priceB - priceA;
                });
                break;

            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;

            case 'popular':
            default:
                sorted.sort((a, b) => a.id - b.id);
                break;
        }

        return sorted;
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
            if (this.elements.productsCount) {
                this.elements.productsCount.textContent = '0';
            }
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

                const product = this.filteredProducts[productIndex];
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

                const product = this.filteredProducts[productIndex];
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
                        colorHex: selectedVariation.hex,
                        quantity: 1
                    });
                }

                if (window.appState) {
                    window.appState.set('cart', cart);
                }

                document.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart } }));
                this._showToast(`${product.name} добавлен в корзину`);
            });
        });
    }

    _showToast(message) {
        const existing = document.querySelector('.cart-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('cart-toast--visible'));

        setTimeout(() => {
            toast.classList.remove('cart-toast--visible');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    destroy() {
       
    }
}