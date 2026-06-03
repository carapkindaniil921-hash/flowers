// pages/AnalyticsPage.js
import { OrderService } from '../services/OrderService.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_HEX = {
    red:      '#dc2626',
    pink:     '#ec4899',
    white:    '#d1d5db',
    yellow:   '#fbbf24',
    blue:     '#3b82f6',
    purple:   '#a855f7',
    orange:   '#f97316',
    green:    '#22c55e',
    black:    '#374151',
    cream:    '#fef3c7',
    burgundy: '#9f1239',
    blackpink:'#6e076b',
};

const COLOR_LABELS = {
    red:      'Красный',
    pink:     'Розовый',
    white:    'Белый',
    yellow:   'Жёлтый',
    blue:     'Синий',
    purple:   'Фиолетовый',
    orange:   'Оранжевый',
    green:    'Зелёный',
    black:    'Чёрный',
    cream:    'Кремовый',
    burgundy: 'Бордовый',
    blackpink:'Тёмно-розовый',
};

const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const DAYS_RU   = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

// ─── AnalyticsPage ───────────────────────────────────────────────────────────

export class AnalyticsPage {
    constructor() {
        this.stats       = null;
        this.charts      = {};
        this.activeTrend = 'revenue';
    }

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    init() {
        this.stats = OrderService.getStats();
        this._render();
        this._renderKPIs();

        // Дожидаемся рендера DOM перед инициализацией canvas
        requestAnimationFrame(() => {
            this._initTrendChart();
            this._initFunnelChart();
            this._initBarChart();
            this._initCalendarChart();
            this._initRoseChart();
            this._renderAssistant();
            this._bindResize();
        });
    }

    // ─── Shell ───────────────────────────────────────────────────────────────

