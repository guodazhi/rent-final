const API = {
  listings: "/.netlify/functions/getApprovedListings",
  submit: "/.netlify/functions/submitListing",
  favToggle: "/.netlify/functions/toggleFavorite",
  favList: "/.netlify/functions/getFavorites",
  notiList: "/.netlify/functions/getNotifications",
  notiRead: "/.netlify/functions/markNotificationRead",
  feedback: "/.netlify/functions/createFeedback",
};

function qs(id){ return document.getElementById(id); }

function getToken() {
  return localStorage.getItem("sb_token") || "";
}
function setToken(token) {
  localStorage.setItem("sb_token", token || "");
}
function authHeader() {
  const token = getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

async function jsonFetch(url, opts={}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers||{}),
      ...authHeader()
    }
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch(e) { data = { raw: text }; }
  if (!res.ok) throw new Error((data && data.error) ? data.error : `HTTP ${res.status}`);
  return data;
}

async function loadListings() {
  const listEl = qs("listingGrid");
  if (!listEl) return;
  listEl.innerHTML = `<div class="hint">${I18N_HELPER.t("loading")}</div>`;

  const campus = qs("campus")?.value || "";
  const q = qs("q")?.value || "";
  const rentType = qs("rentType")?.value || "";
  const bathroom = qs("bathroom")?.value || "";
  const subway = qs("subway")?.value || "";

  const params = new URLSearchParams({ campus, q, rentType, bathroom, subway });
  const data = await jsonFetch(`${API.listings}?${params.toString()}`);

  if (!data || !data.items || data.items.length === 0) {
    listEl.innerHTML = `<div class="hint">${I18N_HELPER.t("noData")}</div>`;
    return;
  }

  listEl.innerHTML = data.items.map(item => `
    <div class="card">
      <div class="cardTitle">${escapeHtml(item.title || "")}</div>
      <div class="cardMeta">
        <div><b>${I18N_HELPER.t("price")}:</b> ¥${item.price}</div>
        <div><b>${I18N_HELPER.t("location")}:</b> ${escapeHtml(item.location||"")}</div>
      </div>
      <div class="cardActions">
        <button class="btn" data-fav="${item.id}">☆</button>
        <a class="btn btnPrimary" href=" ">+</a >
      </div>
    </div>
  `).join("");

  listEl.querySelectorAll("[data-fav]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      try{
        await jsonFetch(API.favToggle, { method:"POST", body: JSON.stringify({ listing_id: btn.getAttribute("data-fav") }) });
        toast(I18N_HELPER.t("favAdded"));
      }catch(e){
        toast(e.message);
      }
    });
  });
}

async function submitListing(ev) {
  ev.preventDefault();
  const statusEl = qs("status");
  if (statusEl) statusEl.textContent = "";

  const payload = {
    title: qs("title").value.trim(),
    price: Number(qs("price").value),
    location: qs("location").value.trim(),
    contact: qs("contact").value.trim(),
    description: (qs("description")?.value || "").trim(),
    campus: qs("campus")?.value || null,
    rent_type: qs("rentType")?.value || null,
    bathroom: qs("bathroom")?.value || null,
    subway: qs("subway")?.value || null
  };

  try{
    await jsonFetch(API.submit, { method:"POST", body: JSON.stringify(payload) });
    if (statusEl) statusEl.innerHTML = `✅ ${I18N_HELPER.t("submitOk")}`;
    ev.target.reset();
  }catch(e){
    if (statusEl) statusEl.innerHTML = `❌ ${I18N_HELPER.t("submitFail")}${escapeHtml(e.message)}`;
  }
}

async function loadFavorites() {
  const el = qs("favList");
  if (!el) return;
  el.innerHTML = `<div class="hint">${I18N_HELPER.t("loading")}</div>`;
  try{
    const data = await jsonFetch(API.favList);
    const items = data.items || [];
    if (!items.length) { el.innerHTML = `<div class="hint">${I18N_HELPER.t("noData")}</div>`; return; }
    el.innerHTML = items.map(x=>`
      <div class="card">
        <div class="cardTitle">${escapeHtml(x.title||"")}</div>
        <div class="cardMeta">
          <div><b>${I18N_HELPER.t("price")}:</b> ¥${x.price}</div>
          <div><b>${I18N_HELPER.t("location")}:</b> ${escapeHtml(x.location||"")}</div>
        </div>
        <div class="cardActions">
          <button class="btn" data-unfav="${x.id}">★</button>
        </div>
      </div>
    `).join("");
    el.querySelectorAll("[data-unfav]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        try{
          await jsonFetch(API.favToggle, { method:"POST", body: JSON.stringify({ listing_id: btn.getAttribute("data-unfav") }) });
          toast(I18N_HELPER.t("favRemoved"));
          loadFavorites();
        }catch(e){ toast(e.message); }
      });
    });
  }catch(e){
    el.innerHTML = `<div class="hint">❌ ${escapeHtml(e.message)}</div>`;
  }
}

async function loadMessages() {
  const el = qs("msgList");
  if (!el) return;
  el.innerHTML = `<div class="hint">${I18N_HELPER.t("loading")}</div>`;
  try{
    const data = await jsonFetch(API.notiList);
    const items = data.items || [];
    if (!items.length) { el.innerHTML = `<div class="hint">${I18N_HELPER.t("noData")}</div>`; return; }
    el.innerHTML = items.map(n=>`
      <div class="card">
        <div class="cardTitle">${escapeHtml(n.title||"")}</div>
        <div class="cardMeta">${escapeHtml(n.body||"")}</div>
        <div class="cardActions">
          <button class="btn" data-read="${n.id}">${n.read ? "✓" : "Mark read"}</button>
        </div>
      </div>
    `).join("");
    el.querySelectorAll("[data-read]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        try{
          await jsonFetch(API.notiRead, { method:"POST", body: JSON.stringify({ id: btn.getAttribute("data-read") }) });
          loadMessages();
        }catch(e){ toast(e.message); }
      });
    });
  }catch(e){
    el.innerHTML = `<div class="hint">❌ ${escapeHtml(e.message)}</div>`;
  }
}

async function sendFeedback(ev) {
  ev.preventDefault();
  const statusEl = qs("fbStatus");
  if (statusEl) statusEl.textContent = "";
  try{
    await jsonFetch(API.feedback, { method:"POST", body: JSON.stringify({
      category: qs("fbCategory").value,
      content: qs("fbContent").value.trim()
    })});
    if (statusEl) statusEl.textContent = `✅ ${I18N_HELPER.t("feedbackOk")}`;
    ev.target.reset();
  }catch(e){
    if (statusEl) statusEl.textContent = `❌ ${e.message}`;
  }
}

function toast(msg){
  const el = document.createElement("div");
  el.className="toast";
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1800);
}

function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

window.APP = { loadListings, submitListing, loadFavorites, loadMessages, sendFeedback, setToken };
