import { useEffect } from "react";
import { formatDate } from "../api.js";
import { Link } from "../router.jsx";
import { GoldRule } from "./Brand.jsx";
import Icon from "./Icons.jsx";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Praxis KE` : "Praxis KE — Policy Research & Advisory";
  }, [title]);
}

/** Dark skyline hero used at the top of every inner page. `accent` is rendered in gold. */
export function PageHeader({ eyebrow, title, accent, lead, tools, crumbs, image, children }) {
  return (
    <header className={`hero hero--page ${tools ? "hero--tools" : ""} ${image ? `hero--${image}` : ""}`}>
      <div className="hero__media" aria-hidden="true" />
      <div className="container hero__inner">
        {crumbs}
        {eyebrow && <GoldRule>{eyebrow}</GoldRule>}
        <h1>
          {title} {accent && <span className="accent">{accent}</span>}
        </h1>
        {lead && <p className="lead">{lead}</p>}
        {tools && <div className="hero__tools">{tools}</div>}
        {children}
      </div>
    </header>
  );
}

export function Button({ to, href, variant = "primary", icon = "arrow", children, ...rest }) {
  const cls = `btn btn--${variant}`;
  const inner = (
    <>
      <span>{children}</span>
      {icon && <Icon name={icon} size={18} />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{inner}</a>;
  return <button className={cls} {...rest}>{inner}</button>;
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ onRetry, message = "We couldn't load this content." }) {
  return (
    <div className="state state--error" role="alert">
      <Icon name="alert" size={28} />
      <p>{message} Please check your connection and try again.</p>
      {onRetry && (
        <button className="btn btn--outline" onClick={onRetry}>
          <span>Try again</span>
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  if (status === "published") return <span className="badge badge--published">Published</span>;
  return <span className="badge badge--dev"><Icon name="clock" size={14} /> In development</span>;
}

/** Brand-styled cover; the visual is generated, so every new publication gets one automatically. */
export function Cover({ title, kindLabel, src }) {
  if (src) return <img className="cover cover--img" src={src} alt={`Cover: ${title}`} loading="lazy" />;
  return (
    <div className="cover" role="img" aria-label={`Cover: ${title}`}>
      <div className="cover__top">
        <img src="/brand/mark-ivory.png" alt="" width="22" height="30" />
        <span>PRAXIS <b>KE</b></span>
      </div>
      <p className="cover__kind">{kindLabel}</p>
      <p className="cover__title">{title}</p>
      <div className="cover__img" aria-hidden="true" />
    </div>
  );
}

export function PillarCard({ pillar, to }) {
  return (
    <Link to={to} className="pillar-card">
      <span className="pillar-card__icon"><Icon name={pillar.icon === "design" ? "design" : pillar.icon} size={30} /></span>
      <span className="pillar-card__rule" aria-hidden="true" />
      <h3>{pillar.title}</h3>
      <span className="pillar-card__arrow" aria-hidden="true"><Icon name="arrow" size={18} /></span>
    </Link>
  );
}

export function PublicationCard({ pub, compact = false }) {
  return (
    <article className={`pub-card ${compact ? "pub-card--compact" : ""}`}>
      <Link to={`/publications/${pub.slug}`} className="pub-card__cover" tabIndex={-1} aria-hidden="true">
        <Cover title={pub.title} kindLabel={pub.kind_label} src={pub.cover} />
      </Link>
      <div className="pub-card__body">
        <div className="pub-card__meta">
          <span className="tag">{pub.kind_label}</span>
          <StatusBadge status={pub.status} />
        </div>
        <h3><Link to={`/publications/${pub.slug}`}>{pub.title}</Link></h3>
        {pub.subtitle && <p className="pub-card__sub">{pub.subtitle}</p>}
        <p className="pub-card__summary">{pub.summary}</p>
        <div className="pub-card__foot">
          <span className="muted">
            {pub.published_on ? formatDate(pub.published_on) : pub.regions.join(" · ") || "Forthcoming"}
          </span>
          <Link to={`/publications/${pub.slug}`} className="text-link">
            {pub.status === "published" ? "Read" : "View overview"} <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export const APPROACH = [
  { icon: "search", title: "Diagnose", text: "Understand the context and key issues." },
  { icon: "scale", title: "Compare", text: "Look across countries and contexts." },
  { icon: "bulb", title: "Explain", text: "Identify what accounts for the differences." },
  { icon: "doc", title: "Recommend", text: "Offer practical, evidence-based solutions." },
];

export function Approach({ compact = false }) {
  return (
    <section className={`approach ${compact ? "approach--compact" : ""}`} aria-label="Our approach">
      <div className="container">
        <ol className="approach__list">
          {APPROACH.map((s, i) => (
            <li key={s.title} className="approach__step">
              <span className="approach__num">{i + 1}</span>
              <span className="approach__icon"><Icon name={s.icon} size={26} /></span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CollabBand() {
  return (
    <section className="collab" aria-labelledby="collab-title">
      <div className="container collab__inner">
        <span className="collab__icon"><Icon name="mail" size={34} /></span>
        <div className="collab__title">
          <span className="collab__eyebrow">Let’s collaborate</span>
          <h2 id="collab-title">Partner for Evidence-Led Policy Change</h2>
        </div>
        <p>
          We welcome collaboration, research partnerships and knowledge exchange with governments, organisations and
          individuals who share our vision.
        </p>
        <Button to="/contact" variant="gold">Get in touch</Button>
      </div>
    </section>
  );
}
