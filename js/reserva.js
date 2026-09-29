(function () {
  const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const val = (id) => (document.getElementById(id)?.value || "").trim();

  function isEntrega() {
    return val("r-receive") === "Entrega";
  }

  function toggleAddress() {
    const box = document.getElementById("r-address-block");
    const on = isEntrega();
    box.hidden = !on;
    ["r-street", "r-number", "r-bairro", "r-city"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.required = on;
      if (on && id === "r-city" && !el.value.trim()) el.value = "Lagoa da Prata";
    });
  }

  function deliveryAddress() {
    if (!isEntrega()) return "";
    const street = val("r-street");
    const number = val("r-number");
    const bairro = val("r-bairro");
    const comp = val("r-comp");
    const city = val("r-city");
    const ref = val("r-ref");
    const parts = [];
    const line = [street, number].filter(Boolean).join(", ");
    if (line) parts.push(line);
    if (bairro) parts.push(bairro);
    if (city) parts.push(city);
    if (comp) parts.push(comp);
    if (ref) parts.push("Ref.: " + ref);
    return parts.join(" · ");
  }

  function render() {
    const qty = NatalCart.count();
    const empty = document.getElementById("cart-empty");
    const item = document.getElementById("cart-item");
    const box = document.getElementById("checkout-box");
    const has = qty > 0;
    empty.hidden = has;
    item.hidden = !has;
    box.hidden = !has;
    document.getElementById("cart-qty").textContent = String(qty);
    document.getElementById("cart-line").textContent = money(NatalCart.total());
    document.getElementById("cart-total").textContent = money(NatalCart.total());
    const minus = document.getElementById("qty-minus");
    const plus = document.getElementById("qty-plus");
    if (minus) minus.disabled = qty <= 0;
    if (plus) plus.disabled = qty >= 20;
  }

  document.getElementById("qty-minus").addEventListener("click", () => {
    NatalCart.write(NatalCart.count() - 1);
    render();
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    NatalCart.add(1);
    render();
  });
  document.getElementById("r-receive").addEventListener("change", toggleAddress);
  toggleAddress();

  document.getElementById("reserva-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const qty = NatalCart.count();
    if (qty < 1) return;
    if (isEntrega() && (!val("r-street") || !val("r-number") || !val("r-bairro") || !val("r-city"))) {
      return;
    }
    const btn = document.getElementById("reserva-submit");
    const msg = document.getElementById("reserva-msg");
    btn.disabled = true;
    msg.hidden = true;
    const address = deliveryAddress();
    const payload = {
      action: "create_reserva",
      reserva: {
        customerName: val("r-name"),
        phone: val("r-phone"),
        qty,
        payment: val("r-pay"),
        desiredDate: val("r-date"),
        receiveMethod: val("r-receive"),
        street: val("r-street"),
        number: val("r-number"),
        neighborhood: val("r-bairro"),
        complement: val("r-comp"),
        city: val("r-city"),
        reference: val("r-ref"),
        deliveryAddress: address,
        productId: NatalCart.PRODUCT.id,
        productName: NatalCart.PRODUCT.name,
        price: NatalCart.PRODUCT.price,
      },
    };
    try {
      const res = await fetch("api/data.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const why = data.detail || data.error || "Não foi possível gravar a reserva.";
        throw new Error(why);
      }
      NatalCart.write(0);
      document.getElementById("checkout-box").innerHTML = `
        <h2>Reserva confirmada</h2>
        <p>Pedido <strong>${data.number}</strong> recebido. Ele já aparece no painel.</p>
        <p style="margin-top:1rem"><a class="btn btn--primary" href="index.html">Voltar ao site</a></p>`;
      render();
    } catch (err) {
      const r = payload.reserva;
      const total = NatalCart.total().toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const lines = [
        "Reserva de Natal O! Pudim",
        `${qty}x Pudim Tradicional Família — ${total}`,
        `Nome: ${r.customerName}`,
        `WhatsApp: ${r.phone}`,
        `Pagamento: ${r.payment}`,
        `Data: ${r.desiredDate}`,
        `Receber: ${r.receiveMethod}`,
      ];
      if (address) lines.push(`Endereço: ${address}`);
      window.open(Storage.waLink(lines.join("\n")), "_blank", "noopener");
      msg.hidden = false;
      msg.textContent = "Não deu para gravar no painel. Abrimos o WhatsApp com a reserva para não perder o pedido.";
      btn.disabled = false;
    }
  });

  Storage.loadCatalog().then(() => {
    if (Storage.getSettings().showNatal === false) {
      window.location.replace("index.html");
      return;
    }
    render();
  }).catch(render);
})();
