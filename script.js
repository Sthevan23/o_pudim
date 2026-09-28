(function () {
  const hidePrices = true;
  let category = "todos";

  function money(n) {
    return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function wa(text) {
    return Storage.waLink(text);
  }

  function updateCartBadge() {
    const el = document.getElementById("cart-count");
    if (el) el.textContent = String(PudimCart.count());
  }

  function productCard(product, categoryName) {
    return `
      <article class="card">
        <img src="${product.image || "products/morango.png"}" alt="${product.name}" loading="lazy">
        <div class="card__body">
          <p class="card__cat">${categoryName || ""}</p>
          <h3>${product.name}</h3>
          <p>${product.description || ""}</p>
          <div class="card__actions">
            <button class="btn btn--primary" data-add="${product.id}">Quero esse</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const settings = Storage.getSettings();
    const products = Storage.getProducts();
    const categories = Storage.getCategories();
    const catName = (id) => (categories.find((c) => c.id === id) || {}).name || "";

    document.title = `Pudins artesanais | ${settings.name || "O! Pudim"}`;
    const brand = document.getElementById("brand-name");
    if (brand) brand.textContent = settings.name || "O! Pudim";
    const logo = document.getElementById("brand-logo");
    if (logo && settings.logo) logo.src = settings.logo;
    const badge = document.getElementById("hero-badge");
    if (badge) badge.textContent = settings.heroBadge || "Receitas artesanais";
    const title = document.getElementById("hero-title");
    if (title && settings.tagline) title.textContent = settings.tagline;
    const heroImg = document.getElementById("hero-image");
    if (heroImg) heroImg.src = settings.banner || products[0]?.image || heroImg.src;
    const sobreImg = document.getElementById("sobre-image");
    if (sobreImg) sobreImg.src = settings.sobreImage || sobreImg.src;
    const sobreText = document.getElementById("sobre-text");
    if (sobreText) sobreText.textContent = [settings.sobreText1, settings.sobreText2].filter(Boolean).join(" ");
    const addr = document.getElementById("contact-address");
    if (addr) addr.textContent = settings.address || "Dianópolis — TO";
    const hours = document.getElementById("contact-hours");
    if (hours) hours.textContent = settings.hours || "";
    const ig = document.getElementById("ig-link");
    if (ig) {
      ig.href = settings.instagram || ig.href;
      ig.innerHTML = `<i class="fab fa-instagram"></i> ${settings.instagramUser || "@opudimgold"}`;
    }

    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    ["nav-wa", "hero-wa", "contact-wa", "wa-float"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.href = wa(settings.whatsappMessage);
    });

    const filter = document.getElementById("category-filter");
    if (filter) {
      const buttons = [{ id: "todos", name: "Todos" }, ...categories];
      filter.innerHTML = buttons.map((c) => `<button class="filter${category === c.id ? " is-active" : ""}" data-cat="${c.id}">${c.name}</button>`).join("");
    }

    const visible = category === "todos" ? products : products.filter((p) => p.categoryId === category);
    const grid = document.getElementById("products-grid");
    if (grid) grid.innerHTML = visible.map((p) => productCard(p, catName(p.categoryId))).join("");

    const best = products.filter((p) => p.bestSeller || p.featured).slice(0, 6);
    const bestGrid = document.getElementById("bestsellers-grid");
    if (bestGrid) bestGrid.innerHTML = best.map((p) => productCard(p, catName(p.categoryId))).join("");

    const gal = document.getElementById("gallery-grid");
    if (gal) {
      gal.innerHTML = (Storage.getGallery() || []).map((src) => `<button data-lite="${src}"><img src="${src}" alt="" loading="lazy"></button>`).join("");
    }

    const reviews = document.getElementById("reviews-grid");
    if (reviews) {
      reviews.innerHTML = (Storage.getReviews() || []).map((r) => `
        <article>
          <div class="stars">${"★".repeat(r.rating || 5)}</div>
          <p>“${r.text}”</p>
          <small>${r.author}</small>
        </article>`).join("");
    }

    updateCartBadge();
  }

  document.addEventListener("click", (e) => {
    const cat = e.target.closest("[data-cat]");
    if (cat) {
      category = cat.getAttribute("data-cat");
      render();
      return;
    }
    const add = e.target.closest("[data-add]");
    if (add) {
      const product = Storage.getProducts().find((p) => p.id === add.getAttribute("data-add"));
      if (!product) return;
      PudimCart.add(product, 1);
      updateCartBadge();
      const t = document.getElementById("site-toast");
      if (t) {
        t.classList.add("show");
        clearTimeout(t._hide);
        t._hide = setTimeout(() => t.classList.remove("show"), 1600);
      }
      return;
    }
    const lite = e.target.closest("[data-lite]");
    if (lite) {
      const box = document.getElementById("lightbox");
      box.hidden = false;
      box.innerHTML = `<img src="${lite.getAttribute("data-lite")}" alt="">`;
    }
    if (e.target.id === "lightbox") e.target.hidden = true;
  });

  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  toggle?.addEventListener("click", () => menu.classList.toggle("is-open"));
  menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => menu.classList.remove("is-open")));

  const reveal = () => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  };
  reveal();

  window.addEventListener("scroll", () => {
    document.getElementById("header")?.classList.toggle("header--scrolled", window.scrollY > 12);
  });

  Storage.loadCatalog().then(render).catch(render);
  PudimCart.onChange(updateCartBadge);
  updateCartBadge();
})();
