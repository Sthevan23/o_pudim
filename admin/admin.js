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
  const titles = { dashboard: "Dashboard", pedidos: "Pedidos", produtos: "Produtos", clientes: "Clientes", financeiro: "Financeiro", config: "Configurações" };
  document.getElementById("page-title").textContent = titles[id] || "Painel";
  closeSidebar();
}

function orderCard(o) {
  return `
    <article class="order-card">
      <div class="order-card__top">
        <div>
          <strong>${o.number || "-"}</strong>
          <div>${o.clientName || ""}</div>
          <small>${o.clientWhatsapp || ""}</small>
        </div>
        <strong>${money(o.total)}</strong>
      </div>
      <div>${(o.items || []).map((i) => `${i.qty}x ${i.name}`).join(" · ") || "Sem itens"}</div>
      ${o.notes ? `<small>${o.notes}</small>` : ""}
      <select data-status="${o.id}">
        ${["novo","preparo","entrega","finalizado","cancelado"].map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </article>`;
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

  document.getElementById("products-body").innerHTML = products.map((p) => `
    <article class="product-card">
      <img src="${imgSrc(p.image)}" alt="${p.name || ""}">
      <h3>${p.name || ""}</h3>
      <p>${p.description || ""}</p>
      <div class="product-card__meta">
        <span>${Storage.categoryName(p.categoryId)} · ${money(Storage.productDisplayPrice(p))}</span>
        <span class="badge ${p.active === false ? "badge--off" : "badge--on"}">${p.active === false ? "oculto" : "visível"}</span>
      </div>
      <div class="product-card__actions">
        <button class="btn btn--secondary btn--sm" data-edit="${p.id}">Editar</button>
        <button class="btn btn--secondary btn--sm" data-toggle="${p.id}">${p.active === false ? "Mostrar" : "Ocultar"}</button>
        <button class="btn btn--danger btn--sm" data-del="${p.id}">Excluir</button>
      </div>
    </article>`).join("") || emptyHtml("Nenhum produto cadastrado.");

  document.getElementById("clients-body").innerHTML = clients.map((c) => `<tr><td>${c.name}</td><td>${c.phone || ""}</td><td>${c.email || ""}</td></tr>`).join("") || `<tr><td colspan="3">Nenhum cliente ainda.</td></tr>`;
  document.getElementById("finance-body").innerHTML = finance.map((f) => `<tr><td>${f.date || ""}</td><td>${f.type}</td><td>${f.description || ""}</td><td>${money(f.amount)}</td></tr>`).join("") || `<tr><td colspan="4">Sem lançamentos.</td></tr>`;

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
  document.getElementById("p-cat").innerHTML = Storage.getCategories().map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
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
  document.getElementById("modal-title").textContent = product ? "Editar produto" : "Novo produto";
  document.getElementById("product-modal").classList.add("active");
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
document.getElementById("modal-close").onclick = () => document.getElementById("product-modal").classList.remove("active");
document.getElementById("product-modal").addEventListener("click", (e) => {
  if (e.target.id === "product-modal") e.target.classList.remove("active");
});
document.getElementById("admin-email").textContent = sessionStorage.getItem("admin_email") || "";

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
    toast("Foto enviada");
  } catch (err) {
    toast(err.message || "Falha no upload");
  }
});

document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const product = {
    id: document.getElementById("p-id").value || undefined,
    name: document.getElementById("p-name").value.trim(),
    description: document.getElementById("p-desc").value.trim(),
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
    toast("Produto salvo");
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
  };
  Storage.setMemory(data);
  try {
    await Storage.saveAllAsync();
    toast("Configurações salvas");
  } catch (err) {
    toast(err.message || "Salvo neste aparelho. Confira o MySQL para a nuvem.");
  }
});

Storage.initCloud({ full: true }).then(renderAll).catch(() => {
  renderAll();
  toast("Painel no modo local — confira o MySQL");
});
