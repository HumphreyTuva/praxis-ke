import { useCallback, useEffect, useState } from "react";

const csrf = () => (document.cookie.split("; ").find((c) => c.startsWith("csrftoken=")) || "").split("=")[1] || "";

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function req(path, { method = "GET", json, form } = {}) {
  const headers = { Accept: "application/json" };
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  if (method !== "GET") headers["X-CSRFToken"] = csrf();
  let res;
  try {
    res = await fetch(`/api/manage/${path}`, { method, headers, body, credentials: "same-origin" });
  } catch {
    const err = new Error("You appear to be offline. Check your connection and try again.");
    err.offline = true;
    throw err;
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    if (res.status === 401 && path !== "login/" && path !== "me/") onUnauthorized();
    const err = new Error(data?.error || "Something went wrong. Please try again.");
    err.status = res.status;
    err.errors = data?.errors || {};
    throw err;
  }
  return data;
}

export const adminApi = {
  me: () => req("me/"),
  login: (identifier, password) => req("login/", { method: "POST", json: { identifier, password } }),
  logout: () => req("logout/", { method: "POST" }),
  password: (current, next) => req("password/", { method: "POST", json: { current, new: next } }),
  summary: () => req("summary/"),
  messages: () => req("messages/").then((d) => d.results),
  patchMessage: (id, patch) => req(`messages/${id}/`, { method: "PATCH", json: patch }),
  deleteMessage: (id) => req(`messages/${id}/`, { method: "DELETE" }),
  publications: () => req("publications/").then((d) => d.results),
  publication: (id) => req(`publications/${id}/`),
  savePublication: (id, form) => req(id ? `publications/${id}/` : "publications/", { method: "POST", form }),
  deletePublication: (id) => req(`publications/${id}/`, { method: "DELETE" }),
  pillars: () => req("pillars/"),
  savePillar: (id, json) => req(id ? `pillars/${id}/` : "pillars/", { method: "POST", json }),
  deletePillar: (id) => req(`pillars/${id}/`, { method: "DELETE" }),
  reorderPillars: (ids) => req("pillars/reorder/", { method: "POST", json: { ids } }),
  site: () => req("site/"),
  saveSite: (json) => req("site/", { method: "POST", json }),
};

/** { data, loading, error, reload, setData } */
export function useData(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
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
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === "function" ? fn(s.data) : fn })), []);
  return { ...state, reload, setData };
}

export function when(iso, long = false) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round((startOf(now) - startOf(d)) / 86400000);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (long) return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${time}`;
  if (days === 0) return time;
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
