// assets/i18n.js
(function () {
  const dict = {
    zh: {
      brand: "翱翔安居 · XATU",
      rent: "租房",
      submit: "发布",
      fav: "收藏",
      support: "客服",
      login: "登录",
      logout: "退出",
      my: "我的",
      needLogin: "请先登录",
      backHome: "返回首页",
      hello: "你好",
    },
    en: {
      brand: "AoXiang Housing · XATU",
      rent: "Rent",
      submit: "Post",
      fav: "Favorites",
      support: "Support",
      login: "Login",
      logout: "Logout",
      my: "Me",
      needLogin: "Please login first",
      backHome: "Back to Home",
      hello: "Hello",
    }
  };

  function getLang() {
    return localStorage.getItem("lang") || "zh";
  }
  function setLang(lang) {
    localStorage.setItem("lang", lang);
    window.dispatchEvent(new Event("langchange"));
  }
  function t(key) {
    const lang = getLang();
    return (dict[lang] && dict[lang][key]) || key;
  }

  window.i18n = { t, getLang, setLang };
})();
