// components/Footer.js
import { FOOTER_INFO, SOCIAL_LINKS } from '../data/constants.js';

export class Footer {
    constructor(containerSelector = '.footer') {
        this.container = document.querySelector(containerSelector);
    }

    render() {
        const socialLinksHTML = SOCIAL_LINKS.map(social => `
            <a href="${social.url}" target="_blank" class="social-icon">
                ${social.icon}
            </a>
        `).join('');

        return `
            <div class="container">
                <div class="footer-content">
                    <div class="footer-contacts">
                        <p>${FOOTER_INFO.phone}</p>
                        <p>${FOOTER_INFO.email}</p>
                        <p>${FOOTER_INFO.address}</p>
                    </div>
                    <div class="footer-copyright">
                        <p>&copy; ${new Date().getFullYear()} FlowerArt. Все права защищены.</p>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        if (this.container) {
            this.container.innerHTML = this.render();
            console.log('Footer загружен');
        }
    }

    destroy() {
  
    }
}

export default Footer;