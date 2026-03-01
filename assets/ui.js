// assets/ui.js
(function () {
  function renderHeader({ active = "rent" } = {}) {
    const el = document.getElementById("app-header");
    if (!el) return;

    const lang = window.i18n.getLang();
    const brand = window.i18n.t("brand");

    el.innerHTML = `
      <div class="app-header">
        <a class="brand" href=" ">
          < img class="logo" src="assets/logo.png" alt="logo" onerror="this.style.display='none'"/>
          <span>${brand}</span>
        </a >

        <div class="header-actions">
          <button class="lang-btn" id="langBtn">${lang === "zh" ? "EN" : "中文"}</button>
          <div id="authSlot" class="auth-slot"></div>
        </div>
      </div>
    `;

    document.getElementById("langBtn").onclick = () => {
      window.i18n.setLang(lang === "zh" ? "en" : "zh");
    };
  }

  function renderBottomNav(active = "rent") {
    const el = document.getElementById("app-bottomnav");
    if (!el) return;

    el.innerHTML = `
      <div class="bottom-nav">
        <a class="nav-item ${active === "rent" ? "active" : ""}" href="/index.html">${window.i18n.t("rent")}</a >
        <a class="nav-item ${active === "submit" ? "active" : ""}" href="/submit.html">${window.i18n.t("submit")}</a >
        <a class="nav-item ${active === "fav" ? "active" : ""}" href="/favorites.html">${window.i18n.t("fav")}</a >
        <a class="nav-item ${active === "support" ? "active" : ""}" href="/support.html">${window.i18n.t("support")}</a >
      </div>
    `;
  }

  window.UI = { renderHeader, renderBottomNav };
})();
