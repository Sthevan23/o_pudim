import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, uploadFile } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate, money } from "../../utils/format";
import type { CompanyRow } from "../../types";
import { Button, Input, Modal, Select } from "../../components/ui/Ui";

export function MasterDashboard() {
  const [data, setData] = useState<{ companies: number; active: number; inactive: number; products: number; orders: number; revenue: number; newCompanies: number } | null>(null);
  useEffect(() => { api.get("/master/dashboard").then(({ data: d }) => setData(d)); }, []);
  if (!data) return null;
  const cards = [
    ["Empresas cadastradas", data.companies],
    ["Empresas ativas", data.active],
    ["Empresas inativas", data.inactive],
    ["Total de produtos", data.products],
    ["Total de pedidos", data.orders],
    ["Faturamento geral", money(data.revenue)],
    ["Novos clientes (mês)", data.newCompanies],
  ];
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Visão geral</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-white/40">{l}</p>
            <p className="mt-2 font-serif text-3xl">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompaniesPage() {
  const [items, setItems] = useState<CompanyRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", ownerName: "", email: "", phone: "", password: "123456", slug: "", status: "ACTIVE", logoUrl: "" });
  const { applyToken } = useAuth();
  const navigate = useNavigate();
  const load = () => api.get<CompanyRow[]>("/master/companies").then(({ data }) => setItems(data));
  useEffect(() => { void load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/master/companies", form);
    toast.success("Empresa criada com vitrine, categorias e usuário admin.");
    setOpen(false);
    load();
  };

  const impersonate = async (id: string) => {
    const { data } = await api.post<{ token: string }>(`/master/companies/${id}/impersonate`);
    await applyToken(data.token);
    toast.success("Acesso ao painel da empresa registrado.");
    navigate("/admin");
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <h1 className="font-serif text-4xl">Empresas</h1>
        <Button className="bg-white text-black" onClick={() => setOpen(true)}>+ Nova empresa</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-white/40"><tr>{["Nome", "Responsável", "Telefone", "Produtos", "Pedidos", "Status", "Cadastro", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-white/10">
                <td className="px-4 py-3">{c.name}<div className="text-xs text-white/40">/{c.slug}</div></td>
                <td className="px-4 py-3">{c.ownerName}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c._count.products}</td>
                <td className="px-4 py-3">{c._count.orders}</td>
                <td className="px-4 py-3">{c.status === "ACTIVE" ? "Ativa" : "Inativa"}</td>
                <td className="px-4 py-3">{formatDate(c.createdAt)}</td>
                <td className="space-x-2 px-4 py-3">
                  <button className="rounded-full bg-white/10 px-3 py-1" onClick={() => impersonate(c.id)}>Entrar como administrador</button>
                  <button className="text-white/50" onClick={() => api.patch(`/master/companies/${c.id}`, { status: c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }).then(load)}>
                    {c.status === "ACTIVE" ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title="Nova empresa" onClose={() => setOpen(false)} wide>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={create}>
          <Input label="Nome da empresa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="pudins-da-ana" />
          <Input label="Responsável" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Senha inicial" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
          </Select>
          <label className="text-sm">Logo
            <input type="file" className="mt-1 block" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setForm({ ...form, logoUrl: await uploadFile(file, true) });
            }} />
          </label>
          <div className="md:col-span-2"><Button className="bg-[#5a3825] text-white" type="submit">Criar empresa</Button></div>
        </form>
      </Modal>
    </div>
  );
}

export function LogsPage() {
  const [items, setItems] = useState<{ id: string; action: string; details: string; createdAt: string; actorEmail?: string; company?: { name: string } }[]>([]);
  useEffect(() => { api.get("/master/logs").then(({ data }) => setItems(data)); }, []);
  return (
    <div className="space-y-5">
      <h1 className="font-serif text-4xl">Logs de acesso</h1>
      <div className="rounded-2xl border border-white/10">
        {items.map((log) => (
          <div key={log.id} className="border-b border-white/10 px-4 py-3 text-sm">
            <p>{log.action} · {log.company?.name ?? "—"}</p>
            <p className="text-white/50">{log.actorEmail} · {new Date(log.createdAt).toLocaleString("pt-BR")} · {log.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
