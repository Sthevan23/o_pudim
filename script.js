(function () {
  let category = "todos";

  function wa(text) {
    return Storage.waLink(text);
  }

  function productCard(product, categoryName) {
    return `
      <article class="card">
        <img src="${product.image || "products/morango.png"}" alt="${product.name}" loading="lazy">
        <div class="card__body">
          <p class="card__cat">${categoryName || ""}</p>
          <h3>${product.name}</h3>
          <p>${product.description || ""}</p>
        </div>
      </article>`;
  }

  function partnerCard(partner) {
    const name = partner.name || "";
    if (partner.logo) {
      return `
        <article class="partner-card">
          <img src="${partner.logo}" alt="${name}" loading="lazy">
          <p>${name}</p>
        </article>`;
    }
    return `<li>${name}</li>`;
  }

  function fillPartners(list, logosId, chipsId) {
    const items = list || [];
    const logosEl = document.getElementById(logosId);
    const chipsEl = chipsId ? document.getElementById(chipsId) : null;
    if (logosEl) {
      const logos = items.filter((p) => p.logo);
      if (logos.length) logosEl.innerHTML = logos.map(partnerCard).join("");
    }
    if (chipsEl) {
      chipsEl.innerHTML = items.filter((p) => !p.logo).map(partnerCard).join("");
    }
  }

  function render() {
    const settings = Storage.getSettings();
    const products = Storage.getProducts().filter((p) => p.id !== "p-natal");
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
    const t1 = document.getElementById("sobre-text-1");
    if (t1 && settings.sobreText1) t1.textContent = settings.sobreText1;
    const t2 = document.getElementById("sobre-text-2");
    if (t2 && settings.sobreText2) t2.textContent = settings.sobreText2;
    const t3 = document.getElementById("sobre-text-3");
    if (t3 && settings.sobreText3) t3.textContent = settings.sobreText3;
    const addr = document.getElementById("contact-address");
    if (addr) addr.textContent = settings.address || "Lagoa da Prata — MG";
    const hours = document.getElementById("contact-hours");
    if (hours) hours.textContent = settings.hours || "";
    const ig = document.getElementById("ig-link");
    if (ig) {
      ig.href = settings.instagram || ig.href;
      ig.innerHTML = `<i class="fab fa-instagram"></i> ${settings.instagramUser || "@opudimgold"}`;
    }

    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    ["nav-wa", "contact-wa", "wa-float"].forEach((id) => {
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

    const partners = (Storage.getData().partners && Storage.getData().partners.pudins)
      ? Storage.getData().partners
      : ((typeof OPUDIM_DEFAULT_DATA !== "undefined" && OPUDIM_DEFAULT_DATA.partners) || {});
    fillPartners(partners.pudins, "partners-pudins-logos", "partners-pudins-chips");
    fillPartners(partners.gelatos, "partners-gelatos-logos", null);

    const natalOn = settings.showNatal !== false;
    const natalSec = document.getElementById("natal");
    if (natalSec) natalSec.hidden = !natalOn;
    const navNatal = document.getElementById("nav-natal");
    if (navNatal) navNatal.hidden = !natalOn;
    const heroNatal = document.getElementById("hero-natal");
    if (heroNatal) heroNatal.hidden = !natalOn;
    const cart = document.getElementById("header-cart");
    if (cart) cart.hidden = !natalOn;
    const sabores = document.getElementById("hero-sabores");
    if (sabores) {
      sabores.classList.toggle("btn--primary", !natalOn);
      sabores.classList.toggle("btn--outline", natalOn);
    }
  }

  document.addEventListener("click", (e) => {
    const cat = e.target.closest("[data-cat]");
    if (cat) {
      category = cat.getAttribute("data-cat");
      render();
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

  const bagStage = document.getElementById("gift-bag-stage");
  const bag = document.getElementById("gift-bag");
  if (bagStage && bag && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    bagStage.addEventListener("mousemove", (e) => {
      const r = bagStage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      bag.style.animation = "none";
      bag.style.transform = `rotateY(${x * 28}deg) rotateX(${-y * 14}deg) translateY(-10px)`;
    });
    bagStage.addEventListener("mouseleave", () => {
      bag.style.animation = "";
      bag.style.transform = "";
    });
  }
  let natalQty = 1;
  const natalQtyEl = document.getElementById("natal-qty");
  const natalMinus = document.getElementById("natal-minus");
  const natalPlus = document.getElementById("natal-plus");
  function syncNatalQty() {
    if (natalQtyEl) natalQtyEl.textContent = String(natalQty);
    if (natalMinus) natalMinus.disabled = natalQty <= 1;
    if (natalPlus) natalPlus.disabled = natalQty >= 20;
  }
  natalMinus?.addEventListener("click", () => {
    natalQty = Math.max(1, natalQty - 1);
    syncNatalQty();
  });
  natalPlus?.addEventListener("click", () => {
    natalQty = Math.min(20, natalQty + 1);
    syncNatalQty();
  });
  syncNatalQty();
  document.getElementById("natal-add")?.addEventListener("click", () => {
    NatalCart.add(natalQty);
    window.location.href = "reserva.html";
  });
})();
