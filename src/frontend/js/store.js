// Simple state management
const state = {
    userId: null,
    transactions: [],
    balance: { income: 0, expense: 0, balance: 0 },
    stats: { categories: [], trend: [] },
    currentChartType: 'Expense',
    theme: 'light',
    isLoading: false
};

let listeners = [];

export function getState() {
    return { ...state };
}

export function setState(updates) {
    Object.assign(state, updates);
    listeners.forEach(fn => fn(state));
}

export function subscribe(listener) {
    listeners.push(listener);
    return () => {
        listeners = listeners.filter(fn => fn !== listener);
    };
}

export function getUserId() {
    if (!state.userId) {
        // Try to get from localStorage
        state.userId = localStorage.getItem('moneytracker_user_id');
        if (!state.userId) {
            // Create new simple ID
            state.userId = 'user_' + Math.random().toString(36).substring(2, 10);
            localStorage.setItem('moneytracker_user_id', state.userId);
        }
    }
    return state.userId;
}

export function setUserId(id) {
    state.userId = id;
    localStorage.setItem('moneytracker_user_id', id);
}
