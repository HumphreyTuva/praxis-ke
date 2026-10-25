import { api, useApi } from "../api.js";
import AreaCard from "../components/AreaCard.jsx";
import { GoldRule } from "../components/Brand.jsx";
import Icon from "../components/Icons.jsx";
import { Link } from "../router.jsx";
import { Button, CollabBand, ErrorState, Loading, PageHeader, useTitle } from "../components/ui.jsx";
import NotFound from "./NotFound.jsx";

export default function PillarDetail({ slug }) {
  const { data, loading, error, retry } = useApi(api.pillars);
  const pillar = data?.find((p) => p.slug === slug);
  useTitle(pillar?.title || "Research");

  if (loading) return <div className="container section"><Loading /></div>;
  if (error) return <div className="container section"><ErrorState onRetry={retry} /></div>;
  if (!pillar) return <NotFound />;

  const others = data.filter((p) => p.slug !== slug);
  const words = pillar.title.split(" ");
  const accent = words.slice(-1)[0];
  const head = words.slice(0, -1).join(" ");

  return (
    <>
      <PageHeader
        title={head}
        accent={accent}
        lead={pillar.summary}
        image="desk"
        crumbs={
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">/</span>
            <Link to="/research">Research</Link><span aria-hidden="true">/</span>
            <span>{pillar.title}</span>
          </nav>
        }
      />

      <section className="section leafy leafy--gold">
        <div className="container pdetail">
          <div>
            <GoldRule>About this pillar</GoldRule>
            <h2>{pillar.title}</h2>
            <p className="lead">{pillar.description}</p>
            <Button to="/publications" variant="outline">See related publications</Button>
          </div>
          {pillar.key_questions.length > 0 && (
            <div className="qcard">
              <h2>The questions we ask</h2>
              <ul className="ticks">
                {pillar.key_questions.map((q) => (<li key={q}><Icon name="check" size={18} /><span>{q}</span></li>))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <GoldRule>Related research areas</GoldRule>
          <h2>Explore our other research areas</h2>
          <ul className="area-grid area-grid--four">
            {others.map((p) => (<li key={p.slug}><AreaCard pillar={p} small /></li>))}
          </ul>
        </div>
      </section>
      <CollabBand />
    </>
  );
}
