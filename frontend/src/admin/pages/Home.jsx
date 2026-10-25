import Icon from "../../components/Icons.jsx";
import { Link } from "../../router.jsx";
import { greeting, when } from "../api.js";
import { useAdmin } from "../context.js";
import { InstallButton } from "../install.jsx";
import { Avatar, Loading } from "../ui.jsx";

const Stat = ({ to, icon, value, label, tone }) => (
  <Link to={to} className={`adm-stat adm-stat--${tone || "plain"}`}>
    <span className="adm-stat__icon"><Icon name={icon} size={24} /></span>
    <b>{value ?? "–"}</b>
    <span>{label}</span>
  </Link>
);

export default function Home() {
  const { user, summary } = useAdmin();
  if (!summary) return <Loading />;
  const p = summary.publications;
  return (
    <div className="adm-home">
      <section className="adm-hello">
        <h2>{greeting()}, {user.first_name} 👋</h2>
        <p>
          {summary.unread > 0
            ? <>You have <b>{summary.unread} new {summary.unread === 1 ? "message" : "messages"}</b> waiting.</>
            : "You’re all caught up. Nothing new to read."}
        </p>
      </section>

      <InstallButton variant="banner" />

      <div className="adm-stats">
        <Stat to="/manage/messages" icon="mail" value={summary.unread} label="New messages" tone="accent" />
        <Stat to="/manage/publications" icon="doc" value={p.published} label="Published" />
        <Stat to="/manage/publications" icon="clock" value={p.forthcoming} label="In development" />
        <Stat to="/manage/pillars" icon="design" value={summary.pillars} label="Research areas" />
      </div>

      <h3 className="adm-h3">Quick actions</h3>
      <div className="adm-actions">
        <Link to="/manage/publications/new" className="adm-action"><span><Icon name="plus" size={26} /></span>New publication</Link>
        <Link to="/manage/messages" className="adm-action"><span><Icon name="mail" size={26} /></span>Read messages</Link>
        <Link to="/manage/settings" className="adm-action"><span><Icon name="phone" size={26} /></span>Contact details</Link>
        <a href="/" target="_blank" rel="noopener" className="adm-action"><span><Icon name="external" size={26} /></span>View website</a>
      </div>

      <div className="adm-h3-row">
        <h3 className="adm-h3">Recent messages</h3>
        <Link to="/manage/messages" className="adm-link">See all</Link>
      </div>
      {summary.recent_messages.length === 0 ? (
        <p className="adm-muted">Messages sent through your Contact page will appear here.</p>
      ) : (
        <ul className="adm-chatlist adm-chatlist--card">
          {summary.recent_messages.map((m) => (
            <li key={m.id}>
              <Link to={`/manage/messages/${m.id}`} className="adm-chat">
                <Avatar name={m.name} />
                <span className="adm-chat__body">
                  <span className="adm-chat__top"><b>{m.name}</b><time>{when(m.created)}</time></span>
                  <span className="adm-chat__bottom"><span className="adm-chat__preview">{m.message}</span>{!m.read && <em className="adm-badge">1</em>}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
