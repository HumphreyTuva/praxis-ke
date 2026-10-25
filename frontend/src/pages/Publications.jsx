import { useMemo, useState } from "react";
import { api, formatDate, useApi } from "../api.js";
import Icon from "../components/Icons.jsx";
import { Link } from "../router.jsx";
import { Button, CollabBand, Cover, ErrorState, Loading, PageHeader, PublicationCard, StatusBadge, useTitle } from "../components/ui.jsx";

const KINDS = [
  ["brief", "Policy briefs"],
  ["note", "Research notes"],
  ["commentary", "Commentary"],
  ["report", "Reports"],
];

function Featured({ pub }) {
  return (
    <div className="pubfeat">
      <div className="pubfeat__main">
        <Link to={`/publications/${pub.slug}`} className="pubfeat__cover" tabIndex={-1} aria-hidden="true">
          <Cover title={pub.title} kindLabel={pub.kind_label} src={pub.cover} />
        </Link>
        <div className="pubfeat__text">
          <span className="eyebrow"><span className="eyebrow__rule" aria-hidden="true" />Featured publication</span>
          <h2>{pub.title}</h2>
          <p>{pub.summary}</p>
          <p className="metaline">
            <span><Icon name="doc" size={16} /> {pub.kind_label}</span>
            <span><StatusBadge status={pub.status} /></span>
            {pub.published_on && <span>Published {formatDate(pub.published_on)}</span>}
          </p>
          <Button to={`/publications/${pub.slug}`} variant="gold">
            {pub.status === "published" ? "Read publication" : "View overview"}
          </Button>
        </div>
      </div>
      <div className="quote-panel" aria-hidden="true">
        <p>More transparent systems. Stronger institutions. <em>A more accountable future.</em></p>
      </div>
    </div>
  );
}

export default function Publications() {
  useTitle("Publications");
  const { data, loading, error, retry } = useApi(api.publications);
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");

  const filtering = kind !== "all" || q.trim() !== "";
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter(
      (p) =>
        (kind === "all" || p.kind === kind) &&
        (!term || `${p.title} ${p.subtitle} ${p.summary} ${p.regions.join(" ")}`.toLowerCase().includes(term))
    );
  }, [data, kind, q]);

  const featured = data?.find((p) => p.featured) || data?.[0];
  const latest = (data || []).filter((p) => p !== featured);

  const tools = (
    <>
      <label className="search">
        <Icon name="search" size={18} />
        <span className="sr-only">Search publications</span>
        <input type="search" placeholder="Search publications…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="chips" role="group" aria-label="Filter by type">
        <button className={`chip ${kind === "all" ? "is-on" : ""}`} aria-pressed={kind === "all"} onClick={() => setKind("all")}>All</button>
        {KINDS.map(([k, label]) => (
          <button key={k} className={`chip ${kind === k ? "is-on" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{label}</button>
        ))}
      </div>
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow="Publications"
        title="Research, Insight &"
        accent="Evidence"
        lead="Explore our policy briefs, research notes and reports. Each states its question, evidence and limitations."
        image="desk"
        tools={tools}
      />
      <section className="section leafy leafy--gold">
        <div className="container">
          {loading && <Loading />}
          {error && <ErrorState onRetry={retry} />}
          {data && filtering && (
            shown.length ? (
              <div className="pub-list">{shown.map((p) => <PublicationCard key={p.slug} pub={p} />)}</div>
            ) : (
              <div className="state"><p>No publications match your search yet.</p></div>
            )
          )}
          {data && !filtering && (
            <>
              {featured ? <Featured pub={featured} /> : <div className="state"><p>Our first publication will appear here.</p></div>}
              <div className="latest">
                <div className="latest__head"><h2>Latest publications</h2></div>
                {latest.length > 0 ? (
                  <div className="pub-list pub-list--grid">
                    {latest.map((p) => <PublicationCard key={p.slug} pub={p} compact />)}
                  </div>
                ) : (
                  <p className="pub-note">
                    <Icon name="doc" size={20} />
                    <span>New briefs, research notes and commentary will be added here as they are released. Published items include a PDF download.</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
      <CollabBand />
    </>
  );
}
