import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, uploadFile } from "../../services/api";
import { mediaUrl, money } from "../../utils/format";
import type { Category, Product } from "../../types";
import { Button, Confirm, EmptyState, Input, Modal, Select, Textarea } from "../../components/ui/Ui";

const empty = { name: "", description: "", price: "", promotionalPrice: "", categoryId: "", stock: "0", isAvailable: true, isFeatured: false, imageUrl: "" };

export function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = () => api.get<Product[]>("/admin/products", { params: { q, categoryId } }).then(({ data }) => setItems(data));
  useEffect(() => { api.get<Category[]>("/admin/categories").then(({ data }) => setCategories(data)); }, []);
  useEffect(() => { void load(); }, [q, categoryId]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      promotionalPrice: form.promotionalPrice ? Number(form.promotionalPrice) : null,
      stock: Number(form.stock),
    };
    if (editing) await api.patch(`/admin/products/${editing}`, payload);
    else await api.post("/admin/products", payload);
    toast.success("Produto salvo.");
    setOpen(false);
    setEditing(null);
    setForm(empty);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Produtos</h1>
        <Button onClick={() => { setEditing(null); setForm({ ...empty, categoryId: categories[0]?.id ?? "" }); setOpen(true); }} className="bg-[#5a3825] text-white">Adicionar</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="field max-w-xs" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field max-w-xs" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {items.length === 0 ? <EmptyState title="Nenhum produto" text="Cadastre o primeiro sabor da vitrine." /> : (
        <div className="overflow-x-auto card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-stone-400"><tr>{["Foto", "Nome", "Categoria", "Preço", "Estoque", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">{p.imageUrl ? <img src={mediaUrl(p.imageUrl)} alt="" className="h-12 w-12 rounded-xl object-cover" /> : "—"}</td>
                  <td className="px-4 py-3">{p.name}{p.isFeatured ? <span className="ml-2 text-[10px] uppercase text-amber-700">destaque</span> : null}</td>
                  <td className="px-4 py-3">{p.category?.name}</td>
                  <td className="px-4 py-3">{money(p.promotionalPrice ?? p.price)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">{p.isAvailable ? "Ativo" : "Inativo"}</td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <button className="text-xs" onClick={() => api.post(`/admin/products/${p.id}/toggle`).then(load)}>{p.isAvailable ? "Desativar" : "Ativar"}</button>
                    <button className="text-xs" onClick={() => api.post(`/admin/products/${p.id}/duplicate`).then(() => { toast.success("Duplicado"); load(); })}>Duplicar</button>
                    <button className="text-xs" onClick={() => { setEditing(p.id); setForm({ name: p.name, description: p.description, price: String(p.price), promotionalPrice: p.promotionalPrice ? String(p.promotionalPrice) : "", categoryId: p.categoryId, stock: String(p.stock), isAvailable: p.isAvailable, isFeatured: p.isFeatured, imageUrl: p.imageUrl ?? "" }); setOpen(true); }}>Editar</button>
                    <button className="text-xs text-red-600" onClick={() => setRemoveId(p.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} title={editing ? "Editar produto" : "Novo produto"} onClose={() => setOpen(false)} wide>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Categoria" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="md:col-span-2"><Textarea label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Input label="Preço" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Preço promocional" type="number" step="0.01" value={form.promotionalPrice} onChange={(e) => setForm({ ...form, promotionalPrice: e.target.value })} />
          <Input label="Estoque" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <label className="text-sm">Imagem
            <input type="file" accept="image/*" className="mt-1 block w-full text-xs" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = await uploadFile(file);
              setForm((f) => ({ ...f, imageUrl: url }));
            }} />
          </label>
          {form.imageUrl ? <img src={mediaUrl(form.imageUrl)} alt="" className="h-20 rounded-xl object-cover" /> : null}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} /> Disponível</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Destaque</label>
          <div className="md:col-span-2 flex justify-end"><Button className="bg-[#5a3825] text-white" type="submit">Salvar</Button></div>
        </form>
      </Modal>
      <Confirm open={Boolean(removeId)} title="Excluir produto" text="Essa ação não pode ser desfeita." onClose={() => setRemoveId(null)} onConfirm={async () => { await api.delete(`/admin/products/${removeId}`); setRemoveId(null); toast.success("Excluído"); load(); }} />
    </div>
  );
}

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const load = () => api.get<Category[]>("/admin/categories").then(({ data }) => setItems(data));
  useEffect(() => { void load(); }, []);
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><h1 className="font-serif text-3xl">Categorias</h1><Button className="bg-[#5a3825] text-white" onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "" }); setOpen(true); }}>Adicionar</Button></div>
      <div className="card overflow-hidden">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-stone-100 px-4 py-3 text-sm">
            <div><p>{c.name}</p><p className="text-xs text-stone-400">{c._count?.products ?? 0} produtos · /{c.slug}</p></div>
            <div className="space-x-2">
              <button onClick={() => { setEditing(c.id); setForm({ name: c.name, slug: c.slug, description: c.description ?? "" }); setOpen(true); }}>Editar</button>
              <button className="text-red-600" onClick={async () => { await api.delete(`/admin/categories/${c.id}`); load(); }}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} title="Categoria" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); if (editing) await api.patch(`/admin/categories/${editing}`, form); else await api.post("/admin/categories", form); setOpen(false); load(); }}>
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/\s+/g, "-") })} required />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <Textarea label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button className="bg-[#5a3825] text-white" type="submit">Salvar</Button>
        </form>
      </Modal>
    </div>
  );
}
