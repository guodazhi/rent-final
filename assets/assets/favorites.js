<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>收藏 - 翻翔安居 XATU</title>

  <!-- 你项目已有的通用脚本：config + supabase init + auth -->
  <script src="/assets/config.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/assets/auth.js"></script>

  <!-- 收藏逻辑 -->
  <script src="/assets/favorites.js"></script>

  <link rel="stylesheet" href="/assets/style.css" />
</head>

<body>
  <div class="topbar">
    <a class="btn" href=" " style="margin-right:10px;">← 返回</a >
    <div class="brand">
      <div class="brand-title">翻翔安居 · XATU</div>
      <div class="brand-sub">收藏</div>
    </div>
    <div style="flex:1"></div>
    <button class="btn" onclick="window.openAuthModal && window.openAuthModal()">登录/注册</button>
  </div>

  <main class="container">
    <h2 style="margin:18px 0 6px;">收藏</h2>
    <div style="opacity:.7;margin-bottom:12px;">这里显示你收藏的房源</div>

    <div id="favList"></div>
  </main>

  <script>
    window.addEventListener("DOMContentLoaded", async () => {
      // 如果你 auth.js 里会初始化 window.sb（supabase client），这里就能直接用
      if (window.Favorites) {
        await window.Favorites.loadFavoritesInto("#favList");
      }

      // 当收藏变化时刷新
      document.addEventListener("favorite:changed", () => {
        window.Favorites && window.Favorites.loadFavoritesInto("#favList");
      });
    });
  </script>
</body>
</html>
