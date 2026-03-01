// assets/app.js
(function () {
  const CFG = window.APP_CONFIG || {};
  const SUPABASE_URL = CFG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CFG.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Missing APP_CONFIG. Please set assets/config.js");
  }

  // ===== Utils =====
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ===== Language (simple) =====
  const LANG_KEY = "xatu_lang";
  function getLang() { return localStorage.getItem(LANG_KEY) || "zh"; }
  function setLang(v){ localStorage.setItem(LANG_KEY, v); location.reload(); }
  window.XATU_LANG = { getLang, setLang };

  // ===== Minimal Supabase REST client (no external lib needed) =====
  async function sbFetch(path, { method="GET", body, headers={} } = {}) {
    const url = SUPABASE_URL.replace(/\/$/, "") + path;
    const h = {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...headers
    };
    const res = await fetch(url, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = typeof data === "string" ? data : (data?.message || res.statusText);
      throw new Error(msg);
    }
    return data;
  }

  // ===== Auth via Supabase Auth REST =====
  // We use email+password ONLY (no anonymous)
  const SESSION_KEY = "xatu_session_v1";

  function saveSession(sess){ localStorage.setItem(SESSION_KEY, JSON.stringify(sess)); }
  function loadSession(){
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
  }
  function clearSession(){ localStorage.removeItem(SESSION_KEY); }

  // Parse tokens from URL after email verify redirect
  function readUrlTokens() {
    const h = location.hash || "";
    const sp = new URLSearchParams(h.startsWith("#") ? h.slice(1) : h);
    const qp = new URLSearchParams(location.search);

    // Common cases:
    // #access_token=...&refresh_token=...&expires_in=...&token_type=bearer&type=signup
    // or ?code=... (PKCE) ——这里我们做兼容兜底
    const access_token = sp.get("access_token");
    const refresh_token = sp.get("refresh_token");
    const expires_in = sp.get("expires_in");
    const token_type = sp.get("token_type");

    const code = qp.get("code"); // PKCE style
    const type = sp.get("type") || qp.get("type");

    return { access_token, refresh_token, expires_in, token_type, code, type };
  }

  async function setSessionFromUrlIfPresent() {
    const t = readUrlTokens();
    if (t.access_token && t.refresh_token) {
      // Save tokens as session
      const expiresAt = Date.now() + (Number(t.expires_in || 3600) * 1000);
      saveSession({
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        token_type: t.token_type || "bearer",
        expires_at: expiresAt
      });
      // Clean URL (avoid repeated parsing)
      history.replaceState({}, document.title, location.pathname);
      return true;
    }

    // If PKCE code exists, we can try exchangeCodeForSession endpoint
    if (t.code) {
      // Supabase has /auth/v1/token?grant_type=pkce
      // But needs code_verifier which is stored by supabase-js normally.
      // Since we are not using supabase-js here, we cannot exchange PKCE safely.
      // ✅ 兜底：如果你后台邮件模板用的是 “token hash verify” + redirect，这里一般是 hash token，不会走 pkce。
      // 所以我们提示用户升级模板或用 hash token 模式。
      console.warn("PKCE code found. This setup expects hash tokens. Please use default email verify redirect.");
    }
    return false;
  }

  async function authSignUp(email, password, profile = {}) {
    // /auth/v1/signup
    // redirect_to must be allowed in Supabase Redirect URLs
    const redirect_to = location.origin; // back to site root
    const data = await sbFetch(`/auth/v1/signup`, {
      method: "POST",
      headers: { "X-Client-Info": "xatu-static" },
      body: {
        email,
        password,
        data: profile,
        options: { emailRedirectTo: redirect_to }
      }
    });
    return data;
  }

  async function authSignIn(email, password) {
    // /auth/v1/token?grant_type=password
    const data = await sbFetch(`/auth/v1/token?grant_type=password`, {
      method: "POST",
      body: { email, password }
    });
    // data: {access_token, refresh_token, expires_in, token_type, user}
    const expiresAt = Date.now() + (Number(data.expires_in || 3600) * 1000);
    saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || "bearer",
      expires_at: expiresAt,
      user: data.user
    });
    return data;
  }

  async function authGetUser() {
    const sess = loadSession();
    if (!sess?.access_token) return null;
    try{
      const user = await sbFetch(`/auth/v1/user`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${sess.access_token}` }
      });
      return user;
    }catch(e){
      console.warn("authGetUser failed:", e.message);
      return null;
    }
  }

  async function authSignOut() {
    const sess = loadSession();
    try{
      if (sess?.access_token) {
        await sbFetch(`/auth/v1/logout`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${sess.access_token}` },
          body: {}
        });
      }
    }catch(e){
      // ignore
    }
    clearSession();
  }

  // ===== Favorites =====
  const FAV_KEY = "xatu_favorites_v1";
  function loadFavs(){
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
  }
  function saveFavs(list){ localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
  function isFav(id){ return loadFavs().includes(id); }
  function toggleFav(id){
    const list = loadFavs();
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1); else list.unshift(id);
    saveFavs(list);
    return list;
  }

  // ===== Listings (table: listings) =====
  async function fetchListings({ limit=50, keyword="", campus="全部", rentType="全部", bathType="全部", subway="全部" } = {}) {
    // Basic filter with ilike
    // Requires your table "listings" and RLS allowing anon select (or public policy)
    let url = `/rest/v1/listings?select=*&order=created_at.desc&limit=${encodeURIComponent(limit)}`;

    // keyword search across title/location/desc
    const filters = [];
    if (keyword.trim()) {
      const k = keyword.trim().replace(/[%_]/g, "\\$&");
      // or=(title.ilike.*k*,location.ilike.*k*,desc.ilike.*k*)
      filters.push(`or=(title.ilike.*${k}*,location.ilike.*${k}*,description.ilike.*${k}*)`);
    }
    if (campus !== "全部") filters.push(`campus=eq.${encodeURIComponent(campus)}`);
    if (rentType !== "全部") filters.push(`rent_type=eq.${encodeURIComponent(rentType)}`);
    if (bathType !== "全部") filters.push(`bath_type=eq.${encodeURIComponent(bathType)}`);
    if (subway !== "全部") filters.push(`subway=eq.${encodeURIComponent(subway)}`);

    if (filters.length) url += `&${filters.join("&")}`;
    return await sbFetch(url);
  }

  async function createListing(payload) {
    // Requires insert policy
    return await sbFetch(`/rest/v1/listings`, {
      method:"POST",
      headers:{ "Prefer":"return=representation" },
      body: payload
    });
  }

  async function createSupportTicket(payload) {
    // Table: reports (or support)
    // I use "reports" as you screenshot earlier mentioned.
    return await sbFetch(`/rest/v1/reports`, {
      method:"POST",
      headers:{ "Prefer":"return=representation" },
      body: payload
    });
  }

  // ===== UI helpers =====
  function setNotice(el, msg, type="notice"){
    if (!el) return;
    el.className = `notice ${type==="ok"?"ok":type==="err"?"err":""}`;
    el.textContent = msg;
    el.style.display = msg ? "block" : "none";
  }

  // ===== Global init =====
  window.XATU = {
    sbFetch,
    auth: { signUp: authSignUp, signIn: authSignIn, signOut: authSignOut, getUser: authGetUser, setSessionFromUrlIfPresent },
    listings: { fetch: fetchListings, create: createListing },
    support: { create: createSupportTicket },
    favs: { load: loadFavs, save: saveFavs, isFav, toggleFav },
    ui: { setNotice }
  };

})();
