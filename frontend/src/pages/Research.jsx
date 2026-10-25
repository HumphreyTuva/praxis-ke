import { api, useApi } from "../api.js";
import AreaCard from "../components/AreaCard.jsx";
import { GoldRule } from "../components/Brand.jsx";
import { Approach, Button, CollabBand, ErrorState, Loading, PageHeader, useTitle } from "../components/ui.jsx";

export default function Research() {
  useTitle("Research");
  const { data, loading, error, retry } = useApi(api.pillars);

  return (
    <>
      <PageHeader
        eyebrow="Our research"
        title="Evidence for"
        accent="Real-World Impact"
        image="desk"
        lead="We focus on comparative and international policy, using evidence to understand the gap between policy design, implementation and real-world outcomes."
      />

      <section className="section leafy leafy--gold">
        <div className="container">
          <div className="areas">
            <div className="areas__intro">
              <GoldRule>Our research pillars</GoldRule>
              <h2>Five Key Areas of Focus</h2>
              <p>
                Our research brings together rigorous analysis and real-world insights to help decision-makers
                understand what works, why it works, and what can be learned across contexts.
              </p>
            </div>
            <div>
              {loading && <Loading />}
              {error && <ErrorState onRetry={retry} />}
              {data && (
                <ul className="area-grid">
                  {data.map((p, i) => (<li key={p.slug}><AreaCard pillar={p} index={i} /></li>))}
                </ul>
              )}
            </div>
          </div>
          <p className="core-q core-q--wide" style={{ marginTop: 40, marginBottom: 0 }}>
            <span>Core research question</span>
            When countries adopt similar policies to solve similar problems, what explains the differences in their results?
          </p>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <h2>Our approach</h2>
          <p className="lead">From context to recommendation, in four steps.</p>
        </div>
        <Approach compact />
        <div className="container center"><Button to="/publications">See our publications</Button></div>
      </section>
      <CollabBand />
    </>
  );
}
