// public/js/auth.js — Operator Authentication & Access Control
// Strictly restricts access to Hunter & Ayush (hunter@potioncast.com, ayush@potioncast.com)
// Uses genuine Supabase email OTP auth matching potioncast-web.

const ADMIN_ALLOWLIST = [
  'hunter@potioncast.com',
  'ayush@potioncast.com',
  'huntermdyess@gmail.com',
  'veks9389@gmail.com',
  'veks9@users.noreply.github.com'
];

window.OperatorAuth = {
  isBypassMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('mock') || urlParams.has('dev');
  },

  async getCurrentUser() {
    if (this.isBypassMode()) {
      return {
        email: 'hunter@potioncast.com',
        name: 'Hunter Dyess (Bypass Mode)'
      };
    }
    // Check Supabase session
    if (window.supabase && window.supabase.auth) {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session && session.user && ADMIN_ALLOWLIST.includes(session.user.email?.toLowerCase())) {
          return {
            email: session.user.email,
            name: session.user.user_metadata?.display_name || session.user.email.split('@')[0]
          };
        }
      } catch (e) {
        console.error('Error fetching Supabase session:', e);
      }
    }
    // Check cached localStorage session fallback
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

    this.showStatus('Sending verification code to your email...', 'info');
    const btn = document.getElementById('btn-send-code');
    if (btn) btn.disabled = true;

    try {
      if (!window.supabase || !window.supabase.auth) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await window.supabase.auth.signInWithOtp({
        email: cleanEmail
      });

      if (error) {
        this.showStatus('Could not send code: ' + error.message, 'error');
        if (btn) btn.disabled = false;
        return;
      }

      // Step to OTP verification — Code is in user's email inbox ONLY!
      window._pendingAuthEmail = cleanEmail;
      document.getElementById('auth-step-email').style.display = 'none';
      document.getElementById('auth-step-otp').style.display = 'block';
      document.getElementById('auth-target-email').textContent = cleanEmail;
      this.showStatus('Check your inbox! We sent a 6-digit verification code to <strong>' + cleanEmail + '</strong>.', 'success');

      const otpInput = document.getElementById('operator-otp');
      if (otpInput) {
        otpInput.value = '';
        otpInput.focus();
      }
    } catch (err) {
      this.showStatus('Failed to send code: ' + err.message, 'error');
      if (btn) btn.disabled = false;
    }
  },

  async verifyOtp(code) {
    const email = window._pendingAuthEmail;
    const cleanCode = (code || '').trim();
    if (!email || !cleanCode) {
      this.showStatus('Please enter the 6-digit code from your email.', 'error');
      return;
    }

    this.showStatus('Verifying operator code...', 'info');
    const btn = document.getElementById('btn-verify-code');
    if (btn) btn.disabled = true;

    try {
      if (!window.supabase || !window.supabase.auth) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await window.supabase.auth.verifyOtp({
        email: email,
        token: cleanCode,
        type: 'email'
      });

      if (error) {
        this.showStatus('Verification failed: ' + error.message, 'error');
        if (btn) btn.disabled = false;
        return;
      }

      const user = data && data.user;
      if (!user || !ADMIN_ALLOWLIST.includes(user.email?.toLowerCase())) {
        this.showStatus('Access Denied: Operator account not permitted.', 'error');
        if (btn) btn.disabled = false;
        return;
      }

      const sessionObj = {
        email: user.email,
        name: user.user_metadata?.display_name || user.email.split('@')[0],
        token: data.session?.access_token
      };
      localStorage.setItem('potioncast_admin_session', JSON.stringify(sessionObj));
      this.showStatus('Access granted. Entering dashboard...', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 250);
    } catch (err) {
      this.showStatus('Verification error: ' + err.message, 'error');
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

  async signOut() {
    localStorage.removeItem('potioncast_admin_session');
    if (window.supabase && window.supabase.auth) {
      try {
        await window.supabase.auth.signOut();
      } catch (e) {}
    }
    window.location.reload();
  },

  async init() {
    const lockScreen = document.getElementById('lock-screen');
    const appContainer = document.getElementById('app-container');
    const userEmailSpan = document.getElementById('user-email');

    const user = await this.getCurrentUser();

    if (user) {
      if (lockScreen) lockScreen.style.display = 'none';
      if (appContainer) appContainer.style.display = 'block';
      if (userEmailSpan) {
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
