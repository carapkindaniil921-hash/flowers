import { FlowerCanvas } from '../components/FlowerCanvas.js';

export class ConstructorPage {
    constructor() {
        this.elements = {};
        this.components = {};
    }

    init() {
        console.log('ConstructorPage initialized');
        this.cacheElements();
        this.initComponents();
        this.initControls();
    }

    cacheElements() {
        this.elements = {
            canvasContainer: document.getElementById('canvas-container') || document.querySelector('.wreath-canvas'),
            paletteContainer: document.getElementById('palette-container'),
            selectorContainer: document.getElementById('wreath-selector-container'),
            summaryContainer: document.getElementById('summary-container'),
            clearBtn: document.getElementById('clear-wreath'),
            saveBtn: document.getElementById('save-wreath'),
            addToCartBtn: document.getElementById('add-to-cart')
        };
    }

    initComponents() {
        
        if (this.elements.selectorContainer) {
            import('../components/WreathSelector.js').then(module => {
                this.components.selector = new module.WreathSelector(this.elements.selectorContainer);
                this.components.selector.init();
            });
        }

        if (this.elements.canvasContainer) {  
            import('../components/FlowerCanvas.js').then(module => {
                this.components.canvas = new module.FlowerCanvas(this.elements.canvasContainer);
                this.components.canvas.init();
            });
        }

        if (this.elements.paletteContainer) {
            import('../components/FlowerPalette.js').then(module => {
                this.components.palette = new module.FlowerPalette(this.elements.paletteContainer);
                this.components.palette.init();
            });
        }

        if (this.elements.summaryContainer) {
            import('../components/OrderSummary.js').then(module => {
                this.components.summary = new module.OrderSummary(this.elements.summaryContainer);
                this.components.summary.init();
            });
        }
    }

    initControls() {
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this.clearWreath());
        }

        if (this.elements.saveBtn) {
            this.elements.saveBtn.addEventListener('click', () => this.saveWreath());
        }

        if (this.elements.addToCartBtn) {
            this.elements.addToCartBtn.addEventListener('click', () => this.addToCart());
        }
    }

    clearWreath() {
        if (this.components.canvas) {
            this.components.canvas.clear();
        }
    }

    saveWreath() {
        const wreathData = this.components.canvas?.getData();
        if (wreathData) {
            window.appState.set('currentWreath', wreathData);
            alert('Венок сохранен!');
        }
    }

    addToCart() {
        alert('Венок добавлен в корзину!');
    }

    destroy() {
        Object.values(this.components).forEach(component => {
            if (component.destroy) component.destroy();
        });
    }
}