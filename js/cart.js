window.PudimCart = (() => {
  const KEY = 'opudim_cart_v1';
  const CUSTOMER_KEY = 'opudim_customer_v1';
  let items = load();
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(items));
    listeners.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function add(product, qty = 1) {
    const id = product.id;
    const found = items.find((i) => i.productId === id);
    if (found) found.qty += qty;
    else {
      items.push({
        productId: id,
        name: product.name,
        image: product.image,
        price: Number(product.price || product.promoPrice || 0),
        qty,
      });
    }
    persist();
  }

  function setQty(productId, qty) {
    if (qty <= 0) {
      items = items.filter((i) => i.productId !== productId);
    } else {
      const found = items.find((i) => i.productId === productId);
      if (found) found.qty = qty;
    }
    persist();
  }

  function remove(productId) {
    items = items.filter((i) => i.productId !== productId);
    persist();
  }

  function clear() {
    items = [];
    persist();
  }

  function count() {
    return items.reduce((s, i) => s + i.qty, 0);
  }

  function subtotal() {
    return items.reduce((s, i) => s + i.qty * (Number(i.price) || 0), 0);
  }

  function getItems() {
    return items.slice();
  }

  function saveCustomer(data) {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
  }

  function loadCustomer() {
    try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}'); } catch { return {}; }
  }

  return { add, setQty, remove, clear, count, subtotal, getItems, onChange, saveCustomer, loadCustomer };
})();
