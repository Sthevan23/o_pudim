const NatalCart = (() => {
  const KEY = "opudim_natal_cart";
  const PRODUCT = {
    id: "p-natal",
    name: "Pudim Tradicional Família",
    price: 65,
    image: "products/natal-familia.png",
    weight: "1,1 kg",
  };

  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      const qty = Math.max(0, Math.min(20, Number(raw?.qty) || 0));
      return { qty };
    } catch {
      return { qty: 0 };
    }
  }

  function write(qty) {
    const next = Math.max(0, Math.min(20, Number(qty) || 0));
    if (next <= 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ qty: next, id: PRODUCT.id }));
    paint();
    return next;
  }

  function add(n = 1) {
    return write(read().qty + n);
  }

  function count() {
    return read().qty;
  }

  function total() {
    return count() * PRODUCT.price;
  }

  function paint() {
    const qty = count();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(qty);
      el.hidden = qty <= 0;
    });
    document.querySelectorAll("[data-cart-link]").forEach((el) => {
      el.classList.toggle("has-items", qty > 0);
    });
  }

  document.addEventListener("DOMContentLoaded", paint);

  return { PRODUCT, read, write, add, count, total, paint };
})();
