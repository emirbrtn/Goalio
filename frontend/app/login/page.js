"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const router = useRouter();

  const [form, setForm] = useState({ username: "", email: "", password: "", mode: "login" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("goalio_token")) {
      router.push("/");
    }
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.mode === "register" && String(form.password || "").length < 6) {
      setMessage("Sifre en az 6 karakter olmali");
      setLoading(false);
      return;
    }

    try {
      const endpoint = form.mode === "login" ? "/users/login" : "/users/register";
      const body =
        form.mode === "login"
          ? { email: form.email, password: form.password }
          : { username: form.username, email: form.email, password: form.password };

      const res = await fetch(`${api}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Islem basarisiz");
        setLoading(false);
        return;
      }

      if (form.mode === "login") {
        localStorage.setItem("goalio_token", data.token);
        localStorage.setItem("goalio_user", JSON.stringify(data.user));
        setMessage("Giris basarili, yonlendiriliyorsunuz...");
        window.location.href = "/";
      } else {
        setMessage("Kayit basarili. Simdi giris yapabilirsiniz.");
        setForm({ username: "", email: "", password: "", mode: "login" });
      }
    } catch (error) {
      setMessage("Sunucuya baglanilamadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0f1d] p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Ana Sayfaya Don
        </button>

        <div className="w-full rounded-[40px] border border-slate-700/50 bg-[#1e293b]/60 p-10 shadow-2xl backdrop-blur-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              GOALIO
            </h1>
            <p className="text-sm text-slate-400">
              {form.mode === "login" ? "Hesabiniza giris yapin" : "Yeni hesap olusturun"}
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {form.mode === "register" ? (
              <input
                placeholder="Kullanici adi"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="rounded-2xl border border-slate-700 bg-[#0f172a] px-4 py-3 text-white outline-none transition-all focus:border-blue-500"
              />
            ) : null}

            <input
              placeholder="E-posta"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-2xl border border-slate-700 bg-[#0f172a] px-4 py-3 text-white outline-none transition-all focus:border-blue-500"
            />

            <input
              type="password"
              placeholder="Sifre"
              minLength={form.mode === "register" ? 6 : undefined}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-2xl border border-slate-700 bg-[#0f172a] px-4 py-3 text-white outline-none transition-all focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-4 rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
            >
              {loading ? "Bekleyin..." : form.mode === "login" ? "Giris Yap" : "Kayit Ol"}
            </button>
          </form>

          {message ? (
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center text-sm text-slate-300">
              {message}
            </div>
          ) : null}

          <button
            onClick={() => setForm({ ...form, mode: form.mode === "login" ? "register" : "login" })}
            className="mt-6 w-full text-sm text-blue-400 transition-colors hover:text-blue-300"
          >
            {form.mode === "login" ? "Hesabin yok mu? Kayit ol" : "Zaten hesabin var mi? Giris yap"}
          </button>
        </div>
      </div>
    </div>
  );
}
