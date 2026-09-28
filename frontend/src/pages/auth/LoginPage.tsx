import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Input } from "../../components/ui/Ui";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Bem-vindo de volta.");
      navigate(user.role === "MASTER" && !user.impersonating ? "/master" : "/admin");
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Não foi possível entrar.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#fff9f5] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/images/morango.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#5a3825]/70 to-transparent" />
        <p className="absolute bottom-10 left-10 right-10 font-serif text-4xl text-white">
          Um pedacinho de felicidade em cada colherada.
        </p>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c58b5c]">Painel</p>
            <h1 className="mt-2 font-serif text-4xl">Entrar</h1>
            <p className="mt-2 text-sm text-stone-500">Acesse o painel da sua confeitaria ou o console master.</p>
          </div>
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="flex items-center justify-between text-sm">
            <Link to="/esqueci-minha-senha" className="text-stone-500 hover:text-stone-800">Esqueci minha senha</Link>
          </div>
          <Button type="submit" loading={loading} className="w-full bg-[#5a3825] text-white">
            Entrar
          </Button>
          <p className="text-center text-xs text-stone-400">Ambiente de desenvolvimento: admin@sistema.com · ana@pudins.com</p>
        </form>
      </div>
    </div>
  );
}

export function ForgotPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { api } = await import("../../services/api");
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.resetUrl ? `Link de desenvolvimento: ${data.resetUrl}` : data.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff9f5] px-6">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="font-serif text-3xl">Recuperar senha</h1>
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {message ? <p className="break-all text-xs text-stone-500">{message}</p> : null}
        <Button type="submit" loading={loading} className="w-full bg-[#5a3825] text-white">Enviar</Button>
        <Link to="/login" className="block text-center text-sm text-stone-500">Voltar ao login</Link>
      </form>
    </div>
  );
}

export function ResetPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { api } = await import("../../services/api");
      await api.post("/auth/reset-password", { token, password });
      toast.success("Senha atualizada.");
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff9f5] px-6">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="font-serif text-3xl">Nova senha</h1>
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <Button type="submit" loading={loading} className="w-full bg-[#5a3825] text-white">Salvar</Button>
      </form>
    </div>
  );
}
