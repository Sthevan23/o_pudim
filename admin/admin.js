if (sessionStorage.getItem("admin_logged") !== "true") location.replace("login.html");

const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const toast = (msg) => {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
};
const imgSrc = (path) => {
  const src = String(path || "products/logo.png");
  if (/^(https?:|data:|\/|\.\.\/)/i.test(src)) return src;
  return "../" + src.replace(/^\//, "");
};
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));
const emptyHtml = (msg) => `<p class="empty">${msg}</p>`;

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebar-overlay");
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
  document.body.classList.remove("sidebar-open");
}
function toggleSidebar() {
  const open = !sidebar.classList.contains("open");
  sidebar.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  document.body.classList.toggle("sidebar-open", open);
}

function showPage(id) {
  document.querySelectorAll(".admin-page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".sidebar__link").forEach((a) => a.classList.toggle("active", a.dataset.page === id));
  document.getElementById("page-" + id)?.classList.add("active");
  const titles = {
    dashboard: "Dashboard",
    analise: "Análise",
    pedidos: "Pedidos",
    produtos: "Produtos",
    parceiros: "Parceiros",
    clientes: "Clientes",
    financeiro: "Financeiro",
    config: "Configurações",
  };
  document.getElementById("page-title").textContent = titles[id] || "Painel";
  closeSidebar();
  if (id === "analise") loadVisits();
}

function prettyPhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(raw || "").trim();
}

