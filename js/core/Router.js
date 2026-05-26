// core/Router.js
export class Router {
    constructor() {
        this.routes = new Map();
        this.currentPage = null;
    }

    addRoute(path, pageClass) {
        this.routes.set(path, pageClass);
    }

    async init() {
        
        await this.navigate(window.location.pathname);

        
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href]')) {
                const href = e.target.getAttribute('href');
                if (!href.startsWith('http') && !href.startsWith('#')) {
                    e.preventDefault();
                    this.navigate(href);
                }
            }
        });

        
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname);
        });
    }

    async navigate(path) {
        
        const cleanPath = path.replace(/^\//, '');
        
        
        const PageClass = this.routes.get(cleanPath);
        
        if (!PageClass) {
            console.error(`Страница ${cleanPath} не найдена`);
            return;
        }

        
        if (this.currentPage) {
            this.currentPage.destroy();
        }

        
        this.currentPage = new PageClass();
        await this.currentPage.render();
        this.currentPage.init();

    
        history.pushState({}, '', path);
    }
}