import { useCallback, useEffect, useState } from "react";

async function request(url, options) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, ...options });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const err = new Error(`Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  pillars: () => request("/api/pillars/").then((d) => d.results),
  publications: () => request("/api/publications/").then((d) => d.results),
  publication: (slug) => request(`/api/publications/${encodeURIComponent(slug)}/`),
  site: () => request("/api/site/"),
  featured: () => request("/api/publications/featured/").then((d) => d.result),
  contact: (payload) =>
    request("/api/contact/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    }),
};

/** Tiny data hook: { data, loading, error, retry }. */
export function useApi(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const retry = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((error) => live && setState({ data: null, loading: false, error }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, retry };
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
