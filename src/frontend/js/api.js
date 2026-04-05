import { getUserId } from './store.js';

const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
        const error = new Error(errorData.error?.message || 'Request failed');
        error.category = errorData.error?.category;
        error.status = response.status;
        throw error;
    }

    return response.json();
}

// Transactions API
export const transactionsApi = {
    list: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/transactions${query ? '?' + query : ''}`);
    },

    create: (data) => request('/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    delete: (id) => request(`/transactions/${id}`, {
        method: 'DELETE'
    }),

    deleteAll: () => request('/transactions', {
        method: 'DELETE'
    }),

    balance: () => request('/transactions/balance'),

    stats: (type = 'Expense') => request(`/transactions/stats?type=${type}`)
};

// Backup API
export const backupApi = {
    export: async () => {
        const response = await fetch(`${API_BASE}/backup/export`, {
            headers: { 'x-user-id': getUserId() }
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `money_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    import: (data, mode = 'merge') => request('/backup/import', {
        method: 'POST',
        body: JSON.stringify({ data, mode })
    })
};

// Chat API
export const chatApi = {
    send: (message, image = null) => request('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, image })
    }),

    analyzeImage: (image) => request('/chat/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ image })
    })
};
