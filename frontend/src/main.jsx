import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Router } from "./router.jsx";
import "./styles.css";

// Keep the install prompt so the dashboard's "Install app" button can use it later.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__installEvent = e;
  window.dispatchEvent(new Event("praxis-install-ready"));
});
window.addEventListener("appinstalled", () => {
  window.__installEvent = null;
  window.dispatchEvent(new Event("praxis-installed"));
});
if ("serviceWorker" in navigator && import.meta.env?.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
