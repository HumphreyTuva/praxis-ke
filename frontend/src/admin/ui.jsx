import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "../components/Icons.jsx";

/* ---------- toast + confirm (one provider) ---------- */
const Ctx = createContext({ toast: () => {}, confirm: async () => false });
export const useUi = () => useContext(Ctx);

export function UiProvider({ children }) {
  const [toastMsg, setToastMsg] = useState(null);
  const [ask, setAsk] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((message, tone = "ok") => {
    clearTimeout(timer.current);
    setToastMsg({ message, tone, id: Date.now() });
    timer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);
  const confirm = useCallback((opts) => new Promise((resolve) => setAsk({ ...opts, resolve })), []);
  const close = (v) => {
    ask?.resolve(v);
    setAsk(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      {toastMsg && (
        <div className={`adm-toast adm-toast--${toastMsg.tone}`} role="status" key={toastMsg.id}>
          <Icon name={toastMsg.tone === "error" ? "alert" : "check"} size={20} />
          <span>{toastMsg.message}</span>
        </div>
      )}
      <Sheet open={!!ask} onClose={() => close(false)} title={ask?.title}>
        {ask?.text && <p className="adm-sheet__text">{ask.text}</p>}
        <div className="adm-sheet__actions">
          <button className={`adm-btn ${ask?.danger ? "adm-btn--danger" : ""}`} onClick={() => close(true)}>{ask?.confirmLabel || "Yes"}</button>
          <button className="adm-btn adm-btn--tonal" onClick={() => close(false)}>{ask?.cancelLabel || "Cancel"}</button>
        </div>
      </Sheet>
    </Ctx.Provider>
  );
}

/* ---------- bottom sheet (mobile) / dialog (desktop) ---------- */
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="adm-sheet-wrap" onClick={onClose}>
      <div className="adm-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <span className="adm-sheet__grab" aria-hidden="true" />
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

/* ---------- small building blocks ---------- */
const PALETTE = ["#145B46", "#0B3325", "#8A6A20", "#2F6F8F", "#7A4E8C", "#B25B3A", "#3E7C59"];
export function Avatar({ name = "?", size = 48 }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  const color = PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  return <span className="adm-avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }} aria-hidden="true">{initials}</span>;
}

export const Fab = ({ onClick, to, label, icon = "plus" }) => (
  <button className="adm-fab" onClick={onClick} aria-label={label}>
    <Icon name={icon} size={26} />
    <span>{label}</span>
  </button>
);

export function Empty({ icon = "mail", title, text, children }) {
  return (
    <div className="adm-empty">
      <span className="adm-empty__icon"><Icon name={icon} size={34} /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="adm-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="adm-empty" role="alert">
      <span className="adm-empty__icon adm-empty__icon--warn"><Icon name="alert" size={34} /></span>
      <h3>Couldn’t load this</h3>
      <p>{error?.message || "Please try again."}</p>
      {onRetry && <button className="adm-btn adm-btn--tonal" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export const Chip = ({ on, onClick, children, ...rest }) => (
  <button type="button" className={`adm-chip ${on ? "is-on" : ""}`} aria-pressed={!!on} onClick={onClick} {...rest}>
    {on && <Icon name="check" size={16} />}
    {children}
  </button>
);

export function Switch({ checked, onChange, title, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="adm-switch" onClick={() => onChange(!checked)}>
      <span className="adm-switch__text"><b>{title}</b>{hint && <small>{hint}</small>}</span>
      <span className={`adm-switch__track ${checked ? "is-on" : ""}`}><span /></span>
    </button>
  );
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className={`adm-field ${error ? "has-error" : ""}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <p className="adm-field__error" role="alert">{error}</p> : hint ? <p className="adm-field__hint">{hint}</p> : null}
    </div>
  );
}

export function Card({ title, hint, children }) {
  return (
    <section className="adm-card">
      {title && <h2>{title}</h2>}
      {hint && <p className="adm-card__hint">{hint}</p>}
      {children}
    </section>
  );
}

/** Editable list of short texts (e.g. "What it will include"). */
export function ListEditor({ items, onChange, placeholder, addLabel = "Add another" }) {
  const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  return (
    <div className="adm-list-edit">
      {items.map((v, i) => (
        <div className="adm-list-edit__row" key={i}>
          <textarea rows={2} value={v} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} aria-label={`Item ${i + 1}`} />
          <button type="button" className="adm-icon-btn" aria-label={`Remove item ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Icon name="close" size={20} />
          </button>
        </div>
      ))}
      <button type="button" className="adm-btn adm-btn--tonal adm-btn--sm" onClick={() => onChange([...items, ""])}>
        <Icon name="plus" size={18} /> {addLabel}
      </button>
    </div>
  );
}

/** Image or PDF chooser with preview. `value` = {url, name} | null; `file` = newly picked File. */
export function FilePicker({ kind, value, file, onPick, onClear, label }) {
  const input = useRef(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (file && kind === "image") {
      const u = URL.createObjectURL(file);
      setPreview(u);
      return () => URL.revokeObjectURL(u);
    }
    setPreview(null);
    return undefined;
  }, [file, kind]);
  const shownImg = preview || (kind === "image" ? value?.url : null);
  const name = file?.name || value?.name;
  const has = !!(file || value);
  return (
    <div className="adm-file">
      {kind === "image" && (
        <div className={`adm-file__thumb ${shownImg ? "" : "is-empty"}`}>
          {shownImg ? <img src={shownImg} alt="" /> : <Icon name="image" size={30} />}
        </div>
      )}
      {kind === "pdf" && (
        <div className="adm-file__thumb adm-file__thumb--pdf"><Icon name="doc" size={30} /></div>
      )}
      <div className="adm-file__body">
        <b>{has ? (name || "Current file") : label}</b>
        <div className="adm-file__actions">
          <button type="button" className="adm-btn adm-btn--tonal adm-btn--sm" onClick={() => input.current?.click()}>
            {has ? "Change" : "Choose file"}
          </button>
          {has && <button type="button" className="adm-btn adm-btn--text adm-btn--sm" onClick={onClear}>Remove</button>}
        </div>
      </div>
      <input ref={input} type="file" hidden accept={kind === "image" ? "image/jpeg,image/png,image/webp" : "application/pdf"}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
    </div>
  );
}
