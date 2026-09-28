import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../services/api";
import { money } from "../../utils/format";
import { Skeleton } from "../../components/ui/Ui";

const FILTERS = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "this_month", label: "Este mês" },
  { id: "last_month", label: "Último mês" },
];

type Dash = {
  cards: {
    revenueToday: number;
    revenueMonth: number;
    ordersToday: number;
    ordersMonth: number;
    productsCount: number;
    customersCount: number;
    ticketAverage: number;
  };
  revenueByDay: { date: string; revenue: number; orders: number }[];
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
};

export function AdminDashboard() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api.get<Dash>("/admin/dashboard", { params: { period } }).then(({ data: d }) => setData(d));
  }, [period]);

  if (!data) return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const cards = [
    { label: "Faturamento hoje", value: money(data.cards.revenueToday) },
    { label: "Faturamento do mês", value: money(data.cards.revenueMonth) },
    { label: "Pedidos hoje", value: data.cards.ordersToday },
    { label: "Pedidos do mês", value: data.cards.ordersMonth },
    { label: "Produtos cadastrados", value: data.cards.productsCount },
    { label: "Clientes cadastrados", value: data.cards.customersCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Dashboard</h1>
          <p className="text-sm text-stone-500">Acompanhe vendas, ticket médio e o ritmo da produção.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setPeriod(f.id)} className={`rounded-full px-3 py-1.5 text-xs ${period === f.id ? "bg-[#5a3825] text-white" : "bg-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-stone-400">{c.label}</p>
            <p className="mt-2 font-serif text-3xl">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="mb-4 text-sm font-medium">Faturamento por dia</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area dataKey="revenue" stroke="#c58b5c" fill="#f5e6d3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <p className="mb-4 text-sm font-medium">Produtos mais vendidos</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#5a3825" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
