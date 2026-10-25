import { useEffect, useState } from "react";
import Icon from "../../components/Icons.jsx";
import { adminApi, useData } from "../api.js";
import { useAdmin } from "../context.js";
import { useLeaveGuard } from "../guard.js";
import { InstallButton } from "../install.jsx";
import { Avatar, Card, ErrorBox, Field, Loading, Sheet, useUi } from "../ui.jsx";

function ContactDetails() {
  const { toast } = useUi();
  const site = useData(adminApi.site);
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (site.data) { setForm(site.data); setInitial(JSON.stringify(site.data)); } }, [site.data]);
  const dirty = !!form && JSON.stringify(form) !== initial;
  useLeaveGuard(dirty);
  if (site.error) return <ErrorBox error={site.error} onRetry={site.reload} />;
  if (!form) return <Loading />;
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await adminApi.saveSite(form);
      setForm(saved); setInitial(JSON.stringify(saved));
      toast("Contact details saved");
    } catch (err) {
      setErrors(err.errors || {});
      toast(err.message, "error");
    } finally { setBusy(false); }
  }
  return (
    <Card title="Contact details" hint="Shown on your Contact page and in the footer. Leave a box empty to hide it.">
      <form onSubmit={save} noValidate>
        <Field label="Public email" htmlFor="s-email" error={errors.public_email}><input id="s-email" type="email" inputMode="email" value={form.public_email} onChange={set("public_email")} placeholder="hello@yourdomain.org" /></Field>
        <Field label="Location" htmlFor="s-loc"><input id="s-loc" value={form.location} onChange={set("location")} placeholder="Nairobi, Kenya" /></Field>
        <Field label="LinkedIn link" htmlFor="s-li" error={errors.linkedin_url}><input id="s-li" inputMode="url" value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/company/…" /></Field>
        <Field label="X (Twitter) link" htmlFor="s-x" error={errors.x_url}><input id="s-x" inputMode="url" value={form.x_url} onChange={set("x_url")} placeholder="https://x.com/…" /></Field>
        <button className="adm-btn adm-btn--lg" disabled={busy || !dirty}>{busy ? "Saving…" : "Save contact details"}</button>
      </form>
    </Card>
  );
}

function PasswordSheet({ open, onClose }) {
  const { toast } = useUi();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const close = () => { setCur(""); setNext(""); setErrors({}); onClose(); };
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.password(cur, next);
      toast("Password changed");
      close();
    } catch (err) {
      setErrors(err.errors || { current: err.message });
    } finally { setBusy(false); }
  }
  return (
    <Sheet open={open} onClose={close} title="Change password">
      <form onSubmit={submit}>
        <Field label="Current password" htmlFor="p-cur" error={errors.current}><input id="p-cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <Field label="New password" htmlFor="p-new" hint="At least 8 characters. Avoid common words." error={errors.new}><input id="p-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <div className="adm-sheet__actions">
          <button className="adm-btn" disabled={busy || !cur || !next}>{busy ? "Saving…" : "Change password"}</button>
          <button type="button" className="adm-btn adm-btn--tonal" onClick={close}>Cancel</button>
        </div>
      </form>
    </Sheet>
  );
}

export default function Settings() {
  const { user, signOut } = useAdmin();
  const [pw, setPw] = useState(false);
  return (
    <div className="adm-narrow adm-form">
      <section className="adm-profile">
        <Avatar name={user.name} size={64} />
        <div><h2>{user.name}</h2><p>{user.email}</p></div>
      </section>

      <ContactDetails />

      <Card title="App & account">
        <div className="adm-rowlist">
          <InstallButton variant="row" />
          <button className="adm-row" onClick={() => setPw(true)}>
            <span className="adm-row__icon"><Icon name="lock" size={22} /></span>
            <span className="adm-row__text"><b>Change password</b><small>Keep your account secure</small></span>
            <Icon name="chevron" size={20} />
          </button>
          <a className="adm-row" href="/" target="_blank" rel="noopener">
            <span className="adm-row__icon"><Icon name="external" size={22} /></span>
            <span className="adm-row__text"><b>View website</b><small>Opens in a new tab</small></span>
            <Icon name="chevron" size={20} />
          </a>
          <button className="adm-row adm-row--danger" onClick={signOut}>
            <span className="adm-row__icon"><Icon name="logout" size={22} /></span>
            <span className="adm-row__text"><b>Sign out</b></span>
          </button>
        </div>
      </Card>

      <Card title="Getting back here">
        <ul className="adm-tips">
          <li><Icon name="keyboard" size={22} /><span><b>On a computer:</b> press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> on any page of the website.</span></li>
          <li><Icon name="phone" size={22} /><span><b>On a phone:</b> press and hold the Praxis KE logo at the top of the website. Or install the app to open it from your home screen.</span></li>
        </ul>
      </Card>
      <PasswordSheet open={pw} onClose={() => setPw(false)} />
    </div>
  );
}
