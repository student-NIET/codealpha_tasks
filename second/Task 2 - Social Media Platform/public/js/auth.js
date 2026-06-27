/* ═══════════════════════════════════════════════════════════════════════════════
   auth.js — Login / Register page logic
   ═══════════════════════════════════════════════════════════════════════════════ */

// Redirect if already logged in
if (getToken()) window.location.href = '/feed.html';

// ─── Tab Switch ───────────────────────────────────────────────────────────────
function switchTab(tab) {
  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin     = document.getElementById('tab-login');
  const tabRegister  = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:.7">Signing in…</span>';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    setAuth(data.token, data.user);
    showToast(`Welcome back, @${data.user.username}! 🎉`, 'success');
    setTimeout(() => { window.location.href = '/feed.html'; }, 600);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span>';
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (username.length < 3) { showToast('Username must be at least 3 characters', 'error'); return; }
  if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:.7">Creating account…</span>';

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    setAuth(data.token, data.user);
    showToast(`Account created! Welcome, @${data.user.username} 🎉`, 'success');
    setTimeout(() => { window.location.href = '/feed.html'; }, 600);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<span>Create Account</span>';
  }
}
