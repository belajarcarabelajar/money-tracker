// Backup section component

import { backupApi } from '../api.js';
import { showToast } from './toast.js';

export function initBackup() {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    exportBtn?.addEventListener('click', handleExport);
    importBtn?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', handleImportFileChange);
}

async function handleExport() {
    try {
        await backupApi.export();
        showToast('Data berhasil diekspor!', 'success');
    } catch (error) {
        showToast('Gagal ekspor: ' + error.message, 'error');
    }
}

async function handleImportFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importedData = JSON.parse(event.target.result);

            if (!Array.isArray(importedData)) {
                throw new Error('Format file salah');
            }

            const validItems = importedData.filter(item =>
                item.amount && item.description && item.category && item.type && item.date
            );

            if (validItems.length === 0) {
                throw new Error('Tidak ada data valid');
            }

            const isReplaceMode = confirm(
                `Ditemukan ${validItems.length} transaksi.\n\n[OK] = GANTI SEMUA\n[Cancel] = GABUNGKAN`
            );

            await backupApi.import(validItems, isReplaceMode ? 'replace' : 'merge');
            showToast(`Berhasil impor ${validItems.length} transaksi`, 'success');
            // Notify app.js to reload data
            window.dispatchEvent(new CustomEvent('data-imported'));
        } catch (err) {
            showToast('Gagal impor: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
