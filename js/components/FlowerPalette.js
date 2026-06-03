import { flowers } from '../data/flowers.js';

export class FlowerPalette {
    constructor(containerId, onFlowerSelect) {
        this.container = document.getElementById(containerId);
        this.onFlowerSelect = onFlowerSelect;
    }

    render() {
        // Берем первую вариацию каждого цветка для палитры
        const uniqueFlowers = flowers.map(flower => ({
            ...flower,
            ...flower.variations[0] // первая вариация
        }));

        this.container.innerHTML = uniqueFlowers.map(flower => `
            <div class="flower-item" 
                 draggable="true" 
                 data-id="${flower.id}" 
                 data-name="${flower.name}"
                 data-price="${flower.price}"
                 data-image="${flower.image}">
                <img src="${flower.image}" alt="${flower.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2260%22 height=%2260%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3E🌸%3C/text%3E%3C/svg%3E'">
                <div class="flower-info">
                    <span class="flower-name">${flower.name}</span>
                    <span class="flower-price">${flower.price} ₽</span>
                </div>
                <button class="btn-add-flower" data-id="${flower.id}">+</button>
            </div>
        `).join('');

        this.bindEvents();
    }

    bindEvents() {
        // Drag events
        this.container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.flower-item');
            if (!item) return;

            e.dataTransfer.setData('flower', JSON.stringify({
                id: item.dataset.id,
                name: item.dataset.name,
                price: parseInt(item.dataset.price),
                image: item.dataset.image
            }));
            e.dataTransfer.effectAllowed = 'copy';
        });

        // Click on add button
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-add-flower');
            if (!btn) return;

            const item = btn.closest('.flower-item');
            if (this.onFlowerSelect) {
                this.onFlowerSelect({
                    id: item.dataset.id,
                    name: item.dataset.name,
                    price: parseInt(item.dataset.price),
                    image: item.dataset.image
                });
            }
        });
    }
}