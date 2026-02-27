const I18N = {
  zh: {
    brand: "翱翔安居 · XATU",
    suggestWeChat: "建议在微信内打开",
    navRent: "租房",
    navSubmit: "发布",
    navFav: "收藏",
    navSupport: "客服",
    homeTitle: "西安工业大学学生租房平台",
    campusPlaceholder: "选择校区",
    searchPlaceholder: "搜索：校区/整租/独卫/地铁...",
    filterAll: "全部",
    btnSearch: "搜索",
    btnClear: "清空",
    loading: "加载中...",
    noData: "暂无数据",
    price: "价格",
    location: "位置",
    contact: "联系方式",
    approved: "已审核",
    pending: "待审核",
    submitTitle: "发布房源",
    formTitle: "标题",
    formPrice: "价格",
    formLocation: "位置",
    formContact: "联系方式",
    formDesc: "描述（可选）",
    btnSubmit: "提交",
    submitOk: "已提交！等待审核",
    submitFail: "提交失败：",
    favAdded: "已收藏",
    favRemoved: "已取消收藏",
    msgCenter: "消息中心",
    supportTitle: "客服与反馈",
    feedbackHint: "请输入你的问题/建议",
    feedbackSubmit: "提交反馈",
    feedbackOk: "反馈已提交",
    loginTitle: "注册/登录",
    realName: "实名",
    studentId: "学号",
    phone: "手机号",
    password: "密码",
    btnSignup: "注册",
    btnSignin: "登录",
    landlordPanel: "房东后台",
    adminPanel: "管理员后台"
  },
  en: {
    brand: "AoXiang Housing · XATU",
    suggestWeChat: "Recommended to open in WeChat",
    navRent: "Rent",
    navSubmit: "Post",
    navFav: "Favorites",
    navSupport: "Support",
    homeTitle: "XATU Student Housing Platform",
    campusPlaceholder: "Select campus",
    searchPlaceholder: "Search: campus/whole rent/private bath/subway...",
    filterAll: "All",
    btnSearch: "Search",
    btnClear: "Clear",
    loading: "Loading...",
    noData: "No data",
    price: "Price",
    location: "Location",
    contact: "Contact",
    approved: "Approved",
    pending: "Pending",
    submitTitle: "Submit Listing",
    formTitle: "Title",
    formPrice: "Price",
    formLocation: "Location",
    formContact: "Contact",
    formDesc: "Description (optional)",
    btnSubmit: "Submit",
    submitOk: "Submitted! Waiting for approval",
    submitFail: "Submission failed: ",
    favAdded: "Added to favorites",
    favRemoved: "Removed from favorites",
    msgCenter: "Message Center",
    supportTitle: "Support & Feedback",
    feedbackHint: "Type your issue/suggestion",
    feedbackSubmit: "Send Feedback",
    feedbackOk: "Feedback sent",
    loginTitle: "Sign up / Sign in",
    realName: "Real name",
    studentId: "Student ID",
    phone: "Phone",
    password: "Password",
    btnSignup: "Sign up",
    btnSignin: "Sign in",
    landlordPanel: "Landlord Panel",
    adminPanel: "Admin Panel"
  }
};

function getLang() {
  return localStorage.getItem("lang") || "zh";
}
function setLang(lang) {
  localStorage.setItem("lang", lang);
  applyI18n();
}
function t(key) {
  return (I18N[getLang()] && I18N[getLang()][key]) || key;
}
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  const langBtn = document.getElementById("langBtn");
  if (langBtn) langBtn.textContent = getLang() === "zh" ? "EN" : "中文";
}
window.I18N_HELPER = { getLang, setLang, t, applyI18n };
