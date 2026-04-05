// Balance card component

import { formatCurrency } from '../utils/formatCurrency.js';

export function updateBalanceDisplay(balance) {
    const balanceDisplay = document.getElementById('balance-display');
    const incomeDisplay = document.getElementById('income-display');
    const expenseDisplay = document.getElementById('expense-display');
    const balanceCard = document.getElementById('balance-card');

    if (!balanceDisplay) return;

    const bal = balance.balance || 0;
    balanceDisplay.textContent = formatCurrency(bal);
    incomeDisplay.textContent = formatCurrency(balance.income || 0);
    expenseDisplay.textContent = formatCurrency(balance.expense || 0);

    // Balance card gradient
    balanceCard.className = 'balance-card ' + (bal > 0 ? 'positive' : (bal < 0 ? 'negative' : ''));
}
