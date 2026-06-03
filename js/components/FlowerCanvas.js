export class FlowerCanvas {
    constructor(canvasId, baseId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.base = document.getElementById(baseId);
        this.container = document.getElementById(containerId);
        this.placedFlowers = [];
        this.selectedFlower = null;
        this.baseSize = 'medium';
    }

    setBaseSize(size) {
        this.baseSize = size;
        this.base.className = `wreath-base ${size}`;
    }

    setSelectedFlower(flower) {
        this.selectedFlower = flower;
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Drop zone
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const flowerData = e.dataTransfer.getData('flower');
            if (!flowerData) return;

            const flower = JSON.parse(flowerData);
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.placeFlower(flower, x, y);
        });

        // Click to place
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas || e.target === this.base || e.target === this.container) {
                if (!this.selectedFlower) {
                    alert('Сначала выбери цветок из списка!');
                    return;
                }

                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                this.placeFlower(this.selectedFlower, x, y);
            }
        });

        // Clear button
        document.getElementById('clear-wreath')?.addEventListener('click', () => {
            this.clear();
        });
    }

    placeFlower(flower, x, y) {
        const flowerEl = document.createElement('div');
        flowerEl.className = 'placed-flower';
        flowerEl.style.left = `${x - 35}px`;
        flowerEl.style.top = `${y - 35}px`;
        flowerEl.draggable = true;
        flowerEl.dataset.id = flower.id;

        flowerEl.innerHTML = `<img src="${flower.image}" alt="${flower.name}" onerror="this.parentElement.remove()">`;

        // Make placed flower draggable for repositioning
        this.makeFlowerDraggable(flowerEl, flower);

        // Delete on double click
        flowerEl.addEventListener('dblclick', () => {
            if (confirm('Удалить этот цветок?')) {
                flowerEl.remove();
                this.placedFlowers = this.placedFlowers.filter(f => f.el !== flowerEl);
                this.updateSummary();
            }
        });

        this.container.appendChild(flowerEl);
        this.placedFlowers.push({ ...flower, x, y, el: flowerEl });
        this.updateSummary();
    }

    makeFlowerDraggable(flowerEl, flower) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        flowerEl.addEventListener('dragstart', (e) => {
            isDragging = true;
            e.dataTransfer.effectAllowed = 'move';
        });

        flowerEl.addEventListener('drag', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            flowerEl.style.left = `${x - 35}px`;
            flowerEl.style.top = `${y - 35}px`;
        });

        flowerEl.addEventListener('dragend', (e) => {
            isDragging = false;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update position in array
            const placedFlower = this.placedFlowers.find(f => f.el === flowerEl);
            if (placedFlower) {
                placedFlower.x = x;
                placedFlower.y = y;
            }
        });
    }

    updateSummary() {
        const countEl = document.getElementById('summary-flowers-count');
        const priceEl = document.getElementById('total-price');
        const listEl = document.getElementById('flowers-in-wreath');
        const baseEl = document.getElementById('summary-base');
        const cartBtn = document.getElementById('add-to-cart');

        const flowersTotal = this.placedFlowers.reduce((sum, f) => sum + f.price, 0);
        const basePrice = document.querySelector('.base-option.active')?.dataset.price || 0;
        const total = parseInt(basePrice) + flowersTotal;

        if (countEl) countEl.textContent = `${this.placedFlowers.length} шт`;
        if (priceEl) priceEl.textContent = `${total} ₽`;
        
        if (listEl) {
            if (this.placedFlowers.length === 0) {
                listEl.innerHTML = '<p style="color:#999;font-size:0.9rem;">Нет цветов</p>';
            } else {
                listEl.innerHTML = this.placedFlowers.map(f => `
                    <div class="flower-in-summary">
                        <span>${f.name}</span>
                        <span>${f.price} ₽</span>
                    </div>
                `).join('');
            }
        }

        const selectedBase = document.querySelector('.base-option.active');
        if (baseEl && selectedBase) {
            baseEl.textContent = selectedBase.querySelector('span')?.textContent || 'Выбрана';
        }

        if (cartBtn) {
            cartBtn.disabled = this.placedFlowers.length === 0 || !selectedBase;
        }
    }

    clear() {
        this.container.innerHTML = '';
        this.placedFlowers = [];
        this.updateSummary();
    }

    getPlacedFlowers() {
        return this.placedFlowers.map(({ id, name, price, x, y, image }) => ({ 
            id, name, price, x, y, image 
        }));
    }

    getTotalPrice() {
        const basePrice = parseInt(document.querySelector('.base-option.active')?.dataset.price || 0);
        const flowersTotal = this.placedFlowers.reduce((sum, f) => sum + f.price, 0);
        return basePrice + flowersTotal;
    }
}