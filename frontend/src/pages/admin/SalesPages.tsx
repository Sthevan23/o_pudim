import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { formatDateTime, money, ORDER_STATUS, PAYMENT } from "../../utils/format";
import type { Customer, Order, OrderStatus, PaymentMethod, Product } from "../../types";
import { Badge, Button, Input, Modal, Select, Textarea } from "../../components/ui/Ui";

const tones: Record<string, "stone" | "green" | "amber" | "blue" | "red" | "violet"> = {
  NEW: "blue", CONFIRMED: "violet", PREPARING: "amber", READY: "green", DELIVERED: "stone", CANCELLED: "red",
};

export function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ customerId: "", paymentMethod: "PIX" as PaymentMethod, notes: "", items: [{ productId: "", quantity: 1 }] });

  const load = () => api.get<Order[]>("/admin/orders", { params: { status: status || undefined } }).then(({ data }) => setItems(data));
  useEffect(() => { void load(); }, [status]);
  useEffect(() => {
    api.get<Customer[]>("/admin/customers").then(({ data }) => setCustomers(data));
    api.get<Product[]>("/admin/products").then(({ data }) => setProducts(data));
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/admin/orders", { ...form, items: form.items.filter((i) => i.productId) });
    setOpen(false);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Pedidos</h1>
        <Button className="bg-[#5a3825] text-white" onClick={() => setOpen(true)}>Novo pedido</Button>
      </div>
      <select className="field max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Todos os status</option>
        {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-stone-400"><tr>{["Nº", "Cliente", "Itens", "Valor", "Pagamento", "Status", "Data"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-t border-stone-100">
                <td className="px-4 py-3"><Link className="underline" to={`/admin/pedidos/${o.id}`}>#{String(o.number).padStart(4, "0")}</Link></td>
                <td className="px-4 py-3">{o.customer.name}</td>
                <td className="px-4 py-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="px-4 py-3">{money(o.total)}</td>
                <td className="px-4 py-3">{PAYMENT[o.paymentMethod]}</td>
                <td className="px-4 py-3"><Badge tone={tones[o.status]}>{ORDER_STATUS[o.status]}</Badge></td>
                <td className="px-4 py-3">{formatDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="Novo pedido" onClose={() => setOpen(false)} wide>
        <form className="space-y-3" onSubmit={create}>
          <Select label="Cliente" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
            <option value="">Selecione</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {form.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2">
              <select className="field col-span-2" value={item.productId} onChange={(e) => {
                const items = [...form.items]; items[idx].productId = e.target.value; setForm({ ...form, items });
              }}>
                <option value="">Produto</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="field" type="number" min={1} value={item.quantity} onChange={(e) => {
                const items = [...form.items]; items[idx].quantity = Number(e.target.value); setForm({ ...form, items });
              }} />
            </div>
          ))}
          <button type="button" className="text-sm" onClick={() => setForm({ ...form, items: [...form.items, { productId: "", quantity: 1 }] })}>+ item</button>
          <Select label="Pagamento" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}>
            {Object.entries(PAYMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Textarea label="Observações" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button className="bg-[#5a3825] text-white" type="submit">Criar pedido</Button>
        </form>
      </Modal>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const load = () => api.get<Order>(`/admin/orders/${id}`).then(({ data }) => setOrder(data));
  useEffect(() => { void load(); }, [id]);
  if (!order) return null;
  return (
    <div className="space-y-5">
      <Link to="/admin/pedidos" className="text-sm text-stone-500">← Pedidos</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Pedido #{String(order.number).padStart(4, "0")}</h1>
        <select className="field max-w-xs" value={order.status} onChange={async (e) => { await api.patch(`/admin/orders/${order.id}/status`, { status: e.target.value as OrderStatus }); load(); }}>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5 text-sm space-y-1">
          <p className="font-medium">Cliente</p>
          <p>{order.customer.name}</p>
          <p>{order.customer.phone}</p>
          <p>{order.customer.email}</p>
        </div>
        <div className="card p-5 text-sm space-y-1">
          <p>Pagamento: {PAYMENT[order.paymentMethod]}</p>
          <p>Data: {formatDateTime(order.createdAt)}</p>
          <p>Status: {ORDER_STATUS[order.status]}</p>
        </div>
      </div>
      <div className="card p-5">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-stone-100 py-2 text-sm">
            <span>{item.quantity}× {item.product.name}</span>
            <span>{money(item.total)}</span>
          </div>
        ))}
        <p className="mt-3 text-right font-medium">Total {money(order.total)}</p>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const load = () => api.get<Customer[]>("/admin/customers", { params: { q } }).then(({ data }) => setItems(data));
  useEffect(() => { void load(); }, [q]);
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><h1 className="font-serif text-3xl">Clientes</h1><Button className="bg-[#5a3825] text-white" onClick={() => setOpen(true)}>Novo cliente</Button></div>
      <input className="field max-w-xs" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-stone-400"><tr>{["Nome", "Telefone", "Pedidos", "Valor gasto", "Último pedido"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3"><Link className="underline" to={`/admin/clientes/${c.id}`}>{c.name}</Link></td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c.ordersCount}</td>
                <td className="px-4 py-3">{money(c.totalSpent)}</td>
                <td className="px-4 py-3">{c.lastOrderAt ? formatDateTime(c.lastOrderAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="Novo cliente" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); await api.post("/admin/customers", form); setOpen(false); load(); }}>
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Textarea label="Observações" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button className="bg-[#5a3825] text-white" type="submit">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  useEffect(() => { api.get<Customer>(`/admin/customers/${id}`).then(({ data }) => setCustomer(data)); }, [id]);
  if (!customer) return null;
  return (
    <div className="space-y-5">
      <Link to="/admin/clientes" className="text-sm text-stone-500">← Clientes</Link>
      <h1 className="font-serif text-3xl">{customer.name}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4 text-sm">{customer.phone}<br />{customer.email}<br />{customer.address}</div>
        <div className="card p-4"><p className="text-xs text-stone-400">Valor gasto</p><p className="font-serif text-3xl">{money(customer.totalSpent)}</p></div>
        <div className="card p-4"><p className="text-xs text-stone-400">Pedidos</p><p className="font-serif text-3xl">{customer.ordersCount}</p></div>
      </div>
      <div className="card">
        {customer.orders?.map((o) => (
          <Link key={o.id} to={`/admin/pedidos/${o.id}`} className="flex justify-between border-b px-4 py-3 text-sm">
            <span>#{String(o.number).padStart(4, "0")} · {ORDER_STATUS[o.status]}</span>
            <span>{money(o.total)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
