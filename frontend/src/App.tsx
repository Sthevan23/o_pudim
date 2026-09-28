import type { ReactNode } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AdminLayout, MasterLayout } from "./layouts/AppLayouts";
import { LoginPage, ForgotPage, ResetPage } from "./pages/auth/LoginPage";
import { PublicSitePage } from "./pages/public/PublicSite";
import { AdminDashboard } from "./pages/admin/DashboardPage";
import { CategoriesPage, ProductsPage } from "./pages/admin/CatalogPages";
import { CustomerDetailPage, CustomersPage, OrderDetailPage, OrdersPage } from "./pages/admin/SalesPages";
import { FinancePage, GalleryPage, ReportsPage, SettingsPage, TestimonialsPage } from "./pages/admin/OpsPages";
import { CompaniesPage, LogsPage, MasterDashboard } from "./pages/master/MasterPages";

function Guard({ role, children }: { role: "MASTER" | "ADMIN"; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "MASTER" && user.role !== "MASTER") return <Navigate to="/admin" replace />;
  if (role === "ADMIN" && user.role === "MASTER" && !user.impersonating) return <Navigate to="/master" replace />;
  return <>{children}</>;
}

function HomePage() {
  return (
    <div className="min-h-screen bg-[#fff9f5] px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-[#c58b5c]">Plataforma para confeitarias</p>
      <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl md:text-7xl">O sabor da sua marca, com a estrutura de um produto.</h1>
      <p className="mx-auto mt-6 max-w-xl text-stone-600">Um site premium, um painel completo e um console master para várias empresas — começando pelos pudins artesanais.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/pudins-da-ana" className="btn-primary">Ver vitrine da Ana</Link>
        <Link to="/login" className="btn-outline">Entrar no painel</Link>
      </div>
      <img src="/images/morango.png" alt="Paleta de morango" className="mx-auto mt-16 max-w-lg rounded-[2rem] shadow-soft" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-minha-senha" element={<ForgotPage />} />
      <Route path="/redefinir-senha" element={<ResetPage />} />
      <Route
        path="/admin"
        element={
          <Guard role="ADMIN">
            <AdminLayout />
          </Guard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="produtos" element={<ProductsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pedidos/:id" element={<OrderDetailPage />} />
        <Route path="clientes" element={<CustomersPage />} />
        <Route path="clientes/:id" element={<CustomerDetailPage />} />
        <Route path="financeiro" element={<FinancePage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="galeria" element={<GalleryPage />} />
        <Route path="depoimentos" element={<TestimonialsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route
        path="/master"
        element={
          <Guard role="MASTER">
            <MasterLayout />
          </Guard>
        }
      >
        <Route index element={<MasterDashboard />} />
        <Route path="empresas" element={<CompaniesPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
      <Route path="/:slug" element={<PublicSitePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
