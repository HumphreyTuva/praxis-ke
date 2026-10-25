import { useEffect, useRef, useState } from "react";
import { api, useApi } from "../api.js";
import { Link, useRoute } from "../router.jsx";
import { Logo } from "./Brand.jsx";
import Icon from "./Icons.jsx";

export const NAV = [
  { to: "/about", label: "About" },
  { to: "/research", label: "Research" },
  { to: "/publications", label: "Publications" },
  { to: "/contact", label: "Contact" },
];

const isActive = (path, to) => path === to || path.startsWith(to + "/");

export function Header() {
  const { path } = useRoute();
  const [open, setOpen] = useState(false);
  const btn = useRef(null);
  const closeBtn = useRef(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.classList.toggle("no-scroll", open);
    if (open) closeBtn.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <>
      <div className="topbar">
        <span className="topbar__rule" aria-hidden="true" />
        <em>From Policy to Practice</em>
        <span className="topbar__rule" aria-hidden="true" />
      </div>
      <header className="site-header">
        <div className="container site-header__inner">
          <Logo secret />
          <nav className="nav" aria-label="Main">
            <Link to="/" aria-current={path === "/" ? "page" : undefined}>Home</Link>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} aria-current={isActive(path, n.to) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link to="/contact" className="btn btn--outline btn--sm site-header__cta">
            <span>Collaborate with us</span>
            <Icon name="arrow" size={16} />
          </Link>
          <button
            ref={btn}
            className="menu-btn"
            aria-expanded={open}
            aria-controls="drawer"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" size={26} />
          </button>
        </div>
      </header>

      {/* Mobile sidebar. Rendered outside <header> so the sticky/blurred header can't clip it. */}
      <div className={`drawer-overlay ${open ? "is-open" : ""}`} onClick={close} aria-hidden="true" />
      <aside id="drawer" className={`drawer ${open ? "is-open" : ""}`} aria-label="Menu" aria-hidden={!open}>
        <div className="drawer__head">
          <Logo secret />
          <button ref={closeBtn} className="drawer__close" aria-label="Close menu" onClick={close} tabIndex={open ? 0 : -1}>
            <Icon name="close" size={26} />
          </button>
        </div>
        <nav className="drawer__links" aria-label="Mobile">
          <Link to="/" tabIndex={open ? 0 : -1} aria-current={path === "/" ? "page" : undefined}>Home</Link>
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} tabIndex={open ? 0 : -1} aria-current={isActive(path, n.to) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="drawer__foot">
          <Link to="/contact" className="btn btn--primary" tabIndex={open ? 0 : -1}>
            <span>Collaborate with us</span>
            <Icon name="arrow" size={18} />
          </Link>
          <p className="drawer__tag">Kenyan Roots. Global Perspective.</p>
        </div>
      </aside>
    </>
  );
}

export function Socials({ site }) {
  const items = [
    site?.linkedin && { href: site.linkedin, icon: "linkedin", label: "LinkedIn" },
    site?.x && { href: site.x, icon: "x", label: "X" },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="socials">
      {items.map((i) => (
        <a key={i.label} href={i.href} target="_blank" rel="noopener noreferrer" aria-label={`Praxis KE on ${i.label}`}>
          <Icon name={i.icon} size={18} />
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  const { data: site } = useApi(api.site);
  return (
    <footer className="site-footer">
      <div className="container site-footer__row">
        <Logo variant="light" />
        <p className="site-footer__tag">Kenyan Roots. Global Perspective.</p>
        <nav aria-label="Footer">
          <ul>
            <li><Link to="/">Home</Link></li>
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to}>{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <Socials site={site} />
      </div>
      <div className="container site-footer__base">© {new Date().getFullYear()} Praxis KE. All rights reserved.</div>
    </footer>
  );
}
