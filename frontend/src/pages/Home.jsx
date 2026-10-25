import { api, useApi } from "../api.js";
import { GoldRule } from "../components/Brand.jsx";
import Icon from "../components/Icons.jsx";
import { Link } from "../router.jsx";
import {
  Approach, Button, CollabBand, Cover, ErrorState, Loading, PillarCard, StatusBadge, useTitle,
} from "../components/ui.jsx";

export default function Home() {
  useTitle("");
  const pillars = useApi(api.pillars);
  const featured = useApi(api.featured);

  return (
    <>
      <section className="hero">
        <div className="hero__media" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <GoldRule>Policy Research &amp; Advisory</GoldRule>
            <h1>
              Kenyan Roots. <span className="hero__line2"><span className="gold-word">Global</span> Perspective.</span>
            </h1>
            <p className="hero__lead">
              Comparative policy research that explains why policies succeed, fail, and produce different outcomes
              across contexts.
            </p>
            <div className="hero__actions">
              <Button to="/research">Explore our research</Button>
              <Button to="/publications" variant="outline">View publications</Button>
            </div>
          </div>
        </div>
      </section>


      <section className="section investigate leafy leafy--gold">
        <div className="container investigate__grid">
          <div className="investigate__main">
            <GoldRule>Our research</GoldRule>
            <h2>What we investigate</h2>
            <p className="lead">
              We examine the gap between policy design, implementation and real-world outcomes, and what
              decision-makers can learn from those differences.
            </p>
            <p className="core-q">
              <span>Our core question</span>
              When countries adopt similar policies to solve similar problems, what explains the differences in their results?
            </p>
            {pillars.loading && <Loading />}
            {pillars.error && <ErrorState onRetry={pillars.retry} />}
            {pillars.data && (
              <ul className="pillar-grid">
                {pillars.data.map((p) => (
                  <li key={p.slug}><PillarCard pillar={p} to={`/research/${p.slug}`} /></li>
                ))}
              </ul>
            )}
          </div>

          <aside className="featured" aria-labelledby="featured-h">
            <GoldRule><span id="featured-h">Featured publication</span></GoldRule>
            {featured.loading && <Loading />}
            {featured.error && <ErrorState onRetry={featured.retry} />}
            {featured.data && (
              <div className="featured__card">
                <Link to={`/publications/${featured.data.slug}`} className="featured__cover" tabIndex={-1} aria-hidden="true">
                  <Cover title={featured.data.title} kindLabel={featured.data.kind_label} src={featured.data.cover} />
                </Link>
                <div className="featured__text">
                  <StatusBadge status={featured.data.status} />
                  <h3>{featured.data.title}</h3>
                  <p>{featured.data.subtitle || featured.data.summary}</p>
                  <Button to={`/publications/${featured.data.slug}`} variant="gold">
                    {featured.data.status === "published" ? "Read more" : "View overview"}
                  </Button>
                </div>
              </div>
            )}
            {featured.data === null && !featured.loading && !featured.error && (
              <p className="muted">Our first publication will appear here.</p>
            )}
          </aside>
        </div>
      </section>

      <Approach />
      <CollabBand />
    </>
  );
}
