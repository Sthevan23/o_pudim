import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Boxes,
  Camera,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { mediaUrl } from "../utils/format";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: ShoppingBag },
  { to: "/admin/categorias", label: "Categorias", icon: Boxes },
  { to: "/admin/pedidos", label: "Pedidos", icon: BarChart3 },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/galeria", label: "Galeria", icon: Camera },
  { to: "/admin/depoimentos", label: "Depoimentos", icon: MessageSquareQuote },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<{ id: string; title: string; message: string }[]>([]);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    api.get("/admin/notifications").then(({ data }) => setNotes(data)).catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f1eb] text-stone-800">
      {user?.impersonating ? (
        <div className="bg-[#5a3825] px-4 py-2 text-center text-xs text-white">
          Você está acessando como administrador master · {user.companyName}
          <button className="ml-3 underline" onClick={() => { logout(); navigate("/login"); }}>Sair</button>
        </div>
      ) : null}
      <div className="lg:grid lg:grid-cols-[240px_1fr]">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-card lg:static lg:block ${open ? "block" : "hidden"}`}>
          <div className="flex items-center justify-between px-5 py-5">
            <div>
              <p className="font-serif text-2xl">{user?.companyName ?? "Painel"}</p>
              <p className="text-xs text-stone-400">Administração</p>
            </div>
            <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
          </div>
          <nav className="space-y-1 px-3 pb-8">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-[#fff3ea] text-[#5a3825]" : "text-stone-500 hover:bg-stone-50"}`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div>
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-[#f6f1eb]/90 px-4 py-3 backdrop-blur">
            <button className="lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
            <div className="flex items-center gap-3">
              {user?.logoUrl ? <img src={mediaUrl(user.logoUrl)} alt="" className="h-9 w-9 rounded-full object-cover" /> : null}
              <div>
                <p className="text-sm font-medium">{user?.companyName}</p>
                <p className="text-xs text-stone-400">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative rounded-full p-2 hover:bg-white" onClick={() => setShowNotes((v) => !v)}>
                <Bell className="h-5 w-5" />
                {notes.length ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" /> : null}
              </button>
              <button className="rounded-full p-2 hover:bg-white" onClick={() => { logout(); navigate("/login"); }}>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>
          {showNotes ? (
            <div className="absolute right-4 z-40 mt-2 w-80 rounded-2xl bg-white p-3 shadow-soft">
              {notes.length ? notes.map((n) => (
                <p key={n.id} className="border-b border-stone-100 px-2 py-2 text-sm last:border-0"><strong>{n.title}</strong><br />{n.message}</p>
              )) : <p className="p-3 text-sm text-stone-500">Nenhuma notificação.</p>}
            </div>
          ) : null}
          <main className="p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export function MasterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = [
    { to: "/master", label: "Dashboard", end: true },
    { to: "/master/empresas", label: "Empresas" },
    { to: "/master/logs", label: "Logs de acesso" },
  ];
  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="lg:grid lg:grid-cols-[220px_1fr]">
        <aside className="border-r border-white/10 p-5">
          <p className="font-serif text-2xl">O! Pudim</p>
          <p className="text-xs text-white/40">Console master</p>
          <nav className="mt-8 space-y-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-white/10" : "text-white/60 hover:bg-white/5"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div>
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className="text-sm text-white/70">{user?.name}</p>
            <button onClick={() => { logout(); navigate("/login"); }} className="text-sm text-white/60">Sair</button>
          </header>
          <main className="p-6 md:p-8"><Outlet /></main>
        </div>
      </div>
    </div>
  );
}
