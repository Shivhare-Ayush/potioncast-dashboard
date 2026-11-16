// public/js/auth.js — Operator Authentication & Access Control
// Strictly restricts access to Hunter & Ayush (hunter@potioncast.com, ayush@potioncast.com)

const ADMIN_ALLOWLIST = [
  'hunter@potioncast.com',
  'ayush@potioncast.com',
  'huntermdyess@gmail.com',
  'veks9@users.noreply.github.com'
];

window.OperatorAuth = {
  // Check if we are in mock or dev bypass mode
  isBypassMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('mock') || urlParams.has('dev');
  },

  getCurrentUser() {
    if (this.isBypassMode()) {
      return {
        email: 'hunter@potioncast.com',
        name: 'Hunter Dyess (Bypass Mode)',
        avatar: 'https://avatar.vercel.sh/hunter'
      };
    }
    const sessionStr = localStorage.getItem('potioncast_admin_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && ADMIN_ALLOWLIST.includes(session.email?.toLowerCase())) {
          return session;
        }
      } catch (e) {
        console.error('Failed to parse admin session', e);
      }
    }
    return null;
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  async requestOtp(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      this.showStatus('Please enter your operator email address.', 'error');
      return;
    }
    if (!ADMIN_ALLOWLIST.includes(cleanEmail)) {
      this.showStatus('Access Denied: Only authorized Potioncast operators may access this dashboard.', 'error');
      return;
    }

    this.showStatus('Requesting operator code...', 'info');
    const btn = document.getElementById('btn-send-code');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch('/api/auth-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: cleanEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showStatus(data.error || 'Failed to request code', 'error');
        if (btn) btn.disabled = false;
        return;
      }

      // Step to OTP verification
      window._pendingAuthEmail = cleanEmail;
      document.getElementById('auth-step-email').style.display = 'none';
      document.getElementById('auth-step-otp').style.display = 'block';
      document.getElementById('auth-target-email').textContent = cleanEmail;

      if (data.code) {
        // Auto-fill or show emergency operator code badge
        const otpInput = document.getElementById('operator-otp');
        if (otpInput) {
          otpInput.value = data.code;
          otpInput.focus();
        }
        this.showStatus(`Operator code: <strong>${data.code}</strong>`, 'success');
      } else {
        this.showStatus('Verification code sent to your email inbox.', 'success');
        const otpInput = document.getElementById('operator-otp');
        if (otpInput) otpInput.focus();
      }
    } catch (err) {
      this.showStatus('Network error requesting code: ' + err.message, 'error');
      if (btn) btn.disabled = false;
    }
  },

  async verifyOtp(code) {
    const email = window._pendingAuthEmail;
    const cleanCode = (code || '').trim();
    if (!email || !cleanCode) {
      this.showStatus('Please enter the 6-digit code.', 'error');
      return;
    }

    this.showStatus('Verifying operator credentials...', 'info');
    const btn = document.getElementById('btn-verify-code');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch('/api/auth-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code: cleanCode })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showStatus(data.error || 'Invalid or expired code', 'error');
        if (btn) btn.disabled = false;
        return;
      }

      const user = {
        email: data.user.email,
        name: data.user.name,
        token: data.session?.access_token
      };
      localStorage.setItem('potioncast_admin_session', JSON.stringify(user));
      this.showStatus('Access granted. Entering dashboard...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 250);
    } catch (err) {
      this.showStatus('Verification failed: ' + err.message, 'error');
      if (btn) btn.disabled = false;
    }
  },

  resetStep() {
    window._pendingAuthEmail = null;
    document.getElementById('auth-step-email').style.display = 'block';
    document.getElementById('auth-step-otp').style.display = 'none';
    const statusEl = document.getElementById('auth-status');
    if (statusEl) {
      statusEl.style.display = 'none';
      statusEl.innerHTML = '';
    }
    const btn = document.getElementById('btn-send-code');
    if (btn) btn.disabled = false;
  },

  showStatus(msg, type = 'info') {
    const statusEl = document.getElementById('auth-status');
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.innerHTML = msg;
    statusEl.className = 'auth-status ' + (type === 'error' ? 'auth-error' : type === 'success' ? 'auth-success' : 'auth-info');
  },

  signOut() {
    localStorage.removeItem('potioncast_admin_session');
    window.location.reload();
  },

  init() {
    const lockScreen = document.getElementById('lock-screen');
    const appContainer = document.getElementById('app-container');
    const userEmailSpan = document.getElementById('user-email');

    if (this.isAuthenticated()) {
      if (lockScreen) lockScreen.style.display = 'none';
      if (appContainer) appContainer.style.display = 'block';
      const user = this.getCurrentUser();
      if (userEmailSpan && user) {
        userEmailSpan.innerHTML = `
          <span>${user.email}</span>
          <button class="btn-signout" onclick="window.OperatorAuth.signOut()" title="Sign out of operator dashboard">Sign out</button>
        `;
      }
    } else {
      if (lockScreen) lockScreen.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
    }
  }
};
