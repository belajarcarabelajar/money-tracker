// Header component - clock and connection status

export function initHeader() {
    const clockElement = document.getElementById('real-time-clock');

    // Update clock immediately
    updateClock(clockElement);

    // Update every second
    setInterval(() => {
        updateClock(clockElement);
    }, 1000);
}

function updateClock(clockElement) {
    if (!clockElement) return;
    const now = new Date();
    clockElement.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }) + ' - ' + now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    }).replace('.', ':');
}

export function updateConnectionStatus(status) {
    const statusText = document.getElementById('status-text');
    const statusDot = document.querySelector('.status-dot');

    if (!statusText || !statusDot) return;

    if (status === 'connected') {
        statusText.textContent = 'Terhubung (Server)';
        statusDot.classList.remove('connecting');
        statusDot.classList.add('connected');
    } else {
        statusText.textContent = 'Menghubungkan...';
        statusDot.classList.add('connecting');
        statusDot.classList.remove('connected');
    }
}
