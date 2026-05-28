// main.js
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { State } from './core/State.js';


document.addEventListener('DOMContentLoaded', () => {
   
    window.appState = new State({
        cart: [],
        user: null,
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

    const path = window.location.pathname;
    
    if (path.includes('catalog.html')) {
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


