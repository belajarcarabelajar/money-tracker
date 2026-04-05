// Transaction form component

import { transactionsApi } from '../api.js';
import { showToast } from './toast.js';
import { CATEGORIES_EXPENSE, CATEGORIES_INCOME } from '../utils/icons.js';

export function initTransactionForm() {
    const form = document.getElementById('transaction-form');
    const submitBtn = document.getElementById('submit-btn');
    const amountInput = document.getElementById('amount');

    if (!form || !amountInput) return;

    // Format amount input
    amountInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        e.target.dataset.rawValue = val;
        if (val) e.target.value = new Intl.NumberFormat('id-ID').format(val);
        else e.target.value = '';
    });

    // Type change -> update category grid (deferred to app.js)
    document.querySelectorAll('input[name="type"]').forEach(r => {
        r.addEventListener('change', (e) => {
            // Notify app.js to update category grid
            window.dispatchEvent(new CustomEvent('transaction-type-change', { detail: e.target.value }));
        });
    });

    // Submit
    form.addEventListener('submit', handleSubmit);

    // Auto categorize button
    const autoCatBtn = document.getElementById('auto-categorize-btn');
    const descInput = document.getElementById('description');

    if (autoCatBtn && descInput) {
        autoCatBtn.addEventListener('click', () => handleAutoCategorize(descInput.value.trim()));
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const form = document.getElementById('transaction-form');
    const submitBtn = document.getElementById('submit-btn');
    const amountInput = document.getElementById('amount');
    const description = document.getElementById('description')?.value.trim();
    const category = form?.querySelector('input[name="category"]:checked')?.value;
    const type = form?.querySelector('input[name="type"]:checked')?.value;

    const rawAmount = amountInput?.dataset?.rawValue;

    if (!rawAmount || parseInt(rawAmount) <= 0) {
        return showToast('Jumlah tidak valid', 'error');
    }
    if (!description || description.length < 3) {
        return showToast('Deskripsi terlalu pendek', 'error');
    }
    if (!category) {
        return showToast('Pilih kategori', 'error');
    }

    submitBtn?.classList.add('loading');
    if (submitBtn) submitBtn.disabled = true;

    const now = new Date();
    const newTransaction = {
        amount: parseInt(rawAmount),
        description,
        category,
        type,
        date: now.toLocaleDateString('id-ID').split('/').reverse().join('-'),
        time: now.toLocaleTimeString('id-ID', { hour12: false }),
        timestamp: now.getTime()
    };

    try {
        await transactionsApi.create(newTransaction);
        form?.reset();
        amountInput.value = '';
        if (amountInput) amountInput.dataset.rawValue = '';
        const expenseRadio = document.getElementById('type-expense');
        if (expenseRadio) expenseRadio.checked = true;
        window.dispatchEvent(new CustomEvent('transaction-type-change', { detail: 'Expense' }));
        showToast('Transaksi disimpan!', 'success');
        window.dispatchEvent(new CustomEvent('transaction-added'));
    } catch (error) {
        showToast('Gagal menyimpan: ' + error.message, 'error');
    } finally {
        submitBtn?.classList.remove('loading');
        if (submitBtn) submitBtn.disabled = false;
    }
}

function handleAutoCategorize(desc) {
    if (!desc) return showToast('Isi deskripsi dulu ya', 'error');

    const type = document.querySelector('input[name="type"]:checked')?.value;
    const categories = type === 'Income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

    const lowerDesc = desc.toLowerCase();
    const keywords = {
        'makan': 'Food & Beverage', 'kopi': 'Food & Beverage', 'nasgor': 'Food & Beverage',
        'nasi': 'Food & Beverage', 'soto': 'Food & Beverage', 'gorengan': 'Food & Beverage',
        'martabak': 'Food & Beverage', 'ayam': 'Food & Beverage', 'sushi': 'Food & Beverage',
        'pizza': 'Food & Beverage', 'teknik': 'Bills & Utilities', 'listrik': 'Bills & Utilities',
        'air': 'Bills & Utilities', 'internet': 'Bills & Utilities', 'pulsa': 'Bills & Utilities',
        'obat': 'Health & Medical', 'dokter': 'Health & Medical', 'rs': 'Health & Medical',
        'apotek': 'Health & Medical', 'belanja': 'Shopping', 'tokopedia': 'Shopping',
        'shopee': 'Shopping', 'buku': 'Education', 'kursus': 'Education',
        'gaji': 'Sponsorship & Brand Deals', 'freelance': 'Freelance Services',
        'investasi': 'Savings & Investment', 'nabung': 'Savings & Investment',
    };

    let matched = null;
    for (const [keyword, category] of Object.entries(keywords)) {
        if (lowerDesc.includes(keyword)) {
            matched = category;
            break;
        }
    }

    if (matched) {
        const radio = document.querySelector(`input[name="category"][value="${matched}"]`);
        if (radio) {
            radio.checked = true;
            showToast(`Kategori: ${matched}`, 'success');
        }
    } else {
        showToast('Tidak menemukan kategori otomatis', 'error');
    }
}
