import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { api, uploadFile } from "../../services/api";
import { formatDate, mediaUrl, money } from "../../utils/format";
import type { GalleryImage, Testimonial, Transaction } from "../../types";
import { Button, Confirm, Input, Modal, Select, Textarea } from "../../components/ui/Ui";

export function FinancePage() {
  const [period, setPeriod] = useState("this_month");
  const [summary, setSummary] = useState<{ income: number; expense: number; profit: number; ticketAverage: number; byDay: { date: string; income: number; expense: number }[]; byCategory: { category: string; amount: number }[]; categories: string[] } | null>(null);
  const [items, setItems] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "EXPENSE", category: "Ingredientes", description: "", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = () => {
    api.get("/admin/finance/dashboard", { params: { period } }).then(({ data }) => setSummary(data));
    api.get<Transaction[]>("/admin/finance", { params: { period } }).then(({ data }) => setItems(data));
  };
  useEffect(() => { load(); }, [period]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/admin/finance", { ...form, amount: Number(form.amount) });
    setOpen(false);
    load();
  };

  if (!summary) return null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="font-serif text-3xl">Financeiro</h1>
        <Button className="bg-[#5a3825] text-white" onClick={() => setOpen(true)}>Novo lançamento</Button>
      </div>
      <div className="flex gap-2">{["today", "7d", "30d", "this_month", "last_month"].map((p) => (
        <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1.5 text-xs ${period === p ? "bg-[#5a3825] text-white" : "bg-white"}`}>{p}</button>
      ))}</div>
      <div className="grid gap-4 md:grid-cols-4">
        {[["Faturamento bruto", summary.income], ["Despesas", summary.expense], ["Lucro", summary.profit], ["Ticket médio", summary.ticketAverage]].map(([l, v]) => (
          <div key={String(l)} className="card p-4"><p className="text-xs text-stone-400">{l}</p><p className="font-serif text-3xl">{money(Number(v))}</p></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Area dataKey="income" stroke="#5a3825" fill="#f5e6d3" />
              <Area dataKey="expense" stroke="#c58b5c" fill="#fff3ea" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={summary.byCategory} dataKey="amount" nameKey="category" outerRadius={90}>
                {summary.byCategory.map((_, i) => <Cell key={i} fill={["#5a3825", "#c58b5c", "#d4a574", "#8c5a3c", "#241a15"][i % 5]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="text-stone-400"><tr>{["Data", "Tipo", "Categoria", "Descrição", "Valor", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3">{formatDate(t.date)}</td>
                <td className="px-4 py-3">{t.type === "INCOME" ? "Receita" : "Despesa"}</td>
                <td className="px-4 py-3">{t.category}</td>
                <td className="px-4 py-3">{t.description}</td>
                <td className={`px-4 py-3 ${t.type === "EXPENSE" ? "text-red-600" : "text-emerald-700"}`}>{money(t.amount)}</td>
                <td className="px-4 py-3"><button className="text-red-600" onClick={() => setRemoveId(t.id)}>Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="Lançamento" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={save}>
          <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </Select>
          <Select label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {["Vendas", ...(summary.categories ?? [])].map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Input label="Valor" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Textarea label="Observação" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button className="bg-[#5a3825] text-white" type="submit">Salvar</Button>
        </form>
      </Modal>
      <Confirm open={Boolean(removeId)} title="Excluir lançamento" text="Confirma a exclusão?" onClose={() => setRemoveId(null)} onConfirm={async () => { await api.delete(`/admin/finance/${removeId}`); setRemoveId(null); load(); }} />
    </div>
  );
}

export function ReportsPage() {
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<{ revenue: number; expense: number; profit: number; ordersCount: number; ticketAverage: number; customersCount: number; topProducts: { name: string; quantity: number; total: number }[] } | null>(null);
  const load = () => api.get("/admin/reports", { params: { from, to } }).then(({ data: d }) => setData(d));
  useEffect(() => { void load(); }, []);
  const exportCsv = (type: string) => {
    api.get("/admin/reports/export", { params: { type, from, to }, responseType: "blob" }).then(({ data: blob }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `relatorio-${type}.csv`; a.click();
    });
  };
  if (!data) return null;
  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl">Relatórios</h1>
      <div className="flex flex-wrap gap-2">
        <input className="field max-w-[180px]" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="field max-w-[180px]" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="outline" onClick={load}>Filtrar</Button>
        <Button variant="outline" onClick={() => exportCsv("resumo")}>Exportar CSV</Button>
        <Button variant="outline" onClick={() => exportCsv("produtos")}>Produtos CSV</Button>
        <Button variant="outline" onClick={() => exportCsv("pedidos")}>Pedidos CSV</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[["Faturamento", data.revenue], ["Despesas", data.expense], ["Lucro", data.profit], ["Pedidos", data.ordersCount], ["Ticket médio", data.ticketAverage], ["Clientes", data.customersCount]].map(([l, v]) => (
          <div key={String(l)} className="card p-4"><p className="text-xs text-stone-400">{l}</p><p className="font-serif text-3xl">{typeof v === "number" && String(l) !== "Pedidos" && String(l) !== "Clientes" ? money(v) : v}</p></div>
        ))}
      </div>
      <div className="card p-4">
        <p className="mb-3 font-medium">Produtos mais vendidos</p>
        {data.topProducts.map((p) => (
          <div key={p.name} className="flex justify-between border-b py-2 text-sm"><span>{p.name}</span><span>{p.quantity} un · {money(p.total)}</span></div>
        ))}
      </div>
    </div>
  );
}

export function GalleryPage() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const load = () => api.get<GalleryImage[]>("/admin/gallery").then(({ data }) => setItems(data));
  useEffect(() => { void load(); }, []);
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><h1 className="font-serif text-3xl">Galeria</h1>
        <label className="btn bg-[#5a3825] text-white cursor-pointer">Adicionar foto
          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadFile(file);
            await api.post("/admin/gallery", { imageUrl: url, caption: file.name });
            load();
          }} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((img) => (
          <article key={img.id} className="card overflow-hidden">
            <img src={mediaUrl(img.imageUrl)} alt="" className="aspect-square object-cover" />
            <div className="flex justify-between p-2 text-xs">
              <button onClick={() => api.patch(`/admin/gallery/${img.id}`, { isPrimary: true }).then(load)}>Principal</button>
              <button className="text-red-600" onClick={() => api.delete(`/admin/gallery/${img.id}`).then(load)}>Excluir</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", text: "", rating: 5 });
  const load = () => api.get<Testimonial[]>("/admin/testimonials").then(({ data }) => setItems(data));
  useEffect(() => { void load(); }, []);
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><h1 className="font-serif text-3xl">Depoimentos</h1><Button className="bg-[#5a3825] text-white" onClick={() => setOpen(true)}>Novo</Button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((t) => (
          <article key={t.id} className="card p-4">
            <p className="font-medium">{t.name} · {t.rating}/5</p>
            <p className="mt-2 text-sm text-stone-600">{t.text}</p>
            <button className="mt-3 text-xs text-red-600" onClick={() => api.delete(`/admin/testimonials/${t.id}`).then(load)}>Excluir</button>
          </article>
        ))}
      </div>
      <Modal open={open} title="Depoimento" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); await api.post("/admin/testimonials", form); setOpen(false); load(); }}>
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Textarea label="Texto" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
          <Input label="Nota (1 a 5)" type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          <Button className="bg-[#5a3825] text-white" type="submit">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}

export function SettingsPage() {
  const [data, setData] = useState<{ company: { name: string; logoUrl?: string }; settings: Record<string, string>; content: Record<string, string> } | null>(null);
  const [diffs, setDiffs] = useState<{ id: string; title: string; description: string }[]>([]);
  useEffect(() => {
    api.get("/admin/settings").then(({ data: d }) => setData(d));
    api.get("/admin/differentiators").then(({ data: d }) => setDiffs(d));
  }, []);
  if (!data) return null;
  const save = async () => {
    await api.patch("/admin/settings", { company: { name: data.company.name, logoUrl: data.company.logoUrl }, settings: data.settings, content: data.content });
    await Promise.all(diffs.map((d) => api.patch(`/admin/differentiators/${d.id}`, d)));
    toast.success("Configurações salvas.");
  };
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Configurações</h1>
      <div className="card space-y-3 p-5">
        <h2 className="font-medium">Empresa</h2>
        <Input label="Nome" value={data.company.name} onChange={(e) => setData({ ...data, company: { ...data.company, name: e.target.value } })} />
        <label className="text-sm">Logo
          <input type="file" className="mt-1 block" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadFile(file);
            setData({ ...data, company: { ...data.company, logoUrl: url } });
          }} />
        </label>
        {data.company.logoUrl ? <img src={mediaUrl(data.company.logoUrl)} className="h-16 rounded-xl object-cover" alt="" /> : null}
        {["description", "whatsapp", "instagram", "phone", "address", "businessHours", "whatsappMessage"].map((key) => (
          <Input key={key} label={key} value={data.settings[key] ?? ""} onChange={(e) => setData({ ...data, settings: { ...data.settings, [key]: e.target.value } })} />
        ))}
      </div>
      <div className="card space-y-3 p-5">
        <h2 className="font-medium">Cores do site</h2>
        {["colorBackground", "colorPrimary", "colorSecondary", "colorCream", "colorText"].map((key) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm">
            {key.replace("color", "")}
            <input type="color" value={data.settings[key]} onChange={(e) => setData({ ...data, settings: { ...data.settings, [key]: e.target.value } })} />
          </label>
        ))}
      </div>
      <div className="card space-y-3 p-5">
        <h2 className="font-medium">Textos da vitrine</h2>
        {Object.keys(data.content).filter((k) => k !== "id" && k !== "companyId" && k !== "updatedAt").map((key) => (
          <Textarea key={key} label={key} value={data.content[key] ?? ""} onChange={(e) => setData({ ...data, content: { ...data.content, [key]: e.target.value } })} />
        ))}
      </div>
      <div className="card space-y-3 p-5">
        <h2 className="font-medium">Diferenciais</h2>
        {diffs.map((d, i) => (
          <div key={d.id} className="grid gap-2 md:grid-cols-2">
            <Input label="Título" value={d.title} onChange={(e) => setDiffs(diffs.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
            <Input label="Descrição" value={d.description} onChange={(e) => setDiffs(diffs.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} />
          </div>
        ))}
      </div>
      <Button className="bg-[#5a3825] text-white" onClick={save}>Salvar configurações</Button>
    </div>
  );
}
