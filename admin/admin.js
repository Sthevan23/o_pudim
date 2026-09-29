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

const STATUS_LIST = ["novo", "preparo", "entrega", "finalizado", "cancelado"];
const STATUS_LABELS = {
  novo: "Novo",
  preparo: "Em preparo",
  entrega: "Saiu p/ entrega",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};
let orderFilter = "all";

function orderWhen(o) {
  return o?.orderedAt || o?.date || o?.desiredDate || "";
}

function statusBadge(status) {
  const key = STATUS_LIST.includes(status) ? status : "novo";
  return `<span class="badge badge--${key}">${STATUS_LABELS[key] || status}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function digitsPhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function whatsappHref(phone) {
  const digits = digitsPhone(phone);
  if (!digits) return "";
  return "https://wa.me/" + (digits.startsWith("55") ? digits : "55" + digits);
}

function whatsappTableLink(phone) {
  const href = whatsappHref(phone);
  if (!href) return "";
  return `<a class="order-whatsapp-inline" href="${href}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> ${escapeHtml(prettyPhone(phone))}</a>`;
}

function whatsappLink(phone) {
  const href = whatsappHref(phone);
  if (!href) return "";
  return `<a class="order-whatsapp-link" href="${href}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> <span>${escapeHtml(prettyPhone(phone))}</span></a>`;
}

function itemsLabel(o) {
  const n = (o.items || []).length;
  return n ? `${n} item(s)` : "—";
}

function sortOrdersNewestFirst(orders) {
  return (orders || []).slice().sort((a, b) => {
    const tb = new Date(orderWhen(b) || 0).getTime();
    const ta = new Date(orderWhen(a) || 0).getTime();
    if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
    return String(b.number || "").localeCompare(String(a.number || ""), "pt-BR");
  });
}

