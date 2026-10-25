import { useState } from "react";
import { api, useApi } from "../api.js";
import Icon from "../components/Icons.jsx";
import { Socials } from "../components/Layout.jsx";
import { Button, PageHeader, useTitle } from "../components/ui.jsx";

const TOPICS = [
  ["collaboration", "Research collaboration"],
  ["advisory", "Advisory support"],
  ["media", "Media or speaking"],
  ["feedback", "Feedback on a publication"],
  ["other", "Something else"],
];
const EMPTY = { name: "", email: "", organisation: "", topic: "collaboration", message: "", website: "" };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.message.trim().length < 20) e.message = "Please tell us a little more (at least 20 characters).";
  if (v.message.length > 4000) e.message = "Message is too long (4,000 characters maximum).";
  return e;
}

export default function Contact() {
  useTitle("Contact");
  const { data: site } = useApi(api.site);
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [formError, setFormError] = useState("");

  const set = (k) => (e) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    const local = validate(v);
    setErrors(local);
    if (Object.keys(local).length) {
      document.getElementById(`f-${Object.keys(local)[0]}`)?.focus();
      return;
    }
    setStatus("sending");
    setFormError("");
    try {
      await api.contact(v);
      setStatus("sent");
      setV(EMPTY);
    } catch (err) {
      const server = err.data?.errors || {};
      const { form, ...fields } = server;
      setErrors(fields);
      setFormError(form || (Object.keys(fields).length ? "" : "Something went wrong. Please try again in a moment."));
      setStatus("error");
    }
  }

  const field = (id, label, input, hint) => (
    <div className={`field ${errors[id] ? "has-error" : ""}`}>
      <label htmlFor={`f-${id}`}>{label}</label>
      {input}
      {errors[id] && <p className="field__error" id={`e-${id}`} role="alert">{errors[id]}</p>}
      {hint && !errors[id] && <p className="field__hint">{hint}</p>}
    </div>
  );
  const aria = (id) => ({ "aria-invalid": !!errors[id], "aria-describedby": errors[id] ? `e-${id}` : undefined });

  return (
    <>
      <PageHeader
        image="parliament"
        eyebrow="Get in touch"
        title="Contact"
        accent="Us"
        lead="We’d love to hear from you. Whether you have a question about our research, want to collaborate, or need support, send us a message."
      />
      <section className="section leafy leafy--water">
        <div className="container contact">
          <div className="contact__info">
            <h2>Contact information</h2>
            <p>Reach out using the form, or through the details below.</p>
            <ul className="info-list">
              {site?.location && (
                <li><span className="icon-disc"><Icon name="pin" size={20} /></span><div><h3>Based in</h3><p>{site.location}</p></div></li>
              )}
              {site?.email && (
                <li><span className="icon-disc"><Icon name="mail" size={20} /></span><div><h3>Email us</h3><p><a href={`mailto:${site.email}`}>{site.email}</a></p></div></li>
              )}
              {(site?.linkedin || site?.x) && (
                <li><span className="icon-disc"><Icon name="linkedin" size={20} /></span><div><h3>Follow us</h3><Socials site={site} /></div></li>
              )}
              <li><span className="icon-disc"><Icon name="check" size={20} /></span><div><h3>Ways we can work together</h3><p>Research collaboration, advisory support and feedback on our publications.</p></div></li>
            </ul>
          </div>

          <div className="contact__form">
            <h2>Send us a message</h2>
            {status === "sent" ? (
              <div className="success" role="status">
                <span className="success__icon"><Icon name="check" size={28} /></span>
                <h2>Thank you, your message has been sent.</h2>
                <p>We have received your enquiry and will be in touch if a reply is needed.</p>
                <Button variant="outline" icon={null} onClick={() => setStatus("idle")}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="form-grid">
                  {field("name", "Full name", <input id="f-name" name="name" autoComplete="name" value={v.name} onChange={set("name")} {...aria("name")} />)}
                  {field("email", "Email address", <input id="f-email" name="email" type="email" autoComplete="email" value={v.email} onChange={set("email")} {...aria("email")} />)}
                  {field("organisation", "Organisation (optional)", <input id="f-organisation" name="organisation" autoComplete="organization" value={v.organisation} onChange={set("organisation")} />)}
                  {field("topic", "Subject", (
                    <select id="f-topic" name="topic" value={v.topic} onChange={set("topic")}>
                      {TOPICS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  ))}
                </div>
                {field("message", "Your message", <textarea id="f-message" name="message" rows={6} value={v.message} onChange={set("message")} {...aria("message")} />, "A few lines on what you have in mind helps us respond usefully.")}
                <div className="hp" aria-hidden="true">
                  <label>Website<input tabIndex={-1} autoComplete="off" name="website" value={v.website} onChange={set("website")} /></label>
                </div>
                {formError && <p className="callout callout--error" role="alert"><Icon name="alert" size={20} /><span>{formError}</span></p>}
                <Button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send message"}</Button>
                <p className="privacy"><Icon name="shield" size={18} /><span>We respect your privacy and will only use your details to respond to your enquiry.</span></p>
              </form>
            )}
          </div>

          <aside className="partner-card">
            <div className="partner-card__img" aria-hidden="true" />
            <div className="partner-card__body">
              <h2>Partnerships for greater impact</h2>
              <p>We welcome partnerships with governments, organisations and individuals who share our interest in evidence-led policy.</p>
              <Button to="/research" variant="ghost-light">Explore our research</Button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
