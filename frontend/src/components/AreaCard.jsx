import { Link } from "../router.jsx";
import Icon from "./Icons.jsx";

export default function AreaCard({ pillar, index, small = false }) {
  return (
    <article className={`area-card ${small ? "area-card--small" : ""}`}>
      <span className="icon-disc"><Icon name={pillar.icon} size={24} /></span>
      <div>
        {index != null && <span className="area-card__num">{String(index + 1).padStart(2, "0")}</span>}
        <h3>{pillar.title}</h3>
        <p>{pillar.summary}</p>
        <Link to={`/research/${pillar.slug}`} className="text-link" aria-label={`Learn more about ${pillar.title}`}>
          Learn more <Icon name="arrow" size={16} />
        </Link>
      </div>
    </article>
  );
}
