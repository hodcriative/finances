import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";

export default function Auth({ mode }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark">F</div>
        <span className="eyebrow">FINANCE</span>
        <h1>{isRegister ? "Crie sua conta" : "Boas-vindas de volta"}</h1>
        <p>{isRegister ? "Comece a organizar sua vida financeira." : "Entre para acessar seus dados financeiros."}</p>
        <form onSubmit={handleSubmit} noValidate>
          {isRegister && <label>Nome<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
          <label>E-mail<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Senha<input required type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="field-error">{error}</p>}
          <button className="primary-btn" disabled={submitting} type="submit">{submitting ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}</button>
        </form>
        <p className="auth-switch">
          {isRegister ? "J\u00e1 possui uma conta?" : "Ainda n\u00e3o possui uma conta?"}{" "}
          <button type="button" onClick={() => navigate(isRegister ? "/login" : "/cadastro")}>
            {isRegister ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </section>
    </main>
  );
}
