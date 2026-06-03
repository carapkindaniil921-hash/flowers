import { BasePage } from './BasePage.js';
import { constructorFlowers } from '../data/constructorFlowers.js';

export class ConstructorPage extends BasePage {
    constructor() {
        super();
        this.placedFlowers = [];
        this.selectedFlower = null;
        this.isDragging = false; // Флаг защиты от случайной постановки после драга
    }

    init() {
        super.init();
        
        setTimeout(() => {
            this.cacheElements();
            this.renderFlowerSelect();
            this.bindEvents();
            this.loadDraft();
            this.updateSummary();
            
            // АВТО-ВЫБОР ПЕРВОГО ЦВЕТКА ПРИ ЗАГРУЗКЕ
            const firstCard = document.querySelector('.flower-card');
            if (firstCard) firstCard.click();
            
        }, 100);
    }

    renderFlowerSelect() {
        const container = document.getElementById('flower-select-container');
        if (!container) return;

        const flowersHTML = constructorFlowers.map(flower => `
            <div class="flower-card" data-id="${flower.id}" 
                 data-name="${flower.name}" 
                 data-price="${flower.price}" 
                 data-image="${flower.image}">
                <img src="${flower.image}" alt="${flower.name}">
                <div class="name">${flower.name}</div>
                <div class="price">${flower.price} ₽</div>
            </div>
        `).join('');

        container.innerHTML = `<div class="flowers-grid">${flowersHTML}</div>`;

        const cards = container.querySelectorAll('.flower-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                this.selectedFlower = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    price: parseInt(card.dataset.price),
                    image: card.dataset.image
                };
            });
        });
    }

    cacheElements() {
        this.canvas = document.getElementById('wreath-canvas');
        this.flowersContainer = document.getElementById('wreath-flowers');
        this.wreathBase = document.getElementById('wreath-base');
        this.baseOptions = document.querySelectorAll('.base-option');
        this.summary = {
            base: document.getElementById('summary-base'),
            count: document.getElementById('summary-flowers-count'),
            list: document.getElementById('flowers-in-wreath'),
            total: document.getElementById('total-price'),
            cartBtn: document.getElementById('add-to-cart'),
            clearBtn: document.getElementById('clear-wreath')
        };
    }

    bindEvents() {
        // 1. Выбор основы
        this.baseOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                this.baseOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                
                const sizeClass = opt.dataset.base;
                
                if (this.wreathBase) {
                    const imagePath = `../images/wreaths/base-${sizeClass}.jpg`;
                    this.wreathBase.style.cssText = ''; 
                    this.wreathBase.className = `wreath-base ${sizeClass}`;
                    
                    this.wreathBase.style.backgroundImage = `url('${imagePath}')`;
                    this.wreathBase.style.backgroundSize = 'cover';
                    this.wreathBase.style.backgroundRepeat = 'no-repeat';
                    this.wreathBase.style.backgroundPosition = 'center';
                    this.wreathBase.style.width = '100%';
                    this.wreathBase.style.height = '100%';
                }
                
                this.updateSummary();
                this.saveDraft();
            });
        });

        // 2. Клик по холсту (Постановка цветка)
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => {
                // Если мы только что перетащили цветок - игнорируем клик
                if (this.isDragging) {
                    this.isDragging = false;
                    return; 
                }

                // Не ставим новый цветок, если кликнули по существующему
                if (e.target.closest('.placed-flower')) return;
                
                if (!this.selectedFlower) return;

                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                this.placeFlower(this.selectedFlower, x, y);
            });
        }

        // 3. Очистить венок
        if (this.summary.clearBtn) {
            this.summary.clearBtn.addEventListener('click', () => {
                if (this.placedFlowers.length === 0) return;
                if (confirm('Очистить венок?')) {
                    if (this.flowersContainer) this.flowersContainer.innerHTML = '';
                    this.placedFlowers = [];
                    this.updateSummary();
                    this.saveDraft();
                }
            });
        }

        // 4. Оформить заказ
        if (this.summary.cartBtn) {
            this.summary.cartBtn.addEventListener('click', () => {
                const activeBase = document.querySelector('.base-option.active');
                if (!activeBase) {
                    alert('Выберите основу венка');
                    return;
                }
                if (this.placedFlowers.length === 0) {
                    alert('Добавьте хотя бы один цветок');
                    return;
                }

                const order = {
                    base: {
                        id: activeBase.dataset.base,
                        name: activeBase.textContent.trim(),
                        price: parseInt(activeBase.dataset.price) || 0
                    },
                    flowers: this.placedFlowers.map(f => ({
                        id: f.id, name: f.name, price: f.price, x: f.x, y: f.y, image: f.image
                    })),
                    total: this.calculateTotal(),
                    date: new Date().toISOString()
                };

                localStorage.setItem('wreathOrder', JSON.stringify(order));
                alert(`✅ Заказ сохранён!\nСумма: ${order.total} ₽`);
            });
        }
    }

    placeFlower(flower, x, y) {
        if (!this.flowersContainer) return;
        
        const el = document.createElement('div');
        el.className = 'placed-flower';
        el.style.left = `${x - 35}px`; 
        el.style.top = `${y - 35}px`;
        
        if (flower.image) {
            // pointer-events: none и user-select: none критически важны
            el.innerHTML = `<img src="${flower.image}" alt="${flower.name}" style="pointer-events: none; width: 100%; height: 100%; user-select: none;">`;
        } else {
            el.style.background = '#cbd5e1';
            el.style.borderRadius = '50%';
            el.textContent = flower.name.charAt(0);
        }

        // Привязываем надежную логику драга
        this.attachCustomDrag(el);

        // Удаление по двойному клику
        el.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (confirm('Удалить этот цветок?')) {
                el.remove();
                this.placedFlowers = this.placedFlowers.filter(f => f.el !== el);
                this.updateSummary();
                this.saveDraft();
            }
        });

        this.flowersContainer.appendChild(el);
        this.placedFlowers.push({ ...flower, x, y, el });
        this.updateSummary();
        this.saveDraft();
    }

    attachCustomDrag(el) {
        // Храним состояние прямо в элементе
        el.dragState = { isDragging: false };

        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Блокируем клик по холсту
            
            const state = el.dragState;
            state.isDragging = true;
            this.isDragging = false; // Сброс флага для холста

            state.startX = e.clientX;
            state.startY = e.clientY;
            state.initialLeft = parseInt(el.style.left) || 0;
            state.initialTop = parseInt(el.style.top) || 0;
            
            // Кешируем размеры холста
            state.canvasRect = this.canvas.getBoundingClientRect();
            
            el.style.zIndex = 1000; 
            el.style.cursor = 'grabbing';
            el.style.transition = 'none';

            // Создаем функции-обработчики и привязываем их К ЭЛЕМЕНТУ
            const moveHandler = this.handleDragMove.bind(this, el);
            const upHandler = this.handleDragEnd.bind(this, el);

            // Сохраняем ссылки, чтобы потом удалить
            state.moveHandler = moveHandler;
            state.upHandler = upHandler;

            // Вешаем на ДОКУМЕНТ
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
    }

    // Вынесенные обработчики (гарантируют корректное удаление)
    handleDragMove(el, e) {
        const state = el.dragState;
        if (!state.isDragging) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;

        let newLeft = state.initialLeft + dx;
        let newTop = state.initialTop + dy;

        // Жесткие границы
        const flowerSize = 70;
        newLeft = Math.max(0, Math.min(newLeft, state.canvasRect.width - flowerSize));
        newTop = Math.max(0, Math.min(newTop, state.canvasRect.height - flowerSize));

        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
    }

    handleDragEnd(el) {
        const state = el.dragState;
        if (!state.isDragging) return;
        
        state.isDragging = false;
        
        el.style.zIndex = 10; 
        el.style.cursor = 'move';
        el.style.transition = '';

        // Обновляем данные
        const placed = this.placedFlowers.find(f => f.el === el);
        if (placed) {
            placed.x = parseInt(el.style.left) + 35;
            placed.y = parseInt(el.style.top) + 35;
            this.saveDraft();
        }

        // Флаг для холста
        this.isDragging = true; 

        // ОБЯЗАТЕЛЬНО удаляем слушатели с документа
        document.removeEventListener('mousemove', state.moveHandler);
        document.removeEventListener('mouseup', state.upHandler);
    }

    updateSummary() {
        const activeBase = document.querySelector('.base-option.active');
        const baseName = activeBase?.querySelector('span')?.textContent || 'Не выбрана';
        const basePrice = parseInt(activeBase?.dataset.price) || 0;
        
        const flowersTotal = this.placedFlowers.reduce((sum, f) => sum + f.price, 0);
        const total = basePrice + flowersTotal;

        if (this.summary.base) this.summary.base.textContent = baseName;
        if (this.summary.count) this.summary.count.textContent = `${this.placedFlowers.length} шт`;
        if (this.summary.total) this.summary.total.textContent = `${total} ₽`;
        
        if (this.summary.list) {
            if (this.placedFlowers.length === 0) {
                this.summary.list.innerHTML = '<span style="color:var(--color-gray-400)">Нет цветов</span>';
            } else {
                this.summary.list.innerHTML = this.placedFlowers.map(f => 
                    `<div class="summary-row"><span>${f.name}</span><span>${f.price} ₽</span></div>`
                ).join('');
            }
        }
        
        if (this.summary.cartBtn) {
            this.summary.cartBtn.disabled = this.placedFlowers.length === 0 || !activeBase;
        }
    }

    calculateTotal() {
        const basePrice = parseInt(document.querySelector('.base-option.active')?.dataset.price) || 0;
        const flowersTotal = this.placedFlowers.reduce((sum, f) => sum + f.price, 0);
        return basePrice + flowersTotal;
    }

    saveDraft() {
        const activeBase = document.querySelector('.base-option.active');
        if (!activeBase) return;
        
        const draft = {
            base: {
                id: activeBase.dataset.base,
                price: parseInt(activeBase.dataset.price) || 0
            },
            flowers: this.placedFlowers.map(f => ({
                id: f.id, name: f.name, price: f.price, x: f.x, y: f.y, image: f.image
            }))
        };
        localStorage.setItem('wreathDraft', JSON.stringify(draft));
    }

    loadDraft() {
        try {
            const raw = localStorage.getItem('wreathDraft');
            if (!raw) return;
            
            const draft = JSON.parse(raw);
            
            if (draft.base?.id) {
                const option = document.querySelector(`.base-option[data-base="${draft.base.id}"]`);
                if (option) {
                    this.baseOptions.forEach(el => el.classList.remove('active'));
                    option.classList.add('active');
                    
                    if (this.wreathBase) {
                        const imagePath = `../images/wreaths/base-${draft.base.id}.jpg`;
                        this.wreathBase.style.backgroundImage = `url('${imagePath}')`;
                        this.wreathBase.style.backgroundSize = 'cover';
                        this.wreathBase.style.backgroundRepeat = 'no-repeat';
                        this.wreathBase.style.backgroundPosition = 'center';
                        this.wreathBase.style.width = '100%';
                        this.wreathBase.style.height = '100%';
                    }
                }
            }
            
            if (draft.flowers?.length && this.placedFlowers.length === 0) {
                draft.flowers.forEach(f => {
                    this.placeFlower(f, f.x, f.y);
                });
            }
            
            this.updateSummary();
        } catch (e) {
            console.warn('Не удалось загрузить черновик:', e);
        }
    }
}