function isOrderToday(dateStr) {
  if (!dateStr) return false;
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (String(dateStr).slice(0, 10) === iso) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function orderRow(o) {
  const id = escapeHtml(o.id);
  return `
    <tr class="order-row" data-view-order="${id}" title="Ver detalhes do pedido">
      <td data-label="Nº"><strong>${escapeHtml(o.number || "-")}</strong></td>
      <td data-label="Cliente">
        ${escapeHtml(o.clientName || "—")}
        ${o.clientWhatsapp ? `<br>${whatsappTableLink(o.clientWhatsapp)}` : ""}
      </td>
      <td data-label="Itens">${itemsLabel(o)}</td>
      <td data-label="Valor">${money(o.total)}</td>
      <td data-label="Status">${statusBadge(o.status)}</td>
      <td data-label="Data">${escapeHtml(formatDate(orderWhen(o)))}</td>
      <td data-label="Ações">
        <div class="table__actions">
          <button type="button" class="btn--icon edit" data-view-order="${id}" title="Ver detalhes"><i class="fas fa-eye"></i></button>
        </div>
      </td>
    </tr>`;
}

function renderOrders() {
  let orders = sortOrdersNewestFirst(Storage.getOrders());
  if (orderFilter === "today") {
    orders = orders.filter((o) => isOrderToday(orderWhen(o)));
  } else if (orderFilter !== "all") {
    orders = orders.filter((o) => o.status === orderFilter);
  }
  const tbody = document.getElementById("orders-body");
  if (!tbody) return;
  if (!orders.length) {
    const emptyMsg = orderFilter === "today"
      ? "Nenhum pedido registrado hoje."
      : "Nenhum pedido neste filtro.";
    tbody.innerHTML = `<tr><td colspan="7" class="table__empty">${emptyMsg}</td></tr>`;
    return;
  }
  tbody.innerHTML = orders.map(orderRow).join("");
}

function renderDashOrders() {
  const orders = sortOrdersNewestFirst(Storage.getOrders());
  const recent = orders.slice(0, 8);
  const tbody = document.getElementById("dash-orders");
  if (tbody) {
    tbody.innerHTML = recent.length
      ? recent.map((o) => `
        <tr class="order-row" data-view-order="${escapeHtml(o.id)}" title="Ver detalhes do pedido">
          <td><strong>${escapeHtml(o.number || "-")}</strong></td>
          <td>${escapeHtml(o.clientName || "—")}</td>
          <td>${(o.items || []).map((i) => `${i.qty}x ${escapeHtml(i.name)}`).join(", ") || "—"}</td>
          <td>${money(o.total)}</td>
          <td>${statusBadge(o.status)}</td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="table__empty">Nenhum pedido ainda.</td></tr>`;
  }
  const statusColors = { novo: "#2196F3", preparo: "#FF9800", entrega: "#9C27B0", finalizado: "#4CAF50", cancelado: "#F44336" };
  const max = Math.max(...STATUS_LIST.map((s) => orders.filter((o) => o.status === s).length), 1);
  const summary = document.getElementById("status-summary");
  if (summary) {
    summary.innerHTML = STATUS_LIST.map((s) => {
      const count = orders.filter((o) => o.status === s).length;
      const pct = (count / max) * 100;
      return `<div class="status-item">
        <span>${STATUS_LABELS[s]}</span>
        <div class="status-item__bar"><div class="status-item__bar-fill" style="width:${pct}%;background:${statusColors[s]}"></div></div>
        <strong>${count}</strong>
      </div>`;
    }).join("");
  }
}

function closeOrderModal() {
  document.getElementById("order-modal")?.classList.remove("active");
}

function viewOrder(id) {
  const order = Storage.getOrders().find((o) => String(o.id) === String(id));
  if (!order) return;
  const itemsHtml = (order.items || []).map((item) => {
    const subtotal = (Number(item.price) || 0) * (Number(item.qty) || 1);
    return `<article class="order-detail__item">
      <h4>${escapeHtml(item.name || "")}</h4>
      <div class="order-detail__meta">
        <span><strong>Qtd:</strong> ${escapeHtml(item.qty ?? 1)}</span>
        ${item.price != null && item.price !== "" ? `<span><strong>Unitário:</strong> ${money(item.price)}</span>` : ""}
        <span><strong>Subtotal:</strong> ${money(subtotal)}</span>
      </div>
    </article>`;
  }).join("") || `<p class="order-detail__notes">Sem itens listados.</p>`;

  const box = document.getElementById("order-modal-box");
  if (!box) return;
  box.innerHTML = `
    <h3>Pedido ${escapeHtml(order.number || "")}</h3>
    <div class="order-detail">
      <div class="order-detail__header">
        <div>${statusBadge(order.status)}</div>
        <p><i class="fas fa-clock"></i> ${escapeHtml(formatDate(orderWhen(order)))}</p>
      </div>
      <div class="order-detail__client">
        <h4><i class="fas fa-user"></i> Cliente</h4>
        <p><strong>${escapeHtml(order.clientName || "—")}</strong></p>
        ${whatsappLink(order.clientWhatsapp)}
        ${order.payment ? `<p><i class="fas fa-credit-card"></i> ${escapeHtml(order.payment)}</p>` : ""}
        ${order.desiredDate ? `<p><i class="fas fa-calendar"></i> Entrega/retirada: ${escapeHtml(order.desiredDate)}</p>` : ""}
        ${order.receiveMethod ? `<p><i class="fas fa-truck"></i> ${escapeHtml(order.receiveMethod)}</p>` : ""}
        ${order.deliveryAddress ? `<p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.deliveryAddress)}</p>` : ""}
        ${order.notes ? `<p class="order-detail__notes">${escapeHtml(order.notes)}</p>` : ""}
      </div>
      <h4><i class="fas fa-ice-cream"></i> Itens do pedido</h4>
      <div class="order-detail__items">${itemsHtml}</div>
      <div class="order-detail__total">
        <span>Total do pedido</span>
        <strong>${money(order.total)}</strong>
      </div>
      <div class="form-group" style="margin-top:14px">
        <label>Status</label>
        <select data-status="${escapeHtml(order.id)}">
          ${STATUS_LIST.map((s) => `<option value="${s}" ${order.status === s ? "selected" : ""}>${STATUS_LABELS[s]}</option>`).join("")}
        </select>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--secondary" id="order-modal-close">Fechar</button>
      </div>
    </div>
  `;
  document.getElementById("order-modal").classList.add("active");
}

