import { api, formatDate, formatDateWithOrdinal, useApi } from "../api.js";
import Icon from "../components/Icons.jsx";
import { Link } from "../router.jsx";
import { Button, CollabBand, ErrorState, Loading, StatusBadge, useTitle } from "../components/ui.jsx";
import NotFound from "./NotFound.jsx";

const CONTEXT_IMG = { Kenya: "/brand/ctx-parliament.webp", "South Africa": "/brand/ctx-johannesburg.webp" };

/** Renders plain text: blank line = paragraph, "## " = heading. No HTML injection possible. */
function Body({ text }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? <h2 key={i}>{b.slice(3)}</h2> : <p key={i}>{b}</p>
      )}
    </div>
  );
}

export default function PublicationDetail({ slug }) {
  const { data: pub, loading, error, retry } = useApi(() => api.publication(slug), [slug]);
  useTitle(pub?.title || "Publication");

  if (loading) return <div className="container section"><Loading /></div>;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container section"><ErrorState onRetry={retry} /></div>;

  const dev = pub.status !== "published";

  return (
    <>
      <header className="hero hero--page">
        <div className="hero__media" aria-hidden="true" />
        <div className="container hero__inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">/</span>
            <Link to="/publications">Publications</Link>
          </nav>
          <div className="pub-meta">
            <span className="tag tag--light">{pub.kind_label}</span>
            <StatusBadge status={pub.status} />
          </div>
          <h1>{pub.title}</h1>
          {pub.author && (
            <p className="publication-byline">
              {[pub.author, "Praxis KE", pub.published_on && formatDateWithOrdinal(pub.published_on)].filter(Boolean).join(" | ")}
            </p>
          )}
          {pub.subtitle && <p className="lead">{pub.subtitle}</p>}
        </div>
      </header>

      <section className="section">
        <div className="container detail">
          <article className="detail__main">
            {dev && (
              <p className="callout callout--dev">
                <Icon name="clock" size={22} />
                <span>
                  <strong>This publication is in development.</strong> The overview below describes what it will cover;
                  scope and findings may change as the evidence is reviewed.
                </span>
              </p>
            )}

            <p className="lead lead--dark">{pub.summary}</p>

            {pub.research_question && (
              <blockquote className="pull pull--small">
                <span className="pull__label">Research question</span>
                {pub.research_question}
              </blockquote>
            )}

            {pub.purpose && (<><h2>Purpose</h2><p>{pub.purpose}</p></>)}

            {pub.outputs.length > 0 && (
              <>
                <h2>{dev ? "What it will include" : "What it includes"}</h2>
                <ul className="ticks">
                  {pub.outputs.map((o) => (<li key={o}><Icon name="check" size={18} /><span>{o}</span></li>))}
                </ul>
              </>
            )}

            {pub.body && <Body text={pub.body} />}

            {pub.scope_note && (
              <>
                <h2>Scope and limitations</h2>
                <p>{pub.scope_note}</p>
              </>
            )}
          </article>

          <aside className="detail__side" aria-label="Publication details">
            <div className="glance">
              <h2>At a glance</h2>
              <dl>
                <dt>Type</dt><dd>{pub.kind_label}</dd>
                <dt>Status</dt><dd>{dev ? "In development" : "Published"}</dd>
                {pub.published_on && (<><dt>Published</dt><dd>{formatDate(pub.published_on)}</dd></>)}
                {pub.regions.length > 0 && (
                  <>
                    <dt>Contexts</dt>
                    <dd>
                      <ul className="ctx">
                        {pub.regions.map((r) => (
                          <li key={r}>
                            {CONTEXT_IMG[r] && <img src={CONTEXT_IMG[r]} alt="" loading="lazy" />}
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </>
                )}
                {pub.pillars.length > 0 && (
                  <>
                    <dt>Research pillars</dt>
                    <dd>
                      <ul className="plain">
                        {pub.pillars.map((p) => (<li key={p.slug}><Link to={`/research/${p.slug}`} className="text-link">{p.title}</Link></li>))}
                      </ul>
                    </dd>
                  </>
                )}
              </dl>
              {pub.download_url ? (
                <Button href={pub.download_url} icon="download" download>Download PDF</Button>
              ) : (
                <p className="muted small">A PDF will be available for download when this publication is released.</p>
              )}
            </div>
            <div className="glance glance--soft">
              <h2>Questions or feedback?</h2>
              <p>We welcome informed feedback and collaboration.</p>
              <Button to="/contact" variant="outline">Contact us</Button>
            </div>
          </aside>
        </div>
      </section>
      <CollabBand />
    </>
  );
}
