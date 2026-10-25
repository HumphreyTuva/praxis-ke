import { useState } from "react";
import Icon from "../../components/Icons.jsx";
import { adminApi } from "../api.js";

export default function Login({ onDone }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await adminApi.login(identifier.trim(), password);
      onDone(r.user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={submit} noValidate>
        <img src="/brand/mark-green.png" alt="" width="54" height="74" />
        <h1>Praxis KE <b>Admin</b></h1>
        <p>Sign in to manage your website.</p>

        <div className="adm-field">
          <label htmlFor="l-email">Email</label>
          <input id="l-email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" value={identifier}
            onChange={(e) => setIdentifier(e.target.value)} autoFocus />
        </div>
        <div className="adm-field">
          <label htmlFor="l-pass">Password</label>
          <div className="adm-pass">
            <input id="l-pass" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="adm-icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
              <Icon name={show ? "eyeoff" : "eye"} size={22} />
            </button>
          </div>
        </div>
        {error && <p className="adm-login__error" role="alert"><Icon name="alert" size={18} /> {error}</p>}
        <button className="adm-btn adm-btn--block adm-btn--lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="adm-login__help">Forgot your password? Ask the person who built your site to reset it.</p>
        <a className="adm-login__back" href="/"><Icon name="arrowLeft" size={16} /> Back to website</a>
      </form>
    </div>
  );
}
