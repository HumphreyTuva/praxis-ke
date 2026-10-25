import { useRef } from "react";
import { Link } from "../router.jsx";

/** Hidden owner entrance: press and hold the logo (phones/tablets). Desktop uses Ctrl+Shift+A. */
export function openDashboard() {
  try { navigator.vibrate?.(30); } catch { /* ignore */ }
  window.location.assign("/manage");
}

/** Header / footer logo lock-up: supplied P monogram + live-text wordmark (stays crisp at any size). */
export function Logo({ variant = "dark", to = "/", secret = false }) {
  const timer = useRef(null);
  const fired = useRef(false);
  const start = (e) => {
    if (!secret || (e.pointerType === "mouse" && e.button !== 0)) return;
    fired.current = false;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fired.current = true;
      openDashboard();
    }, 700);
  };
  const cancel = () => clearTimeout(timer.current);
  const secretProps = secret
    ? {
        onPointerDown: start,
        onPointerUp: cancel,
        onPointerLeave: cancel,
        onPointerCancel: cancel,
        onContextMenu: (e) => e.preventDefault(),
        onClickCapture: (e) => {
          if (fired.current) {
            e.preventDefault();
            e.stopPropagation();
            fired.current = false;
          }
        },
        "data-secret": "1",
      }
    : {};
  return (
    <Link to={to} className={`logo logo--${variant}`} aria-label="Praxis KE — home" {...secretProps}>
      <img
        className="logo__mark"
        src={variant === "light" ? "/brand/mark-ivory.png" : "/brand/mark-green.png"}
        alt=""
        width="44"
        height="60"
      />
      <span className="logo__text">
        <span className="logo__name">
          PRAXIS <span className="logo__ke">KE</span>
        </span>
        <span className="logo__desc">Policy Research &amp; Advisory</span>
      </span>
    </Link>
  );
}

export function GoldRule({ children }) {
  return (
    <span className="eyebrow">
      <span className="eyebrow__rule" aria-hidden="true" />
      {children}
    </span>
  );
}