    _render() {
        const year = new Date().getFullYear();
        document.getElementById('analytics-main').innerHTML = `
            <div class="analytics-panel container">

                <div class="analytics-page-header">
                    <div>
                        <h1 class="analytics-page-title">📈 Аналитика</h1>
                        <p class="analytics-page-subtitle">
                            Данные за всё время · ${this.stats.totalOrders} заказов
                        </p>
                    </div>
                    <a href="admin.html" class="btn btn-secondary admin-btn-sm">← Админ-панель</a>
                </div>

                <!-- KPI -->
                <div class="kpi-grid" id="kpi-grid"></div>

                <!-- Trend line (full width) -->
                <div class="chart-card chart-full">
                    <div class="chart-card__header">
                        <h3 class="chart-title">Динамика за 30 дней</h3>
                        <div class="chart-toggle">
                            <button class="chart-toggle-btn active" data-trend="revenue">Выручка</button>
                            <button class="chart-toggle-btn"        data-trend="orders">Заказы</button>
                        </div>
                    </div>
                    <div id="chart-trend" style="height:300px"></div>
                </div>

                <!-- Funnel + Top products -->
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card__header">
                            <h3 class="chart-title">Воронка заказов</h3>
                            <span class="chart-subtitle">По статусам</span>
                        </div>
                        <div id="chart-funnel" style="height:320px"></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card__header">
                            <h3 class="chart-title">Топ товаров</h3>
                            <span class="chart-subtitle">По количеству продаж</span>
                        </div>
                        <div id="chart-bar" style="height:320px"></div>
                    </div>
                </div>

                <!-- Calendar heatmap (full width) -->
                <div class="chart-card chart-full">
                    <div class="chart-card__header">
                        <h3 class="chart-title">Активность заказов — ${year}</h3>
                        <span class="chart-subtitle">Количество заказов по дням</span>
                    </div>
                    <div id="chart-calendar" style="height:175px"></div>
                </div>

                <!-- Rose + Smart assistant -->
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-card__header">
                            <h3 class="chart-title">Популярные цвета</h3>
                            <span class="chart-subtitle">Роза Найтингейл</span>
                        </div>
                        <div id="chart-rose" style="height:320px"></div>
                    </div>
                    <div class="chart-card assistant-card">
                        <div class="chart-card__header">
                            <h3 class="chart-title">🤖 Умный ассистент</h3>
                            <span class="chart-subtitle">Советы на основе данных</span>
                        </div>
                        <div id="assistant-tips"></div>
                    </div>
                </div>

            </div>
        `;

        document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-toggle-btn')
                    .forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTrend = btn.dataset.trend;
                this._updateTrendChart();
            });
        });
    }

    // ─── KPI cards ───────────────────────────────────────────────────────────

    _renderKPIs() {
        const s        = this.stats;
        const convRate = s.totalOrders > 0
            ? Math.round(s.completedOrders / s.totalOrders * 100) : 0;

        const kpis = [
            { icon: '📦', label: 'Всего заказов',  value: s.totalOrders,                                color: 'blue'   },
            { icon: '💰', label: 'Общая выручка',  value: s.totalRevenue.toLocaleString('ru-RU') + ' ₽', color: 'green'  },
            { icon: '🧾', label: 'Средний чек',    value: s.avgOrder.toLocaleString('ru-RU') + ' ₽',    color: 'amber'  },
            { icon: '✅', label: 'Выполнено',       value: `${s.completedOrders} (${convRate}%)`,         color: 'purple' },
        ];

        document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
            <div class="metric-card metric-card--${k.color}">
                <div class="metric-card__icon">${k.icon}</div>
                <div class="metric-card__body">
                    <div class="metric-card__value">${k.value}</div>
                    <div class="metric-card__label">${k.label}</div>
                </div>
            </div>
        `).join('');
    }

    // ─── Chart 1: Gradient Area Line ─────────────────────────────────────────

    _initTrendChart() {
        const el = document.getElementById('chart-trend');
        if (!el || !window.echarts) return;
        this.charts.trend = echarts.init(el);
        this._updateTrendChart();
    }

    _updateTrendChart() {
        if (!this.charts.trend) return;

        const isRevenue = this.activeTrend === 'revenue';
        const byDay = this.stats.byDay;

        const dates  = byDay.map(d => {
            const dt = new Date(d.date);
            return `${dt.getDate()} ${MONTHS_RU[dt.getMonth()]}`;
        });
        const values = byDay.map(d => isRevenue ? d.revenue : d.orders);

        this.charts.trend.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1f2937',
                borderColor: 'transparent',
                textStyle: { color: '#f9fafb', fontSize: 12 },
                formatter: params => {
                    const p   = params[0];
                    const val = isRevenue
                        ? p.value.toLocaleString('ru-RU') + ' ₽'
                        : p.value + ' заказ(а)';
                    return `<b>${p.axisValue}</b><br/>${isRevenue ? 'Выручка' : 'Заказы'}: ${val}`;
                },
            },
            grid: { left: 55, right: 20, top: 15, bottom: 45 },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine:  { lineStyle: { color: '#e5e7eb' } },
                axisTick:  { show: false },
                axisLabel: { color: '#9ca3af', fontSize: 11, interval: 4 },
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: '#9ca3af', fontSize: 11,
                    formatter: v => isRevenue ? v.toLocaleString('ru-RU') : v,
                },
                splitLine: { lineStyle: { color: '#f3f4f6' } },
            },
            series: [{
                type: 'line',
                data: values,
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: { color: '#4b5563', width: 2.5 },
                itemStyle: { color: '#4b5563', borderWidth: 2, borderColor: '#fff' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(75, 85, 99, 0.4)' },
                        { offset: 1, color: 'rgba(75, 85, 99, 0.03)' },
                    ]),
                },
            }],
        });
    }

    // ─── Chart 2: Funnel ─────────────────────────────────────────────────────

    _initFunnelChart() {
        const el = document.getElementById('chart-funnel');
        if (!el || !window.echarts) return;

        const sc = this.stats.statusCounts;
        const funnelData = [
            { name: 'Новые',        value: sc.pending + sc.confirmed + sc.processing + sc.shipped + sc.delivered, itemStyle: { color: '#f59e0b' } },
            { name: 'Подтверждены', value: sc.confirmed + sc.processing + sc.shipped + sc.delivered,              itemStyle: { color: '#3b82f6' } },
            { name: 'В обработке',  value: sc.processing + sc.shipped + sc.delivered,                             itemStyle: { color: '#8b5cf6' } },
            { name: 'Отправлены',   value: sc.shipped + sc.delivered,                                             itemStyle: { color: '#06b6d4' } },
            { name: 'Доставлены',   value: sc.delivered,                                                          itemStyle: { color: '#10b981' } },
        ].filter(d => d.value > 0);

        if (funnelData.length === 0) {
            el.innerHTML = '<div class="chart-empty">Нет данных</div>';
            return;
        }

        this.charts.funnel = echarts.init(el);
        this.charts.funnel.setOption({
            tooltip: {
                trigger: 'item',
                backgroundColor: '#1f2937',
                borderColor: 'transparent',
                textStyle: { color: '#f9fafb', fontSize: 12 },
                formatter: '{b}: <b>{c}</b> заказ(а)',
            },
            series: [{
                type: 'funnel',
                left: '8%',
                width: '84%',
                top: 20,
                bottom: 20,
                sort: 'none',
                gap: 4,
                label: {
                    position: 'inside',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    formatter: '{b}\n{c}',
                },
                itemStyle: { borderColor: '#fff', borderWidth: 2 },
                data: funnelData,
            }],
        });
    }

    // ─── Chart 3: Horizontal Bar ─────────────────────────────────────────────

    _initBarChart() {
        const el = document.getElementById('chart-bar');
        if (!el || !window.echarts) return;

        const products = this.stats.topProducts;
        if (products.length === 0) {
            el.innerHTML = '<div class="chart-empty">Нет данных о продажах</div>';
            return;
        }

        const names  = [...products].reverse().map(p =>
            p.name.length > 22 ? p.name.slice(0, 20) + '…' : p.name
        );
        const counts = [...products].reverse().map(p => p.count);
        const BAR_COLORS = ['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563'];

        this.charts.bar = echarts.init(el);
        this.charts.bar.setOption({
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: '#1f2937',
                borderColor: 'transparent',
                textStyle: { color: '#f9fafb', fontSize: 12 },
                formatter: params => `${params[0].name}<br/>Продано: <b>${params[0].value} шт.</b>`,
            },
            grid: { left: 145, right: 45, top: 10, bottom: 30 },
            xAxis: {
                type: 'value',
                axisLabel: { color: '#9ca3af', fontSize: 11 },
                splitLine: { lineStyle: { color: '#f3f4f6' } },
            },
            yAxis: {
                type: 'category',
                data: names,
                axisLabel: { color: '#4b5563', fontSize: 11 },
                axisLine: { show: false },
                axisTick: { show: false },
            },
            series: [{
                type: 'bar',
                data: counts.map((v, i) => ({
                    value: v,
                    itemStyle: { color: BAR_COLORS[i] ?? '#9ca3af', borderRadius: [0, 6, 6, 0] },
                })),
                label: {
                    show: true,
                    position: 'right',
                    color: '#6b7280',
                    fontSize: 11,
                    formatter: '{c} шт.',
                },
                barMaxWidth: 30,
            }],
        });
    }

    // ─── Chart 4: Calendar Heatmap ───────────────────────────────────────────

    _initCalendarChart() {
        const el = document.getElementById('chart-calendar');
        if (!el || !window.echarts) return;

        const year    = new Date().getFullYear();
        const calData = this.stats.byDay.map(d => [d.date, d.orders]);
        const maxVal  = Math.max(...calData.map(d => d[1]), 1);

        this.charts.calendar = echarts.init(el);
        this.charts.calendar.setOption({
            tooltip: {
                backgroundColor: '#1f2937',
                borderColor: 'transparent',
                textStyle: { color: '#f9fafb', fontSize: 12 },
                formatter: p => `${p.data[0]}<br/>Заказов: <b>${p.data[1]}</b>`,
            },
            visualMap: {
                min: 0,
                max: maxVal,
                type: 'continuous',
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                itemWidth: 12,
                itemHeight: 100,
                text: ['Много', 'Мало'],
                textStyle: { color: '#9ca3af', fontSize: 11 },
                inRange: { color: ['#f3f4f6', '#1f2937'] },
            },
            calendar: {
                top: 15,
                left: 40,
                right: 20,
                bottom: 35,
                range: String(year),
                cellSize: ['auto', 14],
                itemStyle: { borderWidth: 3, borderColor: '#fff' },
                splitLine: { show: false },
                yearLabel: { show: false },
                monthLabel: {
                    nameMap: MONTHS_RU,
                    color: '#9ca3af',
                    fontSize: 11,
                },
                dayLabel: {
                    firstDay: 1,
                    nameMap: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
                    color: '#9ca3af',
                    fontSize: 10,
                },
            },
            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: calData,
            }],
        });
    }

    // ─── Chart 5: Nightingale Rose ───────────────────────────────────────────

    _initRoseChart() {
        const el = document.getElementById('chart-rose');
        if (!el || !window.echarts) return;

        const colors = this.stats.topColors;
        if (colors.length === 0) {
            el.innerHTML = '<div class="chart-empty">Нет данных о цветах</div>';
            return;
        }

        this.charts.rose = echarts.init(el);
        this.charts.rose.setOption({
            tooltip: {
                trigger: 'item',
                backgroundColor: '#1f2937',
                borderColor: 'transparent',
                textStyle: { color: '#f9fafb', fontSize: 12 },
                formatter: '{b}: <b>{c} шт.</b> ({d}%)',
            },
            legend: {
                bottom: 8,
                left: 'center',
                textStyle: { color: '#6b7280', fontSize: 11 },
                itemWidth: 12,
                itemHeight: 12,
                icon: 'circle',
            },
            series: [{
                type: 'pie',
                roseType: 'area',
                radius: ['12%', '62%'],
                center: ['50%', '44%'],
                itemStyle: {
                    borderRadius: 5,
                    borderColor: '#fff',
                    borderWidth: 2,
                },
                label: { show: false },
                emphasis: {
                    label: { show: true, fontSize: 13, fontWeight: 700 },
                    itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' },
                },
                data: colors.map(c => ({
                    name:      COLOR_LABELS[c.color] || c.color,
                    value:     c.count,
                    itemStyle: { color: COLOR_HEX[c.color] || '#9ca3af' },
                })),
            }],
        });
    }

    // ─── Smart Assistant ─────────────────────────────────────────────────────

    _renderAssistant() {
        const tips      = this._generateTips();
        const container = document.getElementById('assistant-tips');
        if (!container) return;

        if (tips.length === 0) {
            container.innerHTML = `
                <p class="assistant-stub__hint">Недостаточно данных для советов.<br>
                Оформите хотя бы несколько заказов.</p>`;
            return;
        }

        container.innerHTML = tips.map(tip => `
            <div class="assistant-tip assistant-tip--${tip.type}">
                <span class="assistant-tip__icon">${tip.icon}</span>
                <p class="assistant-tip__text">${tip.text}</p>
            </div>
        `).join('');
    }

    _generateTips() {
        const s    = this.stats;
        const tips = [];

        if (s.topProducts.length > 0) {
            const top = s.topProducts[0];
            tips.push({
                type: 'success', icon: '🌺',
                text: `"${top.name}" — лидер продаж (${top.count} шт., ${top.revenue.toLocaleString('ru-RU')} ₽). Рекомендуем поставить на главную страницу.`,
            });
        }

        if (s.statusCounts.pending > 2) {
            tips.push({
                type: 'warning', icon: '⚠️',
                text: `${s.statusCounts.pending} заказ(а) ожидают обработки. Перейдите в Kanban-доску и обработайте их.`,
            });
        }

        const dayMap = {};
        s.byDay.forEach(d => {
            const dow = new Date(d.date).getDay();
            dayMap[dow] = (dayMap[dow] || 0) + d.orders;
        });
        const peakEntry = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
        if (peakEntry) {
            tips.push({
                type: 'info', icon: '📅',
                text: `${DAYS_RU[peakEntry[0]]} — пиковый день продаж (${peakEntry[1]} заказ(а)). Запускайте акции в этот день.`,
            });
        }

        const threshold = parseInt(localStorage.getItem('flowerart_delivery_threshold') || '5000');
        if (s.avgOrder > 0 && s.avgOrder < threshold * 0.15) {
            tips.push({
                type: 'info', icon: '🚚',
                text: `Средний чек ${s.avgOrder.toLocaleString('ru-RU')} ₽ значительно ниже порога бесплатной доставки (${threshold.toLocaleString('ru-RU')} ₽). Рассмотрите снижение порога в настройках.`,
            });
        }

        if (s.topColors.length > 0) {
            const tc = s.topColors[0];
            tips.push({
                type: 'success', icon: '🎨',
                text: `Самый популярный цвет — "${COLOR_LABELS[tc.color] || tc.color}" (${tc.count} шт.). Пополните ассортимент этого цвета в каталоге.`,
            });
        }

        return tips.slice(0, 4);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    _bindResize() {
        this._resizeHandler = () => Object.values(this.charts).forEach(c => c?.resize());
        window.addEventListener('resize', this._resizeHandler);
    }

    destroy() {
        window.removeEventListener('resize', this._resizeHandler);
        Object.values(this.charts).forEach(c => c?.dispose());
    }
}

export default AnalyticsPage;
