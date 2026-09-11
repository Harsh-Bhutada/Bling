/**
 * 💎 BLING BOUTIQUE — SUPABASE CLIENT & AUTH GATEWAY
 * Manages Cloud Database Connection, 7-Day Persistent Session, and Supabase Security Gateway
 */

(function () {
  const SESSION_KEY = 'bling_admin_auth_session_v1';
  const SESSION_TIMESTAMP_KEY = 'bling_admin_auth_time_v1';
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const BlingSupabase = {
    client: null,
    isConfigured: false,

    /**
     * Initializes Supabase client using in-browser stored credentials or window.BLING_SUPABASE_CONFIG
     */
    init() {
      // 1. Check in-browser stored credentials first, fallback to default project credentials
      let url = localStorage.getItem('bling_supabase_url') || 'https://tclpvzkwpkvddaxfhxmg.supabase.co';
      let anonKey = localStorage.getItem('bling_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbHB2emt3cGt2ZGRheGZoeG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDQxMTQsImV4cCI6MjEwNDcyMDExNH0.lI2yT7MRFGLwzi6WYZ_1aQLTmSzhtaEJtV-T2oPUKL0';

      // 2. Fall back to window.BLING_SUPABASE_CONFIG if available
      if ((!url || !anonKey) && window.BLING_SUPABASE_CONFIG) {
        url = window.BLING_SUPABASE_CONFIG.url || '';
        anonKey = window.BLING_SUPABASE_CONFIG.anonKey || '';
      }

      url = url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
      anonKey = anonKey.trim();

      if (url && anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          this.client = window.supabase.createClient(url, anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              storageKey: 'bling_supabase_auth_token'
            }
          });
          this.isConfigured = true;
          console.log('💎 Supabase Cloud connected successfully.');
        } catch (e) {
          console.warn('⚠️ Could not initialize Supabase client:', e);
          this.isConfigured = false;
        }
      } else {
        this.isConfigured = false;
      }

      return this.client;
    },

    /**
     * Get active Supabase client instance
     */
    getClient() {
      if (!this.client) this.init();
      return this.client;
    },

    /**
     * Save credentials from the Admin UI
     */
    saveCredentials(url, key) {
      if (url && key) {
        const cleanedUrl = url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
        localStorage.setItem('bling_supabase_url', cleanedUrl);
        localStorage.setItem('bling_supabase_anon_key', key.trim());
        return this.init();
      }
      return null;
    },

    /**
     * Clear custom credentials
     */
    clearCredentials() {
      localStorage.removeItem('bling_supabase_url');
      localStorage.removeItem('bling_supabase_anon_key');
      this.client = null;
      this.isConfigured = false;
    }
  };

  /**
   * 7-Day Persistent Session & Supabase Authentication Gateway
   */
  const BlingAuth = {
    /**
     * Check if client has an active, valid session within the 7-day lifespan
     */
    isAuthenticated() {
      try {
        const session = localStorage.getItem(SESSION_KEY);
        const timestamp = parseInt(localStorage.getItem(SESSION_TIMESTAMP_KEY) || '0', 10);

        if (!session || !timestamp) return false;

        const now = Date.now();
        const elapsed = now - timestamp;

        // Check 7-day expiration
        if (elapsed > SEVEN_DAYS_MS) {
          console.warn('🔒 Bling Admin 7-day session expired. Re-login required.');
          this.logout();
          return false;
        }

        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Asynchronously verifies active Supabase session
     */
    async checkSession() {
      const client = BlingSupabase.getClient();
      if (client && client.auth) {
        try {
          const { data } = await client.auth.getSession();
          if (data && data.session) {
            localStorage.setItem('bling_admin_user_email', data.session.user?.email || 'admin');
            this._setSession('supabase_auth_' + (data.session.user?.id || 'admin'));
            return true;
          }
        } catch (e) {
          console.warn('Session check fallback:', e);
        }
      }
      return this.isAuthenticated();
    },

    /**
     * Get remaining days in current session
     */
    getSessionRemainingDays() {
      const timestamp = parseInt(localStorage.getItem(SESSION_TIMESTAMP_KEY) || '0', 10);
      if (!timestamp) return 0;
      const remainingMs = Math.max(0, SEVEN_DAYS_MS - (Date.now() - timestamp));
      return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    },

    /**
     * Get the logged in admin user email
     */
    getUserEmail() {
      return localStorage.getItem('bling_admin_user_email') || 'poonam@blingfashion.in';
    },

    /**
     * Login using Supabase Auth (Email + Password)
     */
    async loginWithEmailPassword(email, password) {
      const client = BlingSupabase.getClient();
      if (client) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('bling_admin_user_email', data.user?.email || email);
        this._setSession('supabase_auth_' + (data.user?.id || 'admin'));
        return { success: true, user: data.user };
      } else {
        // Local mode fallback authentication: verify client admin email
        if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('poonam')) {
          localStorage.setItem('bling_admin_user_email', email);
          this._setSession('local_admin_' + Date.now());
          return { success: true, user: { email } };
        }
        throw new Error('Invalid credentials');
      }
    },

    /**
     * Logout and destroy active 7-day session
     */
    async logout() {
      try {
        const client = BlingSupabase.getClient();
        if (client) {
          await client.auth.signOut();
        }
      } catch (e) {}
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
      localStorage.removeItem('bling_admin_user_email');
      window.dispatchEvent(new CustomEvent('bling:auth-changed', { detail: { authenticated: false } }));
    },

    _setSession(token) {
      localStorage.setItem(SESSION_KEY, token);
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      window.dispatchEvent(new CustomEvent('bling:auth-changed', { detail: { authenticated: true } }));
    }
  };

  // Expose globally
  window.BlingSupabase = BlingSupabase;
  window.BlingAuth = BlingAuth;
})();
