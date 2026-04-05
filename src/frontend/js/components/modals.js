// Modals component

import { transactionsApi } from '../api.js';
import { showToast } from './toast.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { loadData } from '../app.js';

export function initModals() {
    const clearBtn = document.getElementById('clear-data-btn');
    const confirmModal = document.getElementById('confirm-modal-overlay');
    const deleteModal = document.getElementById('delete-item-modal-overlay');

    clearBtn?.addEventListener('click', () => confirmModal?.classList.add('visible'));

    // Confirm modal
    document.getElementById('confirm-modal-close-btn')?.addEventListener('click', () => {
        confirmModal?.classList.remove('visible');
    });
    document.getElementById('confirm-no-btn')?.addEventListener('click', () => {
        confirmModal?.classList.remove('visible');
    });
    document.getElementById('confirm-yes-btn')?.addEventListener('click', handleClearAll);

    // Delete item modal
    document.getElementById('delete-item-modal-close-btn')?.addEventListener('click', () => {
        deleteModal?.classList.remove('visible');
    });
    document.getElementById('delete-item-no-btn')?.addEventListener('click', () => {
        deleteModal?.classList.remove('visible');
    });
    document.getElementById('delete-item-yes-btn')?.addEventListener('click', handleDeleteItem);
}

async function handleClearAll() {
    try {
        await transactionsApi.deleteAll();
        showToast('Semua data dihapus', 'success');
        await loadData();
    } catch (error) {
        showToast('Gagal hapus: ' + error.message, 'error');
    }
    document.getElementById('confirm-modal-overlay')?.classList.remove('visible');
}

async function handleDeleteItem() {
    const deleteModal = document.getElementById('delete-item-modal-overlay');
    const itemId = deleteModal?.dataset?.itemId;

    if (itemId) {
        try {
            await transactionsApi.delete(itemId);
            showToast('Transaksi dihapus', 'success');
            await loadData();
        } catch (error) {
            showToast('Gagal hapus: ' + error.message, 'error');
        }
    }
    deleteModal?.classList.remove('visible');
}

export function showDeleteModal(id, desc, amount) {
    const deleteModal = document.getElementById('delete-item-modal-overlay');
    const descEl = document.getElementById('delete-item-desc');

    if (deleteModal && descEl) {
        deleteModal.dataset.itemId = id;
        descEl.textContent = `${desc} (${formatCurrency(amount)})`;
        deleteModal.classList.add('visible');
    }
}
