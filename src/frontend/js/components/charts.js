// Charts component

import { transactionsApi } from '../api.js';

let categoryChartInstance = null;
let trendChartInstance = null;

export function initCharts() {
    const btnExpense = document.getElementById('btn-chart-expense');
    const btnIncome = document.getElementById('btn-chart-income');

    btnExpense?.addEventListener('click', () => setChartType('Expense'));
    btnIncome?.addEventListener('click', () => setChartType('Income'));
}

export function setChartType(type) {
    const btnExpense = document.getElementById('btn-chart-expense');
    const btnIncome = document.getElementById('btn-chart-income');

    if (type === 'Expense') {
        btnExpense?.classList.add('active');
        btnIncome?.classList.remove('active');
    } else {
        btnIncome?.classList.add('active');
        btnExpense?.classList.remove('active');
    }

    loadChartData(type);

    // Notify app.js of chart type change via event
    window.dispatchEvent(new CustomEvent('chart-type-change', { detail: type }));
}

export async function loadChartData(type) {
    try {
        const stats = await transactionsApi.stats(type);
        window.dispatchEvent(new CustomEvent('chart-data-loaded', { detail: { type, stats } }));
    } catch (error) {
        console.error('Failed to load chart data:', error);
    }
}

export function updateCharts(categories, trend, chartType) {
    renderCategoryChart(categories || [], chartType || 'Expense');
    renderTrendChart(trend || []);
}

function renderCategoryChart(categories, chartType) {
    const canvasCategory = document.getElementById('categoryChart');
    if (!canvasCategory) return;

    const ctxCategory = canvasCategory.getContext('2d');

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    const labels = categories.map(c => c.category);
    const data = categories.map(c => parseInt(c.total));
    const colors = chartType === 'Expense'
        ? ['#EF4444', '#F87171', '#DC2626', '#B91C1C', '#991B1B', '#FECACA', '#FDA4AF', '#FB7185', '#E11D48', '#BE123C']
        : ['#10B981', '#34D399', '#059669', '#047857', '#6EE7B7', '#065F46', '#A7F3D0', '#3B82F6', '#60A5FA', '#2563EB'];

    categoryChartInstance = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: data.length > 0 ? colors.slice(0, labels.length) : ['#E5E7EB'],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}

function renderTrendChart(trend) {
    const canvasTrend = document.getElementById('trendChart');
    if (!canvasTrend) return;

    const ctxTrend = canvasTrend.getContext('2d');

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    // Build last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    const dailyIncome = new Array(7).fill(0);
    const dailyExpense = new Array(7).fill(0);

    trend.forEach(t => {
        const index = last7Days.indexOf(t.date);
        if (index !== -1) {
            if (t.type === 'Income') dailyIncome[index] = parseInt(t.total);
            else dailyExpense[index] = parseInt(t.total);
        }
    });

    const dateLabels = last7Days.map(d => {
        const parts = d.split('-');
        return `${parts[2]}/${parts[1]}`;
    });

    trendChartInstance = new Chart(ctxTrend, {
        type: 'bar',
        data: {
            labels: dateLabels,
            datasets: [
                { label: 'Pemasukan', data: dailyIncome, backgroundColor: '#10B981', borderRadius: 4 },
                { label: 'Pengeluaran', data: dailyExpense, backgroundColor: '#DC2626', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => v >= 1000 ? v/1000 + 'k' : v } },
                x: { ticks: { font: { size: 10 } } }
            },
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}
