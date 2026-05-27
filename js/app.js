// 1. CONFIGURATION
const routineData = [
    { id: 'r1', time: '07:00 AM', title: 'Hydration + Sunlight' },
    { id: 'r2', time: '08:00 AM', title: 'Cold Shower / Skincare' },
    { id: 'r3', time: '09:00 AM', title: 'Deep Work / Study' },
    { id: 'r4', time: '12:00 PM', title: 'Nutrition / Lunch' },
    { id: 'r5', time: '01:00 PM', title: 'Ice Face / Jaw Training' },
    { id: 'r6', time: '05:00 PM', title: 'Training / Exercise' },
    { id: 'r7', time: '10:00 PM', title: 'Study / Night Routine' },
    { id: 'r8', time: '11:00 PM', title: 'Sleep / No Screens' }
];

// XP CONFIG
const XP_PER_TASK = 25;
const XP_BONUS_STREAK = 10;

// LEVEL TITLES
const levelTitles = {
    1: "BEGINNER",
    5: "DISCIPLINED",
    10: "WARRIOR",
    15: "ALPHA",
    20: "KING",
    30: "LEGEND",
    40: "GODMODE",
    50: "ASCENDED"
};

// START DATE - First time using app (ADD THIS)
if (!localStorage.getItem('asc_start_date')) {
    localStorage.setItem('asc_start_date', new Date().toDateString());
}

const startDate = new Date(localStorage.getItem('asc_start_date'));

function getDaysActive() {
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1; // Minimum 1 day
}

function getStartDateFormatted() {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return startDate.toLocaleDateString('en-US', options);
}

// 2. STATE MANAGEMENT
let state = {
    completed: [],
    water: 0,
    date: new Date().toDateString(),
    xp: parseInt(localStorage.getItem('asc_xp') || '0'),
    level: parseInt(localStorage.getItem('asc_level') || '1'),
    streak: parseInt(localStorage.getItem('asc_streak') || '0'),
    lastCompleteDate: localStorage.getItem('asc_last_complete') || null
};

const savedDate = localStorage.getItem('asc_date');
const today = new Date().toDateString();

if (savedDate !== today) {
    localStorage.setItem('asc_date', today);
    localStorage.setItem('asc_completed', JSON.stringify([]));
    localStorage.setItem('asc_water', '0');
} else {
    state.completed = JSON.parse(localStorage.getItem('asc_completed') || '[]');
    state.water = parseInt(localStorage.getItem('asc_water') || '0');
}

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    state.xp = parseInt(localStorage.getItem('asc_xp') || '0');
    state.level = parseInt(localStorage.getItem('asc_level') || '1');
    state.streak = parseInt(localStorage.getItem('asc_streak') || '0');
    
    initDate();
    renderRoutine();
    updateStats();
});

// 4. FUNCTIONS

function initDate() {
    const dateEl = document.getElementById('dynamic-date');
    if(dateEl) {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateEl.innerText = new Date().toLocaleDateString('en-US', options);
    }
}