function initOrderFilters() {
  document.getElementById("order-status-tabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest(".filter-tab");
    if (!tab) return;
    document.querySelectorAll("#order-status-tabs .filter-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    orderFilter = tab.dataset.status || "all";
    renderOrders();
  });
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

function financeLedger() {
  const orders = Storage.getOrders();
  const fromOrders = (orders || []).filter((o) => o.status !== "cancelado" && Number(o.total) > 0).map((o) => {
    const when = String(o.orderedAt || "");
    const date = /^\d{4}-\d{2}-\d{2}/.test(when) ? when.slice(0, 10) : when.slice(0, 10);
    return {
      id: "fin-" + (o.id || o.number || ""),
      type: "entrada",
      amount: Number(o.total || 0),
      description: ["Reserva", o.number, o.clientName, o.payment].filter(Boolean).join(" · "),
      date,
      orderId: o.id || "",
    };
  });
  const finance = Storage.getFinance() || [];
  const seen = new Set();
  const out = [];
  finance.forEach((f) => {
    const oid = String(f.orderId || "");
    if (oid) seen.add(oid);
    const fid = String(f.id || "");
    if (fid.startsWith("fin-")) seen.add(fid.slice(4));
    out.push(f);
  });
  fromOrders.forEach((f) => {
    if (f.orderId && seen.has(f.orderId)) return;
    out.push(f);
    if (f.orderId) seen.add(f.orderId);
  });
  return out;
}

function renderAll() {
  const orders = Storage.getOrders();
  const clients = Storage.getClients();
  const products = Storage.getAllProducts();
  const finance = financeLedger();
  const entradas = finance.filter((f) => f.type === "entrada").reduce((s, f) => s + Number(f.amount || 0), 0);
  const saidas = finance.filter((f) => f.type === "saida" || f.type === "saída").reduce((s, f) => s + Number(f.amount || 0), 0);
  const sales = entradas - saidas;
  document.getElementById("stat-orders").textContent = String(orders.length);
  document.getElementById("stat-sales").textContent = money(sales);
  document.getElementById("stat-clients").textContent = String(clients.length);
  document.getElementById("stat-products").textContent = String(products.filter((p) => p.active !== false).length);

  renderDashOrders();
  renderOrders();

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
  const finIn = document.getElementById("fin-in");
  const finOut = document.getElementById("fin-out");
  const finBal = document.getElementById("fin-bal");
  if (finIn) finIn.textContent = money(entradas);
  if (finOut) finOut.textContent = money(saidas);
  if (finBal) finBal.textContent = money(sales);
  document.getElementById("finance-body").innerHTML = finance.map((f) => {
    const d = String(f.date || "");
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const nice = m ? `${m[3]}/${m[2]}/${m[1]}` : d;
    return `<tr><td>${escapeHtml(nice)}</td><td>${escapeHtml(f.type === "entrada" ? "Entrada" : "Saída")}</td><td>${escapeHtml(f.description || "")}</td><td>${money(f.amount)}</td></tr>`;
  }).join("") || `<tr><td colspan="4">Nenhuma reserva ainda para contar.</td></tr>`;

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
  if (!sel || sel.tagName !== "SELECT") return;
  try {
    await Storage.setOrderStatusAsync(sel.dataset.status, sel.value);
    toast("Status atualizado");
    renderAll();
    if (document.getElementById("order-modal")?.classList.contains("active")) {
      viewOrder(sel.dataset.status);
    }
  } catch (err) {
    toast(err.message || "Falha ao atualizar status");
  }
});

document.body.addEventListener("click", (e) => {
  if (e.target.closest("#order-modal-close")) {
    closeOrderModal();
    return;
  }
  if (e.target.closest("a[href]")) return;
  const view = e.target.closest("[data-view-order]");
  if (view) viewOrder(view.dataset.viewOrder);
});

document.getElementById("order-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "order-modal") closeOrderModal();
});

document.getElementById("btn-refresh-orders")?.addEventListener("click", async () => {
  try {
    await Storage.initCloud({ full: true });
    renderAll();
    toast("Pedidos atualizados");
  } catch {
    renderAll();
    toast("Atualizado neste aparelho");
  }
});

initOrderFilters();
window.viewOrder = viewOrder;
window.closeOrderModal = closeOrderModal;

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
