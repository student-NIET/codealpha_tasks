/* ═══════════════════════════════════════════════════════════════════════════════
   api.js — Centralised fetch helpers & shared utilities
   ═══════════════════════════════════════════════════════════════════════════════ */

const API = '/api';

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getToken()    { return localStorage.getItem('pulse_token'); }
function getUser()     { return JSON.parse(localStorage.getItem('pulse_user') || 'null'); }
function setAuth(token, user) {
  localStorage.setItem('pulse_token', token);
  localStorage.setItem('pulse_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('pulse_token');
  localStorage.removeItem('pulse_user');
}

function requireAuth() {
  if (!getToken()) { window.location.href = '/'; return false; }
  return true;
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ─── Toast notification ───────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: '💬' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Avatar helper ────────────────────────────────────────────────────────────
function makeAvatar(el, username, color) {
  el.textContent = (username || '?')[0].toUpperCase();
  el.style.background = color || '#7c3aed';
}

// ─── Time formatter ───────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s  = Math.floor(diff / 1000);
  const m  = Math.floor(s / 60);
  const h  = Math.floor(m / 60);
  const d  = Math.floor(h / 24);
  if (s < 60)  return 'just now';
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function handleLogout() {
  clearAuth();
  window.location.href = '/';
}

// ─── Navigate to profile ──────────────────────────────────────────────────────
function goToProfile(userId) {
  window.location.href = `/profile.html?id=${userId}`;
}
function goToMyProfile() {
  const user = getUser();
  if (user) goToProfile(user.id);
}