function renderRoutine() {
    const container = document.getElementById('routine-container');
    if (!container) return;

    container.innerHTML = '';

    routineData.forEach(item => {
        const isChecked = state.completed.includes(item.id);
        
        const div = document.createElement('div');
        div.className = 'routine-item glass-card p-4 rounded-xl flex items-center justify-between border border-white/5';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-slate-500 font-mono text-sm w-16">${item.time}</div>
                <div class="text-slate-200 font-medium ${isChecked ? 'line-through opacity-50' : ''}">${item.title}</div>
            </div>
            <input type="checkbox" class="routine-checkbox" 
                id="${item.id}" ${isChecked ? 'checked' : ''} 
                onchange="toggleTask('${item.id}')">
        `;
        container.appendChild(div);
    });
}

function toggleTask(id) {
    const checkbox = document.getElementById(id);
    const wasCompleted = state.completed.includes(id);
    
    if (wasCompleted) {
        state.completed = state.completed.filter(item => item !== id);
        checkbox.checked = false;
    } else {
        state.completed.push(id);
        checkbox.checked = true;
        addXP(XP_PER_TASK);
    }
    
    checkStreak();
    saveData();
    renderRoutine();
    updateStats();
}

function addXP(amount) {
    state.xp += amount;
    localStorage.setItem('asc_xp', state.xp);
    calculateLevel();
}

function calculateLevel() {
    const xpNeeded = state.level * 100;
    
    if (state.xp >= xpNeeded) {
        state.level++;
        state.xp = state.xp - xpNeeded;
        localStorage.setItem('asc_level', state.level);
        localStorage.setItem('asc_xp', state.xp);
    }
    
    updateStats();
}

function getLevelTitle(level) {
    let title = "BEGINNER";
    for (const [lvl, titleName] of Object.entries(levelTitles)) {
        if (level >= parseInt(lvl)) {
            title = titleName;
        }
    }
    return title;
}

function checkStreak() {
    const percent = Math.round((state.completed.length / routineData.length) * 100);
    const today = new Date().toDateString();
    
    if (percent === 100 && state.lastCompleteDate !== today) {
        state.streak++;
        state.lastCompleteDate = today;
        
        const streakBonus = state.streak * XP_BONUS_STREAK;
        addXP(streakBonus);
        
        localStorage.setItem('asc_streak', state.streak);
        localStorage.setItem('asc_last_complete', today);
    }
}

function updateWater(amount) {
    state.water += amount;
    if (state.water < 0) state.water = 0;
    if (state.water > 12) state.water = 12;
    
    saveData();
    updateStats();
}

function updateStats() {
    const total = routineData.length;
    const current = state.completed.length;
    const percent = Math.round((current / total) * 100);
    const xpNeeded = state.level * 100;
    
    // Dashboard Elements
    const dashComp = document.getElementById('dash-completion');
    const dashBar = document.getElementById('dash-progress-bar');
    const dashWater = document.getElementById('dash-water');
    const streak = document.getElementById('streak-count');
    const waterCount = document.getElementById('water-count');
    const ringP = document.getElementById('ring-percent');
    const ringBar = document.getElementById('ring-progress');
    
    // Level Badge Elements
    const levelEl = document.getElementById('user-level');
    const xpEl = document.getElementById('user-xp');
    const titleEl = document.getElementById('user-title');
    
    // Journey Elements
    const daysActiveEl = document.getElementById('days-active');
    const startDateEl = document.getElementById('start-date');

    // Mobile Progress Bar
    const mobileBar = document.getElementById('mobile-progress-bar-mobile');
    const mobilePercent = document.getElementById('ring-percent-mobile');
    
    if (mobileBar) mobileBar.style.width = `${percent}%`;
    if (mobilePercent) mobilePercent.innerText = `${percent}%`;

    if (dashComp) dashComp.innerText = `${percent}%`;
    if (dashBar) dashBar.style.width = `${percent}%`;
    if (dashWater) dashWater.innerText = state.water;
    if (streak) streak.innerText = state.streak;
    if (waterCount) waterCount.innerText = state.water;
    
    if (ringP && ringBar) {
        ringP.innerText = `${percent}%`;
        const offset = 251.2 - (251.2 * percent / 100);
        ringBar.style.strokeDashoffset = offset;
    }
    
    if (levelEl) levelEl.innerText = state.level;
    if (xpEl) xpEl.innerText = `${state.xp}/${xpNeeded}`;
    if (titleEl) titleEl.innerText = getLevelTitle(state.level);
    
    if (daysActiveEl) daysActiveEl.innerText = getDaysActive();
    if (startDateEl) startDateEl.innerText = getStartDateFormatted();
}

function resetDay() {
    const modal = document.getElementById('reset-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    const cancelBtn = document.getElementById('cancel-reset');
    const confirmBtn = document.getElementById('confirm-reset');

    cancelBtn.onclick = () => {
        modal.classList.add('hidden');
    };

    confirmBtn.onclick = () => {
        executeReset();
        modal.classList.add('hidden');
    };
}

function saveData() {
    localStorage.setItem('asc_completed', JSON.stringify(state.completed));
    localStorage.setItem('asc_water', state.water);
}

function executeReset() {
    state.completed = [];
    state.water = 0;

    saveData();
    renderRoutine();
    updateStats();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar || !overlay) return;
    
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}
