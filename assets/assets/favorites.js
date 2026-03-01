// assets/favorites.js
(function () {
  function mustClient() {
    if (!window.sb) throw new Error("Supabase client not initialized. Check assets/config.js and supabase init script.");
  }

  function showMsg(msg) {
    if (window.showMsg) return window.showMsg(msg);
    alert(msg);
  }

  async function getUser() {
    mustClient();
    const { data, error } = await window.sb.auth.getUser();
    if (error) return null;
    return data?.user ?? null;
  }

  async function ensureLogin() {
    const user = await getUser();
    if (user) return user;

    showMsg("请先登录后再操作收藏");
    if (window.openAuthModal) window.openAuthModal();
    return null;
  }

  // 绑定：在房源卡片上的“收藏”按钮点击
  // HTML按钮需要：data-action="favorite" data-id="LISTING_ID"
  async function toggleFavorite(listingId) {
    const user = await ensureLogin();
    if (!user) return;

    // 先查是否已收藏
    const { data: existed, error: selErr } = await window.sb
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (selErr) {
      showMsg("读取收藏状态失败: " + selErr.message);
      return;
    }

    // 已收藏 -> 取消
    if (existed?.id) {
      const { error: delErr } = await window.sb
        .from("favorites")
        .delete()
        .eq("id", existed.id);

      if (delErr) return showMsg("取消收藏失败: " + delErr.message);

      showMsg("已取消收藏");
      document.dispatchEvent(new CustomEvent("favorite:changed"));
      return;
    }

    // 未收藏 -> 添加
    const { error: insErr } = await window.sb
      .from("favorites")
      .insert({ user_id: user.id, listing_id: listingId });

    if (insErr) return showMsg("收藏失败: " + insErr.message);

    showMsg("已收藏");
    document.dispatchEvent(new CustomEvent("favorite:changed"));
  }

  // favorites.html：加载当前用户收藏列表（联表取 listings）
  async function loadFavoritesInto(containerSelector) {
    const el = document.querySelector(containerSelector);
    if (!el) return;

    const user = await ensureLogin();
    if (!user) {
      el.innerHTML = `<div style="padding:12px;opacity:.7">请先登录后查看收藏</div>`;
      return;
    }

    el.innerHTML = `<div style="padding:12px;opacity:.7">加载中...</div>`;

    const { data, error } = await window.sb
      .from("favorites")
      .select("id, created_at, listings(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      el.innerHTML = `<div style="padding:12px;color:#b00">加载失败：${error.message}</div>`;
      return;
    }

    const items = (data || []).map((x) => x.listings).filter(Boolean);

    if (!items.length) {
      el.innerHTML = `<div style="padding:12px;opacity:.7">暂无收藏</div>`;
      return;
    }

    // 复用你现有的渲染函数（如果有）
    if (window.renderListings) {
      window.renderListings(items, el);
      return;
    }

    // 最简兜底渲染
    el.innerHTML = items
      .map(
        (it) => `
        <div style="border:1px solid #eee;border-radius:12px;padding:12px;margin:12px 0;">
          <div style="font-weight:700">${it.title ?? "未命名房源"}</div>
          <div style="opacity:.7;margin-top:6px;">¥ ${it.price ?? "-"}</div>
          <div style="opacity:.7;margin-top:6px;">${it.location ?? ""}</div>
          <div style="margin-top:10px;">
            <button data-action="favorite" data-id="${it.id}">取消收藏</button>
          </div>
        </div>
      `
      )
      .join("");

    // 让“取消收藏”可用
    bindFavoriteButtons(el);
  }

  function bindFavoriteButtons(root = document) {
    root.addEventListener("click", async (e) => {
      const btn = e.target.closest('[data-action="favorite"]');
      if (!btn) return;
      const id = Number(btn.getAttribute("data-id"));
      if (!id) return;
      await toggleFavorite(id);
    });
  }

  // 暴露给全局
  window.Favorites = {
    bindFavoriteButtons,
    toggleFavorite,
    loadFavoritesInto,
  };
})();
