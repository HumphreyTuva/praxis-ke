// Minimal History-API router (no dependency). Supports <Link>, hash anchors and scroll handling.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext({ path: "/", hash: "", navigate: () => {} });

const read = () => ({ path: window.location.pathname.replace(/\/+$/, "") || "/", hash: window.location.hash });

export function Router({ children }) {
  const [loc, setLoc] = useState(read);

  useEffect(() => {
    const onPop = () => setLoc(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to) => {
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, "", url.pathname + url.search + url.hash);
    setLoc(read());
  }, []);

  // Scroll to the anchor if there is one, otherwise to the top of the new page.
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const id = loc.hash.slice(1);
    const t = setTimeout(() => {
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo(0, 0);
    }, 30);
    return () => clearTimeout(t);
  }, [loc.path, loc.hash]);

  const value = useMemo(() => ({ ...loc, navigate }), [loc, navigate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRoute = () => useContext(Ctx);

export function Link({ to, onClick, children, ...rest }) {
  const { navigate } = useRoute();
  const handle = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target && rest.target !== "_self") return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
