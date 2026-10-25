import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "../components/Icons.jsx";
import { Link, useRoute } from "../router.jsx";
import { adminApi, setUnauthorizedHandler, useData } from "./api.js";
import { AdminCtx } from "./context.js";
import { InstallButton } from "./install.jsx";
import { UiProvider, useUi } from "./ui.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Messages from "./pages/Messages.jsx";
import { PillarEditor, Pillars } from "./pages/Pillars.jsx";
import { PublicationEditor, Publications } from "./pages/Publications.jsx";
import Settings from "./pages/Settings.jsx";
import "./admin.css";

const NAV = [
  { key: "home", to: "/manage", label: "Home", icon: "home" },
  { key: "messages", to: "/manage/messages", label: "Messages", icon: "mail" },
  { key: "publications", to: "/manage/publications", label: "Publications", icon: "doc" },
  { key: "pillars", to: "/manage/pillars", label: "Research", icon: "design" },
  { key: "settings", to: "/manage/settings", label: "Settings", icon: "implementation" },
];
const TITLES = { home: "Home", messages: "Messages", publications: "Publications", pillars: "Research areas", settings: "Settings" };

function useDashboardChrome() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const prev = meta?.getAttribute("content");
    meta?.setAttribute("content", "#0B3325");
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    document.title = "Praxis KE Admin";
    document.documentElement.classList.add("adm-root");
    return () => {
      if (prev) meta?.setAttribute("content", prev);
      robots.remove();
      document.documentElement.classList.remove("adm-root");
    };
  }, []);
}

function Shell({ user, onLogout }) {
  const { path, navigate } = useRoute();
  const { confirm } = useUi();
  const summary = useData(adminApi.summary);
  const guard = useRef(null); // pages with unsaved changes register a function here

  const parts = path.replace(/^\/manage\/?/, "").split("/").filter(Boolean);
  const section = parts[0] || "home";
  const nested = parts.length > 1;
  const unread = summary.data?.unread || 0;

  const go = useCallback(async (to) => {
    if (guard.current && !(await guard.current())) return;
    navigate(to);
  }, [navigate]);

  const signOut = async () => {
    if (!(await confirm({ title: "Sign out?", text: "You’ll need your email and password to get back in.", confirmLabel: "Sign out" }))) return;
    try { await adminApi.logout(); } catch { /* ignore */ }
    onLogout();
  };

  useEffect(() => {
    const warn = (e) => { if (guard.current?.dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  let page;
  if (section === "home") page = <Home />;
  else if (section === "messages") page = <Messages id={parts[1]} />;
  else if (section === "publications") page = parts[1] ? <PublicationEditor id={parts[1] === "new" ? null : parts[1]} /> : <Publications />;
  else if (section === "pillars") page = parts[1] ? <PillarEditor id={parts[1] === "new" ? null : parts[1]} /> : <Pillars />;
  else if (section === "settings") page = <Settings />;
  else page = <Home />;

  const ctx = { user, summary: summary.data, refreshSummary: summary.reload, guard, go, signOut };

  return (
    <AdminCtx.Provider value={ctx}>
      <div className={`adm ${nested ? "is-nested" : ""} ${section === "messages" && parts[1] ? "has-detail" : ""}`}>
        <aside className="adm-side" aria-label="Dashboard menu">
          <Link to="/manage" className="adm-side__brand">
            <img src="/brand/mark-ivory.png" alt="" width="30" height="41" />
            <span><b>Praxis KE</b><small>Admin</small></span>
          </Link>
          <nav>
            {NAV.map((n) => (
              <a key={n.key} href={n.to} className={`adm-side__link ${section === n.key ? "is-on" : ""}`}
                aria-current={section === n.key ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); go(n.to); }}>
                <Icon name={n.icon} size={22} /> {n.label}
                {n.key === "messages" && unread > 0 && <em className="adm-badge">{unread}</em>}
              </a>
            ))}
          </nav>
          <div className="adm-side__foot">
            <InstallButton />
            <a className="adm-side__btn" href="/" target="_blank" rel="noopener"><Icon name="external" size={20} /> View website</a>
            <button className="adm-side__btn" onClick={signOut}><Icon name="logout" size={20} /> Sign out</button>
            <p className="adm-side__who">{user.email}</p>
          </div>
        </aside>

        <div className="adm-main">
          <header className="adm-bar">
            {nested ? (
              <button className="adm-bar__btn" aria-label="Back" onClick={() => go(`/manage/${section}`)}>
                <Icon name="arrowLeft" size={24} />
              </button>
            ) : (
              <img className="adm-bar__logo" src="/brand/mark-ivory.png" alt="" width="26" height="36" />
            )}
            <h1 id="adm-title">{TITLES[section] || "Home"}</h1>
            <a className="adm-bar__btn" href="/" target="_blank" rel="noopener" aria-label="View website"><Icon name="external" size={22} /></a>
          </header>
          <main className="adm-content">
            <div className="adm-page" key={path.split("/").slice(0, 4).join("/")}>{page}</div>
          </main>
          <nav className="adm-tabs" aria-label="Dashboard">
            {NAV.map((n) => (
              <a key={n.key} href={n.to} className={section === n.key ? "is-on" : ""} aria-current={section === n.key ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); go(n.to); }}>
                <span className="adm-tabs__pill">
                  <Icon name={n.icon} size={24} />
                  {n.key === "messages" && unread > 0 && <em className="adm-badge adm-badge--dot">{unread > 9 ? "9+" : unread}</em>}
                </span>
                <span>{n.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}

function Splash() {
  return (
    <div className="adm-boot" role="status" aria-label="Loading">
      <img className="adm-boot__mark" src="/brand/mark-splash.png" alt="" width="104" height="104" />
      <h1 className="adm-boot__name">PRAXIS KE</h1>
      <p className="adm-boot__sub">POLICY RESEARCH &amp; ADVISORY</p>
      <span className="adm-boot__rule" aria-hidden="true" />
      <p className="adm-boot__tag">Kenyan Roots. Global Perspective.</p>
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}

export default function AdminApp() {
  useDashboardChrome();
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out
  const [offline, setOffline] = useState(null);

  const check = useCallback(() => {
    setOffline(null);
    adminApi.me()
      .then((r) => setUser(r.authenticated ? r.user : null))
      .catch((e) => (e.offline ? setOffline(e) : setUser(null)));
  }, []);
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    check();
  }, [check]);

  if (offline)
    return (
      <div className="adm-boot adm-boot--msg">
        <Icon name="alert" size={40} />
        <h1>You’re offline</h1>
        <p>Connect to the internet to manage the website.</p>
        <button className="adm-btn" onClick={check}>Try again</button>
      </div>
    );
  if (user === undefined) return <Splash />;
  if (user === null) return <Login onDone={setUser} />;
  return (
    <UiProvider>
      <Shell user={user} onLogout={() => setUser(null)} />
    </UiProvider>
  );
}
