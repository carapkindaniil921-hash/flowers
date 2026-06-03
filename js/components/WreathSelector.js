import { wreaths } from '../data/wreaths.js';

export class WreathSelector {
    constructor(containerId, onSelect) {
        this.container = document.getElementById(containerId);
        this.onSelect = onSelect;
        this.selectedWreath = null;
    }

    render() {
        if (!this.container) {
            console.warn('WreathSelector: контейнер не найден!');
            return;
        }
        
        this.container.innerHTML = wreaths.map((wreath, index) => `
            <div class="base-option ${index === 0 ? 'active' : ''}" 
                 data-id="${wreath.id}" 
                 data-price="${wreath.price}" 
                 data-size="${wreath.size}">
                ${wreath.img 
                    ? `<img src="${wreath.img}" alt="${wreath.name}" onerror="this.style.display='none'">`
                    : ''
                }
                <span>${wreath.name}</span>
                <span class="base-price">${wreath.price} ₽</span>
            </div>
        `).join('');
    
        this.bindEvents();
        
        // Выбираем первый по умолчанию
        if (wreaths.length > 0) {
            this.selectWreath(wreaths[0]);
        }
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const option = e.target.closest('.base-option');
            if (!option) return;

            document.querySelectorAll('.base-option').forEach(el => el.classList.remove('active'));
            option.classList.add('active');

            const wreath = {
                id: option.dataset.id,
                price: parseInt(option.dataset.price),
                size: option.dataset.size,
                name: option.querySelector('span')?.textContent || ''
            };

            this.selectWreath(wreath);
        });
    }

    selectWreath(wreath) {
        this.selectedWreath = wreath;
        if (this.onSelect) this.onSelect(wreath);
    }
}