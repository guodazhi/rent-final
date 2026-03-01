// assets/auth.js
(function () {
  async function getUser() {
    const { data } = await window.sb.auth.getUser();
    return data?.user || null;
  }

  async function refreshAuthSlot() {
    const slot = document.getElementById("authSlot");
    if (!slot) return;

    const user = await getUser();
    if (!user) {
      slot.innerHTML = `<a class="login-link" href=" ">${window.i18n.t("login")}</a >`;
      return;
    }

    // profile 读取（可选）
    let name = user.email;
    try {
      const { data } = await window.sb
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.name) name = data.name;
    } catch (e) {}

    slot.innerHTML = `
      <span class="user-badge">${window.i18n.t("hello")}，${escapeHtml(name)}</span>
      <button class="logout-btn" id="logoutBtn">${window.i18n.t("logout")}</button>
    `;
    document.getElementById("logoutBtn").onclick = async () => {
      await window.sb.auth.signOut();
      location.href = "/index.html";
    };
  }

  async function requireAuth(redirectTo = "/login.html") {
    const user = await getUser();
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `${redirectTo}?next=${next}`;
      return false;
    }
    return true;
  }

  async function signIn(email, password) {
    const { error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp({ email, password, name, student_id, phone }) {
    const { data, error } = await window.sb.auth.signUp({
      email,
      password,
      options: {
        data: { name, student_id, phone }
      }
    });
    if (error) throw error;

    // 触发器会插入 profiles(id, role)
    // 这里补全 profiles 字段
    const user = data?.user;
    if (user?.id) {
      await window.sb.from("profiles").update({
        name: name || null,
        student_id: student_id || null,
        phone: phone || null
      }).eq("id", user.id);
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.AUTH = { getUser, refreshAuthSlot, requireAuth, signIn, signUp };
})();
