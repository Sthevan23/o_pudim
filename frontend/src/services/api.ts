import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? "Não foi possível concluir esta ação.";
    if (status === 401) {
      localStorage.removeItem("token");
      const path = window.location.pathname;
      if (path.startsWith("/admin") || path.startsWith("/master")) {
        window.location.href = "/login";
      }
    }
    if (status && status >= 400 && status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  },
);

export async function uploadFile(file: File, master = false): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ url: string }>(master ? "/master/upload" : "/admin/upload", form);
  return data.url;
}
