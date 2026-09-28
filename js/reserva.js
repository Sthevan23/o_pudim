(function () {
  const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
  }

  document.getElementById("qty-minus").addEventListener("click", () => {
    NatalCart.write(NatalCart.count() - 1);
    render();
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    NatalCart.add(1);
    render();
  });

  document.getElementById("reserva-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const qty = NatalCart.count();
    if (qty < 1) return;
    const btn = document.getElementById("reserva-submit");
    const msg = document.getElementById("reserva-msg");
    btn.disabled = true;
    msg.hidden = true;
    const payload = {
      action: "create_reserva",
      reserva: {
        customerName: document.getElementById("r-name").value.trim(),
        phone: document.getElementById("r-phone").value.trim(),
        qty,
        payment: document.getElementById("r-pay").value,
        desiredDate: document.getElementById("r-date").value,
        receiveMethod: document.getElementById("r-receive").value,
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
      if (!res.ok || !data.ok) throw new Error(data.error || "Não foi possível gravar a reserva.");
      NatalCart.write(0);
      document.getElementById("checkout-box").innerHTML = `
        <h2>Reserva confirmada</h2>
        <p>Pedido <strong>${data.number}</strong> recebido. Nossa equipe confirma os pedidos em 20/12/2026.</p>
        <p style="margin-top:1rem"><a class="btn btn--primary" href="index.html">Voltar ao site</a></p>`;
      render();
    } catch (err) {
      msg.hidden = false;
      msg.textContent = err.message || "Falha ao enviar. Importe api/reservas_natal.sql no phpMyAdmin.";
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
