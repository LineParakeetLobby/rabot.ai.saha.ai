// Game state
const state = {
  balance: 0,
  totalTaps: 0,
  level: 1,
  perTap: 1,
  perSecond: 0,
  upgradeCost: 50,
  boostCost: 200,
  boostActive: false,
  boostMultiplier: 1,
  boostTimer: null,
  progressTarget: 100,
  progressCurrent: 0,
};

// DOM elements
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const progressBar = document.getElementById('progress-bar');
const levelEl = document.getElementById('level');
const statLevelEl = document.getElementById('stat-level');
const tapsEl = document.getElementById('taps');
const perTapEl = document.getElementById('per-tap');
const collectRewardEl = document.getElementById('collect-reward');
const upgradeCostEl = document.getElementById('upgrade-cost');
const boostCostEl = document.getElementById('boost-cost');
const upgradeBtn = document.getElementById('upgrade-btn');
const boostBtn = document.getElementById('boost-btn');
const samovarEl = document.getElementById('samovar');

// Format numbers nicely
function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// Update UI
function render() {
  balanceEl.textContent = formatNum(state.balance);
  incomeEl.textContent = '+' + formatNum(state.perSecond) + ' / sec';
  levelEl.textContent = 'Level ' + state.level;
  statLevelEl.textContent = state.level;
  tapsEl.textContent = formatNum(state.totalTaps);
  perTapEl.textContent = formatNum(state.perTap * state.boostMultiplier);
  collectRewardEl.textContent = '+' + formatNum(state.perTap * state.boostMultiplier);
  upgradeCostEl.textContent = 'Cost: ' + formatNum(state.upgradeCost);
  boostCostEl.textContent = 'Cost: ' + formatNum(state.boostCost);

  upgradeBtn.disabled = state.balance < state.upgradeCost;
  boostBtn.disabled = state.balance < state.boostCost || state.boostActive;

  const pct = Math.min((state.progressCurrent / state.progressTarget) * 100, 100);
  progressBar.style.width = pct + '%';
}

// Floating text effect on tap
function showFloatText(x, y, text) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// Collect tea (tap)
function collect() {
  const earned = state.perTap * state.boostMultiplier;
  state.balance += earned;
  state.totalTaps++;
  state.progressCurrent += earned;

  // Check level up
  if (state.progressCurrent >= state.progressTarget) {
    levelUp();
  }

  render();
}

// Samovar tap handler
samovarEl.addEventListener('click', function (e) {
  collect();

  // Bounce animation
  samovarEl.classList.remove('bounce');
  void samovarEl.offsetWidth; // force reflow
  samovarEl.classList.add('bounce');

  // Float text
  showFloatText(e.clientX - 20, e.clientY - 30, '+' + formatNum(state.perTap * state.boostMultiplier));
});

// Level up
function levelUp() {
  state.level++;
  state.progressCurrent = 0;
  state.progressTarget = Math.floor(state.progressTarget * 1.8);
  state.perSecond += Math.ceil(state.level * 0.5);
  render();
}

// Upgrade
function upgrade() {
  if (state.balance < state.upgradeCost) return;
  state.balance -= state.upgradeCost;
  state.perTap += Math.ceil(state.level * 0.5);
  state.upgradeCost = Math.floor(state.upgradeCost * 1.6);
  render();
}

// Boost
function activateBoost() {
  if (state.balance < state.boostCost || state.boostActive) return;
  state.balance -= state.boostCost;
  state.boostActive = true;
  state.boostMultiplier = 2;
  state.boostCost = Math.floor(state.boostCost * 1.4);

  const btn = document.getElementById('boost-btn');
  let remaining = 10;
  btn.textContent = '🔥 Boost Active — ' + remaining + 's';
  btn.disabled = true;

  state.boostTimer = setInterval(() => {
    remaining--;
    btn.textContent = '🔥 Boost Active — ' + remaining + 's';
    if (remaining <= 0) {
      clearInterval(state.boostTimer);
      state.boostActive = false;
      state.boostMultiplier = 1;
      render();
    }
  }, 1000);

  render();
}

// Passive income tick
setInterval(() => {
  if (state.perSecond > 0) {
    state.balance += state.perSecond * state.boostMultiplier;
    state.progressCurrent += state.perSecond * state.boostMultiplier;
    if (state.progressCurrent >= state.progressTarget) {
      levelUp();
    }
    render();
  }
}, 1000);

// Save / load game state
function saveGame() {
  localStorage.setItem('samovar_save', JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem('samovar_save');
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(state, data);
    // Reset transient state
    state.boostActive = false;
    state.boostMultiplier = 1;
    state.boostTimer = null;
  }
}

// Auto-save every 5 seconds
setInterval(saveGame, 5000);

// Load on start
loadGame();
render();
