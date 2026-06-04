// services/OrderService.js

export class OrderService {
    static STORAGE_KEY   = 'flowerart_orders';
    static COUNTER_KEY   = 'flowerart_order_counter';

    // ─── Internal helpers ────────────────────────────────────────────────────

    static _load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    static _persist(orders) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    }

    static _nextId() {
        const n = parseInt(localStorage.getItem(this.COUNTER_KEY) || '0') + 1;
        localStorage.setItem(this.COUNTER_KEY, String(n));
        return `ORD-${String(n).padStart(4, '0')}`;
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    /**
     * Сохраняет новый заказ. Возвращает сохранённый объект с id и датой.
     * @param {Object} orderData  — данные из CheckoutPage
     * @returns {Object} order
     */
    static save(orderData) {
        const orders = this._load();
        const order = {
            id:   this._nextId(),
            date: new Date().toISOString(),
            status: 'pending',
            ...orderData,
        };
        orders.push(order);
        this._persist(orders);
        return order;
    }

    /** Все заказы, сортировка: новые первыми */
    static getAll() {
        return this._load().sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /** Один заказ по id */
    static getById(id) {
        return this._load().find(o => o.id === id) || null;
    }

    /**
     * Обновить статус заказа.
     * Статусы: pending | confirmed | processing | shipped | delivered | cancelled
     */
    static updateStatus(id, status) {
        const orders = this._load();
        const order  = orders.find(o => o.id === id);
        if (order) {
            order.status    = status;
            order.updatedAt = new Date().toISOString();
            this._persist(orders);
        }
        return order || null;
    }

    /** Удалить заказ по id */
    static delete(id) {
        this._persist(this._load().filter(o => o.id !== id));
    }

    /** Очистить все заказы (только для разработки) */
    static clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.COUNTER_KEY);
    }

    // ─── Demo seed ───────────────────────────────────────────────────────────

    /**
     * Заполняет хранилище демо-заказами, если оно пустое.
     * Используется для разработки и демонстрации аналитики.
     */
    static seedIfEmpty() {
        if (this._load().length > 0) return;

        const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled'];
        const ITEMS_POOL = [
            { originalId: 1, name: 'Гвоздика (yellow)',   price: 25,  color: 'yellow',  colorHex: '#fbbf24', image: '../images/flowers/carnationcat1.jpg' },
            { originalId: 3, name: 'Хризантема (pink)',   price: 15,  color: 'pink',    colorHex: '#ec4899', image: '../images/flowers/chrysanthemumcat2.jpg' },
            { originalId: 5, name: 'Роза (red)',           price: 34,  color: 'red',     colorHex: '#ff0000', image: '../images/flowers/rosecat1.jpg' },
            { originalId: 5, name: 'Роза (pink)',          price: 30,  color: 'pink',    colorHex: '#ec4899', image: '../images/flowers/rosecat2.jpg' },
            { originalId: 6, name: 'Роза малая (white)',   price: 30,  color: 'white',   colorHex: '#ffffff', image: '../images/flowers/rosamalayacat3.jpg' },
            { originalId: 7, name: 'Роза крутая (yellow)', price: 60, color: 'yellow',  colorHex: '#fbbf24', image: '../images/flowers/rosecat5.jpg' },
            { originalId: 8, name: 'Шелковая роза (black)',price: 84,  color: 'black',   colorHex: '#000000', image: '../images/flowers/silkrosecat1.jpg' },
            { originalId: 4, name: 'Георгин (orange)',    price: 18,  color: 'orange',  colorHex: '#f97316', image: '../images/flowers/dahliacat1.jpg' },
            { originalId: 2, name: 'Ромашка (white)',     price: 12,  color: 'white',   colorHex: '#f3f4f6', image: '../images/flowers/chamomilecat1.jpg' },
        ];
        const CUSTOMERS = [
            { 'first-name': 'Анна',    'last-name': 'Смирнова',  email: 'anna@mail.ru',   phone: '+7 912 345 67 89', city: 'Москва',      address: 'ул. Ленина, 12' },
            { 'first-name': 'Иван',    'last-name': 'Петров',    email: 'ivan@mail.ru',   phone: '+7 903 111 22 33', city: 'Тюмень',      address: 'пр. Мира, 7' },
            { 'first-name': 'Мария',   'last-name': 'Козлова',   email: 'maria@yandex.ru',phone: '+7 926 555 66 77', city: 'СПб',         address: 'Невский пр., 45' },
            { 'first-name': 'Дмитрий', 'last-name': 'Новиков',   email: 'dima@gmail.com', phone: '+7 916 777 88 99', city: 'Екатеринбург',address: 'ул. Вайнера, 3' },
            { 'first-name': 'Ольга',   'last-name': 'Федорова',  email: 'olga@mail.ru',   phone: '+7 965 000 11 22', city: 'Казань',      address: 'ул. Баумана, 9' },
        ];
        const PAYMENTS = ['card', 'card', 'card', 'cash', 'online'];

        const orders = this._load();
        let counter  = parseInt(localStorage.getItem(this.COUNTER_KEY) || '0');

        for (let i = 0; i < 18; i++) {
            const daysAgo = Math.floor(Math.random() * 28);
            const date    = new Date();
            date.setDate(date.getDate() - daysAgo);

            const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
            const itemCount = Math.floor(Math.random() * 3) + 1;
            const items = [];

            for (let j = 0; j < itemCount; j++) {
                const src = { ...ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)] };
                src.id       = Date.now() + j;
                src.quantity = Math.floor(Math.random() * 5) + 1;
                const existing = items.find(it => it.name === src.name);
                if (existing) {
                    existing.quantity += src.quantity;
                } else {
                    items.push(src);
                }
            }

            const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
            const shipping = subtotal >= 5000 ? 0 : 500;

            counter++;
            orders.push({
                id:      `ORD-${String(counter).padStart(4, '0')}`,
                date:    date.toISOString(),
                status:  STATUSES[Math.floor(Math.random() * STATUSES.length)],
                ...customer,
                payment: PAYMENTS[Math.floor(Math.random() * PAYMENTS.length)],
                city:    customer.city,
                address: customer.address,
                items,
                subtotal,
                shipping,
                total: subtotal + shipping,
            });
        }

        localStorage.setItem(this.COUNTER_KEY, String(counter));
        this._persist(orders);
    }
}

export default OrderService;
