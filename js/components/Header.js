// components/Header.js
import { NAVIGATION_LINKS } from '../data/constants.js';

export class Header {
    constructor(containerSelector = '.header') {
        this.container = document.querySelector(containerSelector);
        this.cartCount = 0;
        
        // Определяем текущую страницу
        const pathParts = window.location.pathname.split('/');
        this.currentPage = pathParts.pop() || 'index.html';
        
        if (!this.currentPage.endsWith('.html')) {
            this.currentPage = 'index.html';
        }
    }

    render() {
        const navItemsHTML = NAVIGATION_LINKS.map(({ href, title }) => {
            const isActive = this.currentPage === href ? 'class="active"' : '';
            return `<li><a href="${href}" ${isActive}>${title}</a></li>`;
        }).join('');

        const user = window.appState?.get('user');
        const userHTML = user
            ? `<span class="header-username">${user.role === 'admin' ? '👑 ' : ''}${user.name}</span>
               <button class="btn-logout" id="btn-logout">Выйти</button>`
            : `<a href="login.html" class="login-link">
                   <img src="../../images/icons/Login.png" alt="Login" class="login-icon">
               </a>`;

        return `
            <nav class="nav container">
                <a href="index.html" class="logo">🌸 FlowerArt</a>
                <ul class="nav-menu">
                    ${navItemsHTML}
                </ul>
                <div class="header-actions" style="display: flex; align-items: center; gap: 12px;">
                    <div class="cart-icon" id="cart-icon">
                        🛒 <span class="cart-count" id="cart-count">${this.cartCount}</span>
                    </div>
                    ${userHTML}
                </div>
            </nav>
        `;
    }

    init() {
        if (this.container) {
            this.container.innerHTML = this.render();
            this.updateCartCount();
            this.initMobileMenu();
            this.bindLogout();
        }
    }

    bindLogout() {
        const btn = this.container?.querySelector('#btn-logout');
        if (!btn) return;

        btn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            if (window.appState) {
                window.appState.set('user', null);
            }
            window.location.href = 'login.html';
        });
    }

    updateCartCount() {
        const cart = window.appState?.get('cart') || [];
        this.cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const countElement = document.getElementById('cart-count');
        if (countElement) {
            countElement.textContent = this.cartCount;
        }
    }

    initMobileMenu() {
        // Добавляем кнопку мобильного меню если нужно
        const nav = this.container?.querySelector('.nav');
        if (nav && !document.querySelector('.menu-toggle')) {
            const toggle = document.createElement('button');
            toggle.className = 'menu-toggle';
            toggle.innerHTML = '☰';
            toggle.addEventListener('click', () => {
                const menu = this.container?.querySelector('.nav-menu');
                menu?.classList.toggle('active');
            });
            nav.insertBefore(toggle, nav.firstChild);
        }
    }

    destroy() {
        // Очистка
    }
}

export default Header;