// Transaction list component

import { formatCurrency } from '../utils/formatCurrency.js';
import { CATEGORIES_EXPENSE, CATEGORIES_INCOME, getIconForCategory } from '../utils/icons.js';
import { showDeleteModal } from './modals.js';

export function renderTransactionList(transactions) {
    const emptyState = document.getElementById('empty-state');
    const transactionList = document.getElementById('transaction-list');

    if (!transactionList) return;

    if (!transactions || transactions.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        transactionList.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    transactionList.innerHTML = transactions.map(item => createHistoryItemHTML(item)).join('');

    // Attach delete handlers
    transactionList.querySelectorAll('.transaction-item-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const desc = e.currentTarget.dataset.desc;
            const amount = e.currentTarget.dataset.amount;
            showDeleteModal(id, desc, amount);
        });
    });
}

function createHistoryItemHTML(item) {
    const isIncome = item.type === 'Income';
    const icon = getIconForCategory(item.category);

    return `
        <li class="transaction-item" data-id="${item.id}">
            <div class="transaction-item-icon">${icon}</div>
            <div class="transaction-item-details">
                <span class="transaction-item-desc">${item.description}</span>
                <span class="transaction-item-time">${item.date} ${item.time}</span>
            </div>
            <span class="transaction-item-amount ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'} ${formatCurrency(item.amount)}
            </span>
            <button class="transaction-item-delete-btn" data-id="${item.id}" data-desc="${item.description}" data-amount="${item.amount}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </li>
    `;
}
