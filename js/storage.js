/**
 * storage.js — O! Pudim
 * Cardápio: catalog.json (leve) + MySQL via api/data.php
 */
const Storage = (() => {
  const PUBLIC_CACHE_KEY = 'opudim_public_catalog_v1';
  const ADMIN_KEY = 'opudim_admin_data_v1';
  const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname || '');

  const API = (() => {
    const path = window.location.pathname || '';
    if (path.includes('/admin/')) return path.replace(/\/admin\/.*$/, '/api/data.php');
    if (path.endsWith('/')) return path + 'api/data.php';
    return path.replace(/\/[^/]*$/, '/api/data.php');
  })();

  const CATALOG = API.replace(/api\/data\.php(?:\?.*)?$/, 'catalog.json');
  const UPLOAD = API.replace(/data\.php(?:\?.*)?$/, 'upload.php');

  let memoryData = null;
  let cloudEnabled = false;

  function emptyStore() {
    return JSON.parse(JSON.stringify(typeof OPUDIM_DEFAULT_DATA !== 'undefined' ? OPUDIM_DEFAULT_DATA : {
      version: 1, settings: {}, auth: {}, categories: [], products: [], reviews: [], gallery: [], clients: [], orders: [], finance: [],
    }));
  }

  function setMemory(data) {
    memoryData = data;
    try { localStorage.setItem(ADMIN_KEY, JSON.stringify(data)); } catch { /* quota */ }
  }

  function getData() {
    if (memoryData) return memoryData;
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      if (raw) {
        memoryData = JSON.parse(raw);
        return memoryData;
      }
    } catch { /* ignore */ }
    memoryData = emptyStore();
    return memoryData;
  }

  function adminPassword() {
    return sessionStorage.getItem('admin_password') || '';
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, { cache: 'no-store', ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Falha na API');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function loadCatalog() {
    try {
      const data = await fetchJson(CATALOG + (CATALOG.includes('?') ? '&' : '?') + 't=' + Date.now());
      if (data && Array.isArray(data.products)) {
        try {
          const extra = await fetchJson(API + (API.includes('?') ? '&' : '?') + 'action=partners&t=' + Date.now());
          if (extra && extra.partners) data.partners = extra.partners;
        } catch { /* catalog já tem o fallback */ }
        try { localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch { /* ignore */ }
        const merged = { ...emptyStore(), ...data, products: data.products, settings: { ...emptyStore().settings, ...(data.settings || {}) } };
        memoryData = merged;
        return merged;
      }
    } catch { /* fallback */ }

    try {
      const cached = JSON.parse(localStorage.getItem(PUBLIC_CACHE_KEY) || 'null');
      if (cached && Array.isArray(cached.products)) {
        memoryData = { ...emptyStore(), ...cached };
        return memoryData;
      }
    } catch { /* ignore */ }

    memoryData = emptyStore();
    return memoryData;
  }

  async function loginAsync(email, password) {
    const data = await fetchJson(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });
    if (!data || !data.ok) return { ok: false };
    sessionStorage.setItem('admin_password', password);
    setMemory(data.data);
    cloudEnabled = true;
    return { ok: true, data: data.data };
  }

  async function initCloud({ full = false } = {}) {
    if (!full) {
      await loadCatalog();
      return memoryData;
    }
    const password = adminPassword();
    if (!password) {
      await loadCatalog();
      return memoryData;
    }
    try {
      const data = await fetchJson(API + (API.includes('?') ? '&' : '?') + 'full=1', {
        headers: { 'X-Admin-Password': password },
      });
      try {
        const extra = await fetchJson(API + (API.includes('?') ? '&' : '?') + 'action=partners&t=' + Date.now());
        if (extra && extra.partners) data.partners = extra.partners;
      } catch { /* usa os do catalog */ }
      setMemory(data);
      cloudEnabled = true;
      return data;
    } catch {
      cloudEnabled = false;
      try {
        const file = await fetchJson(API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': password,
          },
          body: JSON.stringify({ action: 'list_reservas', password }),
        });
        const data = getData();
        if (Array.isArray(file.orders)) data.orders = file.orders;
        try {
          const extra = await fetchJson(API + (API.includes('?') ? '&' : '?') + 'action=partners&t=' + Date.now());
          if (extra && extra.partners) data.partners = extra.partners;
        } catch { /* ignore */ }
        setMemory(data);
        return data;
      } catch {
        return getData();
      }
    }
  }

  async function postAction(body) {
    return fetchJson(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword(),
      },
      body: JSON.stringify(body),
    });
  }

  async function saveProductAsync(product) {
    const res = await postAction({ action: 'save_product', product, password: adminPassword() });
    if (res.product) {
      const data = getData();
      const idx = data.products.findIndex((p) => p.id === res.product.id);
      if (idx >= 0) data.products[idx] = res.product;
      else data.products.push(res.product);
      setMemory(data);
    }
    return res;
  }

  async function deleteProductAsync(id) {
    const res = await postAction({ action: 'delete_product', id, password: adminPassword() });
    const data = getData();
    data.products = data.products.filter((p) => p.id !== id);
    setMemory(data);
    return res;
  }

  async function setProductActiveAsync(id, active) {
    const res = await postAction({ action: 'set_product_active', id, active, password: adminPassword() });
    const data = getData();
    const p = data.products.find((x) => x.id === id);
    if (p) p.active = active;
    setMemory(data);
    return res;
  }

  async function saveAllAsync() {
    return postAction({ data: getData(), password: adminPassword() });
  }

  async function createOrderAsync(order, client) {
    return postAction({ action: 'create_order', order, client });
  }

  async function setOrderStatusAsync(id, status) {
    const res = await postAction({ action: 'set_order_status', id, status, password: adminPassword() });
    const data = getData();
    const o = (data.orders || []).find((x) => x.id === id);
    if (o) o.status = status;
    setMemory(data);
    return res;
  }

  async function uploadImage(file, folder) {
    const form = new FormData();
    form.append('image', file);
    if (folder) form.append('folder', folder);
    const res = await fetch(UPLOAD, {
      method: 'POST',
      headers: { 'X-Admin-Password': adminPassword() },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Falha no upload');
    return data.path;
  }

  async function savePartnersAsync(partners) {
    const res = await postAction({ action: 'save_partners', partners, password: adminPassword() });
    const data = getData();
    data.partners = res.partners || partners;
    setMemory(data);
    return res;
  }

  function getPartners() {
    const p = getData().partners;
    if (p && (Array.isArray(p.pudins) || Array.isArray(p.gelatos))) {
      return { pudins: p.pudins || [], gelatos: p.gelatos || [] };
    }
    const d = (typeof OPUDIM_DEFAULT_DATA !== 'undefined' && OPUDIM_DEFAULT_DATA.partners) || {};
    return { pudins: d.pudins || [], gelatos: d.gelatos || [] };
  }

  async function publishCatalogAsync() {
    return postAction({ action: 'publish_catalog', password: adminPassword() });
  }

  async function getVisitStatsAsync() {
    const sep = API.includes('?') ? '&' : '?';
    return fetchJson(API + sep + 'action=visits', {
      headers: { 'X-Admin-Password': adminPassword() },
    });
  }

  function pingVisit() {
    if (/\/admin\//.test(location.pathname || '')) return;
    try {
      const key = 'opudim_vid';
      let id = localStorage.getItem(key);
      if (!id) {
        id = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : (Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
        localStorage.setItem(key, id);
      }
      const visitUrl = API.replace(/data\.php(?:\?.*)?$/, 'visit.php');
      fetch(visitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: id,
          path: (location.pathname || '/') + (location.search || '') + (location.hash || ''),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* ignore */ }
  }

  if (!/\/admin\//.test(location.pathname || '')) {
    setTimeout(pingVisit, 500);
  }

  function getSettings() { return getData().settings || {}; }
  function getProducts() { return (getData().products || []).filter((p) => p && p.active !== false); }
  function getAllProducts() { return getData().products || []; }
  function getCategories() { return getData().categories || []; }
  function getGallery() { return getData().gallery || []; }
  function getReviews() { return getData().reviews || []; }
  function getOrders() { return getData().orders || []; }
  function getClients() { return getData().clients || []; }
  function getFinance() { return getData().finance || []; }
  function isCloudEnabled() { return cloudEnabled; }
  function productDisplayPrice(p) {
    if (p?.promoActive && p.promoPrice != null) return Number(p.promoPrice);
    return Number(p?.price) || 0;
  }
  function categoryName(id) {
    return (getCategories().find((c) => c.id === id) || {}).name || '';
  }

  function waLink(text) {
    const s = getSettings();
    const num = String(s.whatsapp || '').replace(/\D/g, '');
    const msg = encodeURIComponent(text || s.whatsappMessage || 'Olá! Gostaria de fazer um pedido.');
    return `https://wa.me/${num}?text=${msg}`;
  }

  return {
    API, loadCatalog, loginAsync, initCloud, saveProductAsync, deleteProductAsync,
    setProductActiveAsync, saveAllAsync, createOrderAsync, setOrderStatusAsync,
    uploadImage, publishCatalogAsync, getVisitStatsAsync, pingVisit,
    savePartnersAsync, getPartners,
    getData, getSettings, getProducts, getAllProducts, getCategories,
    getGallery, getReviews, getOrders, getClients, getFinance, isCloudEnabled,
    productDisplayPrice, categoryName, waLink, setMemory, getDataStore: getData,
  };
})();
