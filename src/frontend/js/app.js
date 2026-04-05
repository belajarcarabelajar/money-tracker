import { getUserId, getState, setState, subscribe } from './store.js';
import { transactionsApi } from './api.js';
import { CATEGORIES_EXPENSE, CATEGORIES_INCOME } from './utils/icons.js';
import { showToast } from './components/toast.js';
import { initChat } from './components/chat-window.js';
import { initHeader, updateConnectionStatus } from './components/header.js';
import { updateBalanceDisplay } from './components/balance-card.js';
import { initTransactionForm } from './components/transaction-form.js';
import { initCharts, updateCharts } from './components/charts.js';
import { initBackup } from './components/backup-section.js';
import { initModals } from './components/modals.js';
import { renderTransactionList } from './components/transaction-list.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize user ID
    getUserId();

    // Setup clock and connection status
    initHeader();
    updateConnectionStatus('connected');

    // Initialize UI modules
    initDarkMode();
    initTransactionForm();
    initCategoryGrid('Expense');
    initCharts();
    initBackup();
    initModals();
    initChat();
    initKeyboardShortcuts();
    initEventListeners();

    // Load initial data
    await loadData();
});

async function loadData() {
    try {
        const [balanceData, transactionsData, statsData] = await Promise.all([
            transactionsApi.balance(),
            transactionsApi.list({ limit: 100 }),
            transactionsApi.stats('Expense')
        ]);

        setState({
            balance: balanceData,
            transactions: transactionsData.data || [],
            stats: statsData
        });

        renderAll();
    } catch (error) {
        console.error('Failed to load data:', error);
        showToast('Gagal memuat data', 'error');
    }
}

function initEventListeners() {
    // Listen for transaction-type-change events from transaction-form
    window.addEventListener('transaction-type-change', (e) => {
        initCategoryGrid(e.detail);
    });

    // Listen for transaction-added events
    window.addEventListener('transaction-added', () => {
        loadData();
    });

    // Listen for data-imported events (from backup-section)
    window.addEventListener('data-imported', () => {
        loadData();
    });

    // Listen for chart-data-loaded events
    window.addEventListener('chart-data-loaded', (e) => {
        const { type, stats } = e.detail;
        setState({ stats, currentChartType: type });
        updateCharts(stats.categories, stats.trend, type);
    });
}

function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-switch');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedTheme === 'dark') {
        document.body.dataset.theme = 'dark';
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    darkModeToggle?.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
    });
}

function initCategoryGrid(type) {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const cats = type === 'Income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

    cats.forEach(c => {
        const item = document.createElement('div');
        item.className = 'category-item';
        const safeId = c.id.replace(/\s+/g, '-');
        item.innerHTML = `
            <input type="radio" id="cat-${safeId}" name="category" value="${c.id}">
            <label for="cat-${safeId}">
                ${c.icon}
                <span>${c.id}</span>
            </label>
        `;
        grid.appendChild(item);
    });
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + C: Toggle Chatbot
        if (e.altKey && e.code === 'KeyC') {
            e.preventDefault();
            document.getElementById('ai-fab')?.click();
        }

        // Esc: Close modals
        if (e.code === 'Escape') {
            const chatWindow = document.getElementById('chat-window');
            if (chatWindow?.classList.contains('open')) {
                chatWindow.classList.remove('open');
            }
            const openModal = document.querySelector('.modal-overlay.visible');
            if (openModal) {
                openModal.classList.remove('visible');
            }
        }

        // Alt + N: Focus amount
        if (e.altKey && e.code === 'KeyN') {
            e.preventDefault();
            document.getElementById('amount')?.focus();
        }

        // Alt + D: Focus description
        if (e.altKey && e.code === 'KeyD') {
            e.preventDefault();
            document.getElementById('description')?.focus();
        }

        // Ctrl + Enter: Submit form
        if (e.ctrlKey && e.code === 'Enter') {
            const form = document.getElementById('transaction-form');
            if (form?.contains(document.activeElement)) {
                document.getElementById('submit-btn')?.click();
            }
        }
    });
}

function renderAll() {
    const state = getState();
    const { balance, transactions, stats, currentChartType } = state;

    updateBalanceDisplay(balance);
    renderTransactionList(transactions);
    if (stats) {
        updateCharts(stats.categories, stats.trend, currentChartType || 'Expense');
    }
}

// Subscribe to state changes
subscribe((state) => {
    renderAll();
});

// Export for use by other modules
export { loadData, initCategoryGrid, getState, setState };
