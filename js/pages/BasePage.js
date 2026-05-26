// pages/BasePage.js
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';

export class BasePage {
    constructor() {
        this.header = new Header();
        this.footer = new Footer();
        this.elements = {};
    }

    async render() {
        document.body.innerHTML = '';
        await this.header.render();
        this.header.init();
        await this.renderContent();
        await this.footer.render();
        this.footer.init();
    }
    
    async renderContent() {
        throw new Error('Method renderContent() must be implemented');
    }

    init() {
        
    }

    destroy() {
        if (this.header.destroy) this.header.destroy();
        if (this.footer.destroy) this.footer.destroy();
    }

    
    $(selector) {
        return document.querySelector(selector);
    }

    $$(selector) {
        return document.querySelectorAll(selector);
    }
}