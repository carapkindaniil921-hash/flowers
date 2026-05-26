// components/FlowerCanvas.js

export class FlowerCanvas {
    constructor(container) {
        this.container = container;
        this.flowers = [];
    }

    init() {
        console.log('FlowerCanvas initialized');
    }

    clear() {
        this.flowers = [];
        this.render();
    }

    addFlower(flower) {
        this.flowers.push(flower);
        this.render();
    }

    render() {
        // Рендеринг венка
        if (this.container) {
            this.container.innerHTML = `<p>Цветов: ${this.flowers.length}</p>`;
        }
    }

    getData() {
        return this.flowers;
    }

    destroy() {
        // Очистка
    }
}

export default FlowerCanvas;