const UI = {
    history: JSON.parse(localStorage.getItem('j_hist') || '[]'),
    activeMode: new URLSearchParams(window.location.search).get('mode') || 'stress',
    ip: localStorage.getItem('j_ip') || '192.168.4.1',
    timer: null,
    timeRemaining: 600
};

// --- Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('t-body')) initTherapy();
    if (document.getElementById('history-container')) initDashboard();
});

// --- Dashboard Logic ---
function initDashboard() {
    const histEl = document.getElementById('history-container');
    const ipInp = document.getElementById('ip-addr');
    ipInp.value = UI.ip;
    ipInp.onchange = () => localStorage.setItem('j_ip', ipInp.value);

    // Render History
    histEl.innerHTML = UI.history.slice(0, 10).map(h => `
        <div class="history-item">
            <div><b>${h.mode.toUpperCase()}</b><br><span>${h.date}</span></div>
            <div style="text-align:right">Pain: ${h.pain}/10<br><span>${h.int}% Intensity</span></div>
        </div>
    `).join('') || '<p style="opacity:0.5; text-align:center; padding-top:20px;">No sessions yet.</p>';

    // Chart.js Progress
    const ctx = document.getElementById('painChart').getContext('2d');
    const chartData = UI.history.slice(0, 7).reverse();
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(h => h.date.split(',')[0]),
            datasets: [{ label: 'Pain Trend', data: chartData.map(h => h.pain), borderColor: '#0ea5e9', tension: 0.4, fill: true, backgroundColor:'rgba(14, 165, 233, 0.1)' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 10 } } }
    });
}

// --- Therapy Logic ---
function initTherapy() {
    document.body.className = `theme-${UI.activeMode}`;
    document.getElementById('m-title').innerText = UI.activeMode.toUpperCase() + ' SESSION';

    const slider = document.getElementById('int-slider');
    slider.oninput = (e) => {
        document.getElementById('int-label').innerText = e.target.value + '%';
        // fetch(`http://${UI.ip}/intensity?v=${e.target.value}`, {mode:'no-cors'});
    };

    document.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
            document.querySelector('.chip.active').classList.remove('active');
            chip.classList.add('active');
            UI.timeRemaining = parseInt(chip.dataset.s);
            document.getElementById('timer-txt').innerText = formatTime(UI.timeRemaining);
        };
    });

    document.getElementById('start-btn').onclick = startSession;
    document.getElementById('stop-btn').onclick = stopSession;
}

function startSession() {
    document.getElementById('the-orb').classList.add('pulsing');
    document.getElementById('start-btn').innerText = "SESSION IN PROGRESS";
    document.getElementById('start-btn').disabled = true;

    // fetch(`http://${UI.ip}/start?mode=${UI.activeMode}`, {mode:'no-cors'});

    const total = UI.timeRemaining;
    UI.timer = setInterval(() => {
        UI.timeRemaining--;
        document.getElementById('timer-txt').innerText = formatTime(UI.timeRemaining);
        
        // Circular Progress Math
        const offset = 880 - ((total - UI.timeRemaining) / total * 880);
        document.getElementById('progress-bar').style.strokeDashoffset = offset;

        if (UI.timeRemaining <= 0) stopSession();
    }, 1000);
}

function stopSession() {
    clearInterval(UI.timer);
    document.getElementById('the-orb').classList.remove('pulsing');
    document.getElementById('start-btn').innerText = "BEGIN THERAPY";
    document.getElementById('start-btn').disabled = false;

    // Save Data
    const session = {
        mode: UI.activeMode,
        date: new Date().toLocaleString(),
        pain: document.getElementById('pain-inp').value,
        int: document.getElementById('int-slider').value
    };
    UI.history.unshift(session);
    localStorage.setItem('j_hist', JSON.stringify(UI.history));

    // fetch(`http://${UI.ip}/stop`, {mode:'no-cors'});
    alert("Session data saved successfully!");
}

function formatTime(s) {
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
}

const allowedModes = ['stress', 'sleep', 'back', 'neck', 'relax'];

if (!allowedModes.includes(UI.activeMode)) {
    UI.activeMode = 'stress';
}
