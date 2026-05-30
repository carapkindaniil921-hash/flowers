// services/ProductService.js

export class ProductService {
    static STORAGE_KEY  = 'flowerart_products';
    static NEXT_ID_KEY  = 'flowerart_product_next_id';

    // ─── Internal ────────────────────────────────────────────────────────────

    static _loadSync() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    static _persist(products) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    }

    static _nextId() {
        const n = parseInt(localStorage.getItem(this.NEXT_ID_KEY) || '100') + 1;
        localStorage.setItem(this.NEXT_ID_KEY, String(n));
        return n;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Возвращает все товары.
     * При первом вызове загружает данные из flowers.js и кэширует в localStorage.
     */
    static async getAll() {
        const stored = this._loadSync();
        if (stored) return stored;

        const { flowers } = await import('../data/flowers.js');
        this._persist(flowers);
        const maxId = flowers.reduce((m, f) => Math.max(m, f.id), 0);
        localStorage.setItem(this.NEXT_ID_KEY, String(maxId));
        return flowers;
    }

    /** Синхронный вариант — только если уже инициализировано */
    static getAllSync() {
        return this._loadSync() || [];
    }

    static getById(id) {
        return this.getAllSync().find(p => p.id === id) || null;
    }

    /**
     * Сохраняет товар. Если product.id есть — обновляет, нет — создаёт.
     */
    static save(product) {
        const products = this.getAllSync();
        if (product.id) {
            const idx = products.findIndex(p => p.id === product.id);
            if (idx !== -1) {
                products[idx] = product;
            } else {
                products.push(product);
            }
        } else {
            product.id = this._nextId();
            products.push(product);
        }
        this._persist(products);
        return product;
    }

    static delete(id) {
        this._persist(this.getAllSync().filter(p => p.id !== id));
    }

    /** Сброс к данным из flowers.js */
    static async reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.NEXT_ID_KEY);
        return await this.getAll();
    }
}

export default ProductService;
