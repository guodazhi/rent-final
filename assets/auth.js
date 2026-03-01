// assets/auth.js
// 依赖：assets/config.js 先加载（window.APP_CONFIG）
// 依赖：<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

(function () {
  // ---------- 0) Supabase init ----------
  const cfg = window.APP_CONFIG || {};
  const SUPABASE_URL = cfg.SUPABASE_URL;
  const SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[auth] Missing SUPABASE_URL / SUPABASE_ANON_KEY in window.APP_CONFIG");
    return;
  }

  const supabase = window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  window.supabaseClient = supabase;

  // ---------- 1) Helpers ----------
  const $ = (id) => document.getElementById(id);
  const val = (id) => ($(id) ? $(id).value.trim() : "");
  const setText = (id, t) => {
    if ($(id)) $(id).textContent = t;
  };

  function showMsg(msg, isError = false) {
    // 兼容：有些页面有 #authMsg / #loginMsg / #toast
    const el = $("authMsg") || $("loginMsg") || $("toast");
    if (el) {
      el.textContent = msg;
      el.style.color = isError ? "#c0392b" : "#2c3e50";
      el.style.display = "block";
    } else {
      // 退化到 alert
      if (isError) alert(msg);
      else console.log(msg);
    }
  }

  function safeErr(err) {
    return (err && (err.message || err.error_description)) || String(err || "Unknown error");
  }

  // ---------- 2) UI State ----------
  function renderAuthUI(user) {
    // 兼容：右上角“登录/我的/退出”
    const btnLogin = $("btnLogin") || $("loginBtn");
    const btnLogout = $("btnLogout") || $("logoutBtn");
    const btnMe = $("btnMe") || $("meBtn");
    const meLabel = $("meLabel") || $("meText");

    if (user) {
      if (btnLogin) btnLogin.style.display = "none";
      if (btnLogout) btnLogout.style.display = "inline-flex";
      if (btnMe) btnMe.style.display = "inline-flex";
      if (meLabel) meLabel.textContent = user.email || "我的";
      setText("authStatus", "已登录");
    } else {
      if (btnLogin) btnLogin.style.display = "inline-flex";
      if (btnLogout) btnLogout.style.display = "none";
      if (btnMe) btnMe.style.display = "none";
      if (meLabel) meLabel.textContent = "我的";
      setText("authStatus", "未登录");
    }
  }

  // ---------- 3) Profiles upsert ----------
  async function ensureProfile(user, extra = {}) {
    if (!user || !user.id) return;

    // profiles(id uuid primary key) 这里默认 id = auth.users.id
    // 你之前创建了 trigger，也可能自动插入；这里再做一次 upsert 保险
    const payload = {
      id: user.id,
      role: extra.role || "student",
      name: extra.name || null,
      student_id: extra.student_id || null,
      phone: extra.phone || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("[auth] ensureProfile failed:", error);
      // 不强制弹窗，避免影响登录体验
    }
  }

  async function updateProfileFields(user, fields) {
    if (!user?.id) return;

    const payload = {
      ...fields,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...payload }, { onConflict: "id" });

    if (error) throw error;
  }

  // ---------- 4) Auth Actions ----------
  async function doLogin() {
    try {
      const email = val("authEmail") || val("email");
      const password = val("authPassword") || val("password");

      if (!email || !password) {
        showMsg("请输入邮箱和密码", true);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await ensureProfile(data.user, {});
      showMsg("登录成功 ✅");
      renderAuthUI(data.user);

      // 关闭弹窗（如果有）
      closeAuthModal();
    } catch (e) {
      showMsg("登录失败：" + safeErr(e), true);
    }
  }

  async function doRegister() {
    try {
      const email = val("authEmail") || val("email");
      const password = val("authPassword") || val("password");

      // 可选字段
      const name = val("authName") || val("name");
      const student_id = val("authStudentId") || val("student_id");
      const phone = val("authPhone") || val("phone");

      if (!email || !password) {
        showMsg("请输入邮箱和密码", true);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 如果你开启了邮箱验证，这里会提示去邮箱点确认
          // emailRedirectTo: window.location.origin
        },
      });

      if (error) throw error;

      // signUp 后可能立即有 user（未验证也可能返回），也可能 session 为 null
      if (data?.user) {
        await ensureProfile(data.user, { name, student_id, phone, role: "student" });
        if (name || student_id || phone) {
          await updateProfileFields(data.user, { name: name || null, student_id: student_id || null, phone: phone || null });
        }
      }

      showMsg("注册成功 ✅（如开启邮箱验证，请去邮箱确认后再登录）");
      // 不强制关闭弹窗，让用户看到提示
    } catch (e) {
      showMsg("注册失败：" + safeErr(e), true);
    }
  }

  async function doLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showMsg("已退出登录");
      renderAuthUI(null);
    } catch (e) {
      showMsg("退出失败：" + safeErr(e), true);
    }
  }

  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  }

  // ---------- 5) Modal control (optional) ----------
  function openAuthModal() {
    const modal = $("authModal") || $("loginModal");
    if (modal) modal.style.display = "block";
  }
  function closeAuthModal() {
    const modal = $("authModal") || $("loginModal");
    if (modal) modal.style.display = "none";
  }

  // ---------- 6) Bind buttons ----------
  function bind() {
    // 兼容多种按钮 id
    const loginBtn = $("authLoginBtn") || $("btnAuthLogin") || $("btnLoginSubmit") || $("doLogin");
    const registerBtn = $("authRegisterBtn") || $("btnAuthRegister") || $("btnRegisterSubmit") || $("doRegister");
    const logoutBtn = $("btnLogout") || $("logoutBtn");
    const openBtn = $("btnLogin") || $("loginBtn");
    const closeBtn = $("authClose") || $("modalClose") || $("closeAuth");

    if (loginBtn) loginBtn.addEventListener("click", doLogin);
    if (registerBtn) registerBtn.addEventListener("click", doRegister);
    if (logoutBtn) logoutBtn.addEventListener("click", doLogout);
    if (openBtn) openBtn.addEventListener("click", openAuthModal);
    if (closeBtn) closeBtn.addEventListener("click", closeAuthModal);

    // 点击遮罩关闭（如果你 modal 结构是 overlay）
    const overlay = $("authOverlay");
    if (overlay) overlay.addEventListener("click", closeAuthModal);

    // Enter 键快速登录
    ["authEmail", "email", "authPassword", "password"].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doLogin();
      });
    });
  }

  // ---------- 7) Boot ----------
  async function boot() {
    bind();

    const user = await getCurrentUser();
    renderAuthUI(user);

    // 监听登录状态变化
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null;
      renderAuthUI(u);
      if (u) await ensureProfile(u, {});
    });

    // 给全局暴露（方便你在其它页面直接调用）
    window.Auth = {
      supabase,
      login: doLogin,
      register: doRegister,
      logout: doLogout,
      open: openAuthModal,
      close: closeAuthModal,
      me: getCurrentUser,
      ensureProfile,
      updateProfileFields,
    };
  }

  boot();
})();