function orderCard(o) {
  const rows = [];
  const items = (o.items || []).map((i) => `${i.qty}x ${i.name}`).join(", ");
  if (items) rows.push(["Pedido", items]);
  if (o.clientName) rows.push(["Nome", o.clientName]);
  if (o.clientWhatsapp) rows.push(["WhatsApp", prettyPhone(o.clientWhatsapp)]);
  if (o.payment) rows.push(["Pagamento", o.payment]);
  if (o.desiredDate) rows.push(["Data", o.desiredDate]);
  if (o.receiveMethod) rows.push(["Receber", o.receiveMethod]);
  if (o.deliveryAddress) rows.push(["Endereço", o.deliveryAddress]);
  const meta = rows.length
    ? `<div class="order-meta">${rows.map(([k, v]) => `<div><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join("")}</div>`
    : `${o.notes ? `<small>${escapeHtml(o.notes)}</small>` : ""}`;
  return `
    <article class="order-card">
      <div class="order-card__top">
        <div>
          <strong>${escapeHtml(o.number || "-")}</strong>
        </div>
        <strong>${money(o.total)}</strong>
      </div>
      ${meta}
      <select data-status="${escapeHtml(o.id)}">
        ${["novo","preparo","entrega","finalizado","cancelado"].map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </article>`;
}

function setPreview(path) {
  const img = document.getElementById("p-preview");
  if (!img) return;
  if (!path) {
    img.hidden = true;
    img.removeAttribute("src");
    return;
  }
  img.hidden = false;
  img.src = imgSrc(path);
}

function fillVisitStats(s) {
  const n = (v) => String(Number(v || 0));
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set("stat-visitors-today", n(s?.visitorsToday));
  set("stat-views-today", n(s?.viewsToday));
  set("an-visitors-today", n(s?.visitorsToday));
  set("an-views-today", n(s?.viewsToday));
  set("an-visitors-7d", n(s?.visitors7d));
  set("an-views-7d", n(s?.views7d));
  set("an-visitors-total", n(s?.visitorsTotal));
  set("an-views-total", n(s?.viewsTotal));

  const days = Array.isArray(s?.days) ? s.days : [];
  const max = Math.max(1, ...days.map((d) => Number(d.visitors || 0)));
  const fmt = (iso) => {
    const parts = String(iso || "").split("-");
    return parts[2] && parts[1] ? `${parts[2]}/${parts[1]}` : iso;
  };
  const tbody = document.getElementById("visits-days");
  if (!tbody) return;
  tbody.innerHTML = days.map((d) => {
    const people = Number(d.visitors || 0);
    const pct = Math.round((people / max) * 100);
    return `<tr>
      <td>${fmt(d.date)}</td>
      <td>${people}</td>
      <td>${Number(d.views || 0)}</td>
      <td><div class="visit-bar"><span style="width:${pct}%"></span></div></td>
    </tr>`;
  }).join("") || `<tr><td colspan="4">Ainda sem visitas registradas.</td></tr>`;
}

async function loadVisits() {
  try {
    fillVisitStats(await Storage.getVisitStatsAsync());
  } catch {
    fillVisitStats(null);
  }
}

function renderAll() {
  const orders = Storage.getOrders();
  const clients = Storage.getClients();
  const products = Storage.getAllProducts();
  const finance = Storage.getFinance();
  const sales = finance.filter((f) => f.type === "entrada").reduce((s, f) => s + Number(f.amount || 0), 0);
  document.getElementById("stat-orders").textContent = String(orders.length);
  document.getElementById("stat-sales").textContent = money(sales);
  document.getElementById("stat-clients").textContent = String(clients.length);
  document.getElementById("stat-products").textContent = String(products.filter((p) => p.active !== false).length);

  document.getElementById("dash-orders").innerHTML = orders.slice(0, 5).map(orderCard).join("") || emptyHtml("Nenhum pedido ainda.");
  document.getElementById("orders-body").innerHTML = orders.map(orderCard).join("") || emptyHtml("Nenhum pedido ainda.");

  document.getElementById("products-body").innerHTML = products.map((p) => {
    const onMenu = p.active !== false;
    const legend = String(p.description || "").trim();
    return `
    <tr class="${onMenu ? "" : "row--off-menu"}">
      <td>
        <button type="button" class="btn-onsite ${onMenu ? "is-on" : "is-off"}" data-toggle="${escapeHtml(p.id)}" title="${onMenu ? "Ocultar do site" : "Mostrar no site"}">
          ${onMenu ? "✓ No site" : "✗ Fora"}
        </button>
      </td>
      <td><img class="prod-thumb" src="${imgSrc(p.image)}" alt=""></td>
      <td><strong>${escapeHtml(p.name || "")}</strong></td>
      <td><span class="prod-legend">${legend ? escapeHtml(legend) : "—"}</span></td>
      <td>${escapeHtml(Storage.categoryName(p.categoryId))}</td>
      <td>${money(Storage.productDisplayPrice(p))}</td>
      <td>
        <div class="table__actions">
          <button class="btn btn--secondary btn--sm" data-edit="${escapeHtml(p.id)}">Editar</button>
          <button class="btn btn--danger btn--sm" data-del="${escapeHtml(p.id)}">Excluir</button>
        </div>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="7">Nenhum produto cadastrado.</td></tr>`;

  document.getElementById("clients-body").innerHTML = clients.map((c) => `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.phone || "")}</td><td>${escapeHtml(c.email || "")}</td></tr>`).join("") || `<tr><td colspan="3">Nenhum cliente ainda.</td></tr>`;
  document.getElementById("finance-body").innerHTML = finance.map((f) => `<tr><td>${escapeHtml(f.date || "")}</td><td>${escapeHtml(f.type)}</td><td>${escapeHtml(f.description || "")}</td><td>${money(f.amount)}</td></tr>`).join("") || `<tr><td colspan="4">Sem lançamentos.</td></tr>`;

  const s = Storage.getSettings();
  document.getElementById("s-name").value = s.name || "";
  document.getElementById("s-wa").value = s.whatsapp || "";
  document.getElementById("s-ig").value = s.instagram || "";
  document.getElementById("s-igu").value = s.instagramUser || "";
  document.getElementById("s-address").value = s.address || "";
  document.getElementById("s-hours").value = s.hours || "";
  document.getElementById("s-t1").value = s.sobreText1 || "";
  document.getElementById("s-t2").value = s.sobreText2 || "";
  document.getElementById("s-t3").value = s.sobreText3 || "";
  document.getElementById("s-hide").checked = s.hidePrices !== false;
  document.getElementById("s-natal").checked = s.showNatal !== false;
  document.getElementById("p-cat").innerHTML = Storage.getCategories().map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  renderPartners();
}

function openProduct(product) {
  document.getElementById("p-id").value = product?.id || "";
  document.getElementById("p-name").value = product?.name || "";
  document.getElementById("p-desc").value = product?.description || "";
  document.getElementById("p-price").value = product?.price ?? "";
  document.getElementById("p-image").value = product?.image || "";
  document.getElementById("p-cat").value = product?.categoryId || Storage.getCategories()[0]?.id || "";
  document.getElementById("p-active").checked = product?.active !== false;
  document.getElementById("p-feat").checked = !!product?.featured;
  document.getElementById("p-file").value = "";
  setPreview(product?.image || "");
  document.getElementById("modal-title").textContent = product ? "Editar produto" : "Novo produto";
  document.getElementById("product-modal").classList.add("active");
}

function partnerUid() {
  return "pt-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function withPartnerIds(list) {
  return (list || []).map((p, i) => ({
    id: p.id || ("pt-" + String(p.name || "parceiro").toLowerCase().replace(/[^a-z0-9]+/gi, "").slice(0, 16) + "-" + i),
    name: p.name || "",
    logo: p.logo || "",
  }));
}

function currentPartners() {
  const p = Storage.getPartners();
  return {
    pudins: withPartnerIds(p.pudins),
    gelatos: withPartnerIds(p.gelatos),
  };
}

function partnerRow(p, group) {
  const logo = p.logo
    ? `<img src="${imgSrc(p.logo)}" alt="">`
    : `<span class="partner-admin-card__empty">Só nome</span>`;
  return `
    <article class="partner-admin-card">
      ${logo}
      <div>
        <strong>${escapeHtml(p.name)}</strong>
        <small>${p.logo ? "Com logo" : "Lista “Também em”"}</small>
      </div>
      <div class="table__actions">
        <button class="btn btn--secondary btn--sm" type="button" data-pt-edit="${escapeHtml(p.id)}" data-pt-group="${group}">Editar</button>
        <button class="btn btn--danger btn--sm" type="button" data-pt-del="${escapeHtml(p.id)}" data-pt-group="${group}">Tirar</button>
      </div>
    </article>`;
}

function renderPartners() {
  const p = currentPartners();
  const pud = document.getElementById("partners-pudins-body");
  const gel = document.getElementById("partners-gelatos-body");
  if (pud) pud.innerHTML = p.pudins.map((x) => partnerRow(x, "pudins")).join("") || emptyHtml("Nenhum parceiro de pudim.");
  if (gel) gel.innerHTML = p.gelatos.map((x) => partnerRow(x, "gelatos")).join("") || emptyHtml("Nenhum parceiro de gelato.");
}

function setPartnerPreview(path) {
  const img = document.getElementById("pt-preview");
  if (!img) return;
  if (!path) {
    img.hidden = true;
    img.removeAttribute("src");
    return;
  }
  img.hidden = false;
  img.src = imgSrc(path);
}

function openPartner(partner, group) {
  document.getElementById("pt-id").value = partner?.id || "";
  document.getElementById("pt-orig-group").value = group || "pudins";
  document.getElementById("pt-name").value = partner?.name || "";
  document.getElementById("pt-group").value = group || "pudins";
  document.getElementById("pt-logo").value = partner?.logo || "";
  document.getElementById("pt-file").value = "";
  setPartnerPreview(partner?.logo || "");
  document.getElementById("pt-modal-title").textContent = partner ? "Editar parceiro" : "Novo parceiro";
  document.getElementById("partner-modal").classList.add("active");
}

async function persistPartners(next) {
  await Storage.savePartnersAsync({
    pudins: next.pudins.map(({ id, name, logo }) => (logo ? { id, name, logo } : { id, name })),
    gelatos: next.gelatos.map(({ id, name, logo }) => (logo ? { id, name, logo } : { id, name })),
  });
  renderAll();
}

document.getElementById("sidebar-toggle").onclick = toggleSidebar;
overlay.onclick = closeSidebar;
document.querySelectorAll("[data-page]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  if (a.dataset.page) showPage(a.dataset.page);
}));
document.getElementById("logout").onclick = () => {
  sessionStorage.clear();
  location.href = "login.html";
};
document.getElementById("new-product").onclick = () => openProduct(null);
document.getElementById("new-partner-pudins").onclick = () => openPartner(null, "pudins");
document.getElementById("new-partner-gelatos").onclick = () => openPartner(null, "gelatos");
document.getElementById("modal-close").onclick = () => document.getElementById("product-modal").classList.remove("active");
document.getElementById("pt-modal-close").onclick = () => document.getElementById("partner-modal").classList.remove("active");
document.getElementById("product-modal").addEventListener("click", (e) => {
  if (e.target.id === "product-modal") e.target.classList.remove("active");
});
document.getElementById("partner-modal").addEventListener("click", (e) => {
  if (e.target.id === "partner-modal") e.target.classList.remove("active");
});
document.getElementById("admin-email").textContent = sessionStorage.getItem("admin_email") || "";

document.getElementById("publish-catalog")?.addEventListener("click", async () => {
  try {
    await Storage.publishCatalogAsync();
    toast("Cardápio publicado no site");
  } catch (err) {
    toast(err.message || "Falha ao publicar");
  }
});

document.getElementById("products-body").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-del]");
  const tog = e.target.closest("[data-toggle]");
  try {
    if (edit) openProduct(Storage.getAllProducts().find((p) => p.id === edit.dataset.edit));
    if (del && confirm("Excluir este produto?")) {
      await Storage.deleteProductAsync(del.dataset.del);
      renderAll();
      toast("Produto excluído");
    }
    if (tog) {
      const p = Storage.getAllProducts().find((x) => x.id === tog.dataset.toggle);
      await Storage.setProductActiveAsync(p.id, p.active === false);
      renderAll();
    }
  } catch (err) {
    toast(err.message || "Não foi possível atualizar. Confira o MySQL.");
  }
});

document.body.addEventListener("change", async (e) => {
  const sel = e.target.closest("[data-status]");
  if (!sel) return;
  try {
    await Storage.setOrderStatusAsync(sel.dataset.status, sel.value);
    toast("Status atualizado");
  } catch (err) {
    toast(err.message || "Falha ao atualizar status");
  }
});

document.getElementById("p-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const path = await Storage.uploadImage(file);
    document.getElementById("p-image").value = path;
    setPreview(path);
    toast("Foto enviada");
  } catch (err) {
    toast(err.message || "Falha no upload");
  }
});

document.getElementById("pt-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const path = await Storage.uploadImage(file, "partners");
    document.getElementById("pt-logo").value = path;
    setPartnerPreview(path);
    toast("Logo enviada");
  } catch (err) {
    toast(err.message || "Falha no upload");
  }
});

document.getElementById("pt-clear-logo").onclick = () => {
  document.getElementById("pt-logo").value = "";
  document.getElementById("pt-file").value = "";
  setPartnerPreview("");
};

document.getElementById("page-parceiros").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-pt-edit]");
  const del = e.target.closest("[data-pt-del]");
  if (edit) {
    const group = edit.dataset.ptGroup;
    const found = currentPartners()[group]?.find((x) => x.id === edit.dataset.ptEdit);
    openPartner(found, group);
    return;
  }
  if (!del) return;
  if (!confirm("Tirar este parceiro do site?")) return;
  try {
    const group = del.dataset.ptGroup;
    const next = currentPartners();
    next[group] = next[group].filter((x) => x.id !== del.dataset.ptDel);
    await persistPartners(next);
    toast("Parceiro removido");
  } catch (err) {
    toast(err.message || "Não foi possível remover");
  }
});

document.getElementById("partner-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("pt-name").value.trim();
  if (!name) {
    toast("Informe o nome do parceiro");
    return;
  }
  const id = document.getElementById("pt-id").value || partnerUid();
  const group = document.getElementById("pt-group").value === "gelatos" ? "gelatos" : "pudins";
  const logo = document.getElementById("pt-logo").value.trim();
  const item = logo ? { id, name, logo } : { id, name };
  try {
    const next = currentPartners();
    next.pudins = next.pudins.filter((x) => x.id !== id);
    next.gelatos = next.gelatos.filter((x) => x.id !== id);
    next[group].push(item);
    await persistPartners(next);
    document.getElementById("partner-modal").classList.remove("active");
    toast("Parceiro salvo no site");
  } catch (err) {
    toast(err.message || "Não foi possível salvar o parceiro");
  }
});

document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("p-name").value.trim();
  const description = document.getElementById("p-desc").value.trim();
  if (!name) {
    toast("Informe o nome do produto");
    return;
  }
  if (!description) {
    toast("Informe a legenda do produto");
    return;
  }
  const existing = Storage.getAllProducts().find((p) => p.id === document.getElementById("p-id").value) || {};
  const product = {
    ...existing,
    id: document.getElementById("p-id").value || undefined,
    name,
    description,
    price: Number(document.getElementById("p-price").value || 0),
    image: document.getElementById("p-image").value.trim(),
    categoryId: document.getElementById("p-cat").value,
    active: document.getElementById("p-active").checked,
    featured: document.getElementById("p-feat").checked,
  };
  try {
    await Storage.saveProductAsync(product);
    document.getElementById("product-modal").classList.remove("active");
    renderAll();
    toast("Produto salvo no site");
  } catch (err) {
    toast(err.message || "Falha ao salvar produto");
  }
});

document.getElementById("settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Storage.getData();
  data.settings = {
    ...data.settings,
    name: document.getElementById("s-name").value.trim(),
    whatsapp: document.getElementById("s-wa").value.trim(),
    instagram: document.getElementById("s-ig").value.trim(),
    instagramUser: document.getElementById("s-igu").value.trim(),
    address: document.getElementById("s-address").value.trim(),
    hours: document.getElementById("s-hours").value.trim(),
    sobreText1: document.getElementById("s-t1").value.trim(),
    sobreText2: document.getElementById("s-t2").value.trim(),
    sobreText3: document.getElementById("s-t3").value.trim(),
    hidePrices: document.getElementById("s-hide").checked,
    showNatal: document.getElementById("s-natal").checked,
  };
  Storage.setMemory(data);
  try {
    await Storage.saveAllAsync();
    toast("Configurações salvas");
  } catch (err) {
    toast(err.message || "Salvo neste aparelho. Confira o MySQL para a nuvem.");
  }
});

Storage.initCloud({ full: true }).then(() => {
  renderAll();
  loadVisits();
}).catch(() => {
  renderAll();
  toast("Painel no modo local — confira o MySQL");
});
