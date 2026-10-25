import { GoldRule } from "../components/Brand.jsx";
import Icon from "../components/Icons.jsx";
import { Approach, Button, CollabBand, PageHeader, useTitle } from "../components/ui.jsx";

const TRIO = [
  { icon: "target", label: "Our mission", title: "Our Mission", text: "To generate credible, evidence-led policy research that informs better decisions and supports positive, lasting change in Kenya and beyond." },
  { icon: "implementation", label: "Our approach", title: "Our Approach", text: "Evidence-led. Comparative. Practical. We examine the gap between policy design, implementation and real-world outcomes, and what decision-makers can learn from those differences." },
  { icon: "eye", label: "Our vision", title: "Our Vision", text: "A more informed world where better policies create stronger, more inclusive societies." },
];

const VALUES = [
  { icon: "doc", title: "Evidence-led", text: "We distinguish evidence from opinion, and say clearly what the evidence can and cannot support." },
  { icon: "scale", title: "Honest about limits", text: "We explain findings and limitations openly, and avoid claims of influence that has not yet been earned." },
  { icon: "comparative", title: "Context-aware", text: "We look across countries, but stay grounded in Kenyan and African policy realities." },
  { icon: "bulb", title: "Practical", text: "We favour realistic recommendations and contextual adaptation over one-size-fits-all solutions." },
];

export default function About() {
  useTitle("About");
  return (
    <>
      <PageHeader
        eyebrow="About Praxis KE"
        image="team"
        title="Building Evidence"
        accent="for Better Decisions"
        lead="Praxis KE is a Kenyan policy research and advisory brand with an international outlook. We start with credible, evidence-led research and aim to grow into an advisory organisation able to support governments, international organisations and private-sector decision-makers."
      />

      <section className="section trio-wrap">
        <div className="container">
          <ul className="trio">
            {TRIO.map((t) => (
              <li key={t.title}>
                <span className="icon-disc"><Icon name={t.icon} size={24} /></span>
                <div>
                  <span className="trio__label">{t.label}</span>
                  <h2>{t.title}</h2>
                  <p>{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="philosophy">
        <div className="container philosophy__inner">
          <div>
            <GoldRule>Our research philosophy</GoldRule>
            <h2>From Policy to Practice</h2>
          </div>
          <p>
            The brand’s central interest is explaining why policies succeed, fail or produce different outcomes across
            countries, and identifying what decision-makers can realistically learn from those differences.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <h2>Our purpose</h2>
            <p>
              Policies are often judged by what they say. We are interested in what happens next. Our work goes beyond
              describing a policy: it investigates the institutional, political, administrative and social factors that
              help explain what happens in practice.
            </p>
            <p>
              We ask why policies succeed, fail or produce different outcomes across countries, and what
              decision-makers can realistically learn from those differences.
            </p>
          </div>
          <blockquote className="pull">
            <span className="pull__label">Core research question</span>
            When countries adopt similar policies to solve similar problems, what explains the differences in their results?
          </blockquote>
        </div>
      </section>

      <section className="section leafy leafy--water">
        <div className="container">
          <GoldRule>The meaning behind our tagline</GoldRule>
          <h2>Kenyan Roots. Global Perspective.</h2>
          <div className="two-col">
            <div className="meaning">
              <h3>Kenyan roots</h3>
              <p>“KE” stands for Kenya. Our questions, context and commitments start here, grounded in Kenyan and African policy realities rather than imported assumptions.</p>
            </div>
            <div className="meaning">
              <h3>Global perspective</h3>
              <p>Comparing how similar policies fare in different countries helps explain why results differ, and shows which lessons can travel and which need adapting.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>How we work</h2>
          <p className="lead">Four steps, applied to every piece of research.</p>
        </div>
        <Approach compact />
      </section>

      <section className="section section--tint">
        <div className="container">
          <h2>Our principles</h2>
          <ul className="values">
            {VALUES.map((v) => (
              <li key={v.title}>
                <span className="values__icon"><Icon name={v.icon} size={26} /></span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section leafy leafy--gold">
        <div className="container note">
          <h2>Where we are today</h2>
          <p>
            Praxis KE is at an early stage. Our first publication, a comparative policy brief on transparency and
            accountability, is in development. We will share research here as it is released, along with its scope and
            limitations.
          </p>
          <Button to="/publications" variant="outline">See publications</Button>
        </div>
      </section>
      <CollabBand />
    </>
  );
}
