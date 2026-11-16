// public/js/auth.js — Operator Authentication & Access Control
// Strictly restricts access to Hunter & Ayush (hunter@potioncast.com, ayush@potioncast.com)

const ADMIN_ALLOWLIST = [
  'hunter@potioncast.com',
  'ayush@potioncast.com',
  'veks9@users.noreply.github.com'
];

window.OperatorAuth = {
  // Check if we are in mock or dev bypass mode
  isBypassMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('mock') || urlParams.has('dev') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  },

  getCurrentUser() {
    if (this.isBypassMode()) {
      return {
        email: 'hunter@potioncast.com',
        name: 'Hunter Dyess (Dev Mode)',
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

  signInWithGoogle() {
    // If Supabase client is configured, trigger OAuth flow
    if (window.supabaseClient) {
      window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      return;
    }
    // Fallback prompt for local dev testing
    const email = prompt('Enter your admin email (hunter@potioncast.com or ayush@potioncast.com):');
    if (email && ADMIN_ALLOWLIST.includes(email.trim().toLowerCase())) {
      const user = {
        email: email.trim().toLowerCase(),
        name: email.split('@')[0],
        avatar: `https://avatar.vercel.sh/${email.split('@')[0]}`
      };
      localStorage.setItem('potioncast_admin_session', JSON.stringify(user));
      window.location.reload();
    } else if (email) {
      alert('Access Denied: Restricted strictly to Potioncast Operator Administrators.');
    }
  },

  signOut() {
    localStorage.removeItem('potioncast_admin_session');
    if (window.supabaseClient) {
      window.supabaseClient.auth.signOut();
    }
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
        userEmailSpan.textContent = user.email;
      }
    } else {
      if (lockScreen) lockScreen.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
    }
  }
};
