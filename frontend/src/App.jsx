import { lazy, Suspense, useEffect } from "react";
import { openDashboard } from "./components/Brand.jsx";
import { Footer, Header } from "./components/Layout.jsx";
import { useRoute } from "./router.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import PublicationDetail from "./pages/PublicationDetail.jsx";
import Publications from "./pages/Publications.jsx";
import PillarDetail from "./pages/PillarDetail.jsx";
import Research from "./pages/Research.jsx";

const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));

function Routes({ path }) {
  if (path === "/") return <Home />;
  if (path === "/about") return <About />;
  if (path === "/research") return <Research />;
  if (path === "/publications") return <Publications />;
  if (path === "/contact") return <Contact />;
  const pm = path.match(/^\/research\/([\w-]+)$/);
  if (pm) return <PillarDetail slug={pm[1]} />;
  const m = path.match(/^\/publications\/([\w-]+)$/);
  if (m) return <PublicationDetail slug={m[1]} />;
  return <NotFound />;
}

export default function App() {
  const { path } = useRoute();

  // Owner shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac) from anywhere on the public site.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        openDashboard();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (path === "/manage" || path.startsWith("/manage/")) {
    return (
      <Suspense fallback={<div className="adm-boot" role="status" aria-label="Loading" />}>
        <AdminApp />
      </Suspense>
    );
  }
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes path={path} />
      </main>
      <Footer />
    </>
  );
}
