// main.js
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { State } from './core/State.js';
import { ShoppingCart } from './components/ShoppingCart.js';
import { OrderService } from './services/OrderService.js';


document.addEventListener('DOMContentLoaded', () => {

    const savedUser = localStorage.getItem('currentUser');
    const restoredUser = savedUser ? JSON.parse(savedUser) : null;

    const savedCart = localStorage.getItem('flowerart_cart');
    const restoredCart = savedCart ? JSON.parse(savedCart) : [];

    window.appState = new State({
        cart: restoredCart,
        user: restoredUser,
        currentWreath: null,
        filters: {
            category: [],
            priceRange: [0, 10000],
            color: []
        }
    });

    const header = new Header('#header-container');
    const footer = new Footer('#footer-container');

    header.init();
    footer.init();

    const shoppingCart = new ShoppingCart();
    shoppingCart.init();
    window.appCart = shoppingCart;

    // Заполняем демо-заказами при первом запуске (для аналитики и админки)
    OrderService.seedIfEmpty();

    // Промо-баннер (управляется из настроек админки)
    const promoCfg = localStorage.getItem('flowerart_promo_banner');
    if (promoCfg) {
        try {
            const cfg = JSON.parse(promoCfg);
            if (cfg.active && cfg.text) {
                const banner = document.createElement('div');
                banner.className = 'promo-banner';
                banner.innerHTML = `
                    <div class="container">
                        <span>${cfg.text}</span>
                        <button class="promo-banner__close" aria-label="Закрыть">✕</button>
                    </div>`;
                document.body.insertBefore(banner, document.body.firstChild);
                banner.querySelector('.promo-banner__close')
                    .addEventListener('click', () => banner.remove());
            }
        } catch { /* некорректный JSON — игнорируем */ }
    }

    const path = window.location.pathname;

    if (path.includes('admin.html')) {
        import('./pages/AdminPage.js').then(module => {
            const page = new module.AdminPage();
            page.init();
        });
    } else if (path.includes('analitick.html')) {
        import('./pages/AnalyticsPage.js').then(module => {
            const page = new module.AnalyticsPage();
            page.init();
        });
    } else if (path.includes('catalog.html')) {
        import('./pages/CatalogPage.js').then(module => {
            const page = new module.CatalogPage();
            page.init();
        });
    } else if (path.includes('constructor.html')) {
        import('./pages/ConstructorPage.js').then(module => {
            const page = new module.ConstructorPage();
            page.init();
        });
    } else if (path.includes('checkout.html')) {
        import('./pages/CheckoutPage.js').then(module => {
            const page = new module.CheckoutPage();
            page.init();
        });
    } else if (path.includes('contacts.html')) {
        import('./pages/ContactsPage.js').then(module => {
            const page = new module.ContactsPage();
            page.init();
        });
    } else if (path.includes('login.html')) {
        import('./pages/LoginPage.js').then(module => {
            const page = new module.LoginPage();
            page.init();
        });
    } else {
        
        import('./pages/HomePage.js').then(module => {
            const page = new module.HomePage();
            page.init();
        });
    }
});


