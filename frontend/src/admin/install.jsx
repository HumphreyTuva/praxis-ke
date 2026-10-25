import { useEffect, useState } from "react";
import Icon from "../components/Icons.jsx";
import { Sheet } from "./ui.jsx";

const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function useInstall() {
  const [evt, setEvt] = useState(() => window.__installEvent || null);
  const [installed, setInstalled] = useState(isStandalone());
  useEffect(() => {
    const ready = () => setEvt(window.__installEvent || null);
    const done = () => setInstalled(true);
    window.addEventListener("praxis-install-ready", ready);
    window.addEventListener("praxis-installed", done);
    return () => {
      window.removeEventListener("praxis-install-ready", ready);
      window.removeEventListener("praxis-installed", done);
    };
  }, []);
  const prompt = async () => {
    if (!evt) return "manual";
    evt.prompt();
    const choice = await evt.userChoice;
    window.__installEvent = null;
    setEvt(null);
    return choice.outcome;
  };
  return { installed, canPrompt: !!evt, ios: isIOS(), prompt };
}

/** Sheet explaining how to install when the browser can't show its own prompt. */
function HowToSheet({ open, onClose, ios }) {
  return (
    <Sheet open={open} onClose={onClose} title="Install the Admin app">
      {ios ? (
        <ol className="adm-steps">
          <li>Tap the <b>Share</b> button at the bottom of Safari.</li>
          <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
          <li>Tap <b>Add</b>. The Praxis KE Admin icon appears on your home screen.</li>
        </ol>
      ) : (
        <ol className="adm-steps">
          <li>Open your browser’s menu (the <b>⋮</b> or <b>⋯</b> button).</li>
          <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
          <li>Confirm. The app opens full-screen, like any other app.</li>
        </ol>
      )}
      <button className="adm-btn adm-btn--tonal adm-btn--block" onClick={onClose}>Got it</button>
    </Sheet>
  );
}

/** variant: "banner" (home screen card) | "row" (settings list) | "button" (sidebar) */
export function InstallButton({ variant = "button" }) {
  const { installed, canPrompt, ios, prompt } = useInstall();
  const [help, setHelp] = useState(false);
  if (installed) return variant === "row" ? <div className="adm-row adm-row--static"><span className="adm-row__icon"><Icon name="check" size={22} /></span><span className="adm-row__text"><b>App installed</b><small>You’re using the installed app.</small></span></div> : null;

  const click = async () => {
    const r = await prompt();
    if (r === "manual") setHelp(true);
  };
  const sheet = <HowToSheet open={help} onClose={() => setHelp(false)} ios={ios} />;

  if (variant === "banner")
    return (
      <>
        <button className="adm-install" onClick={click}>
          <span className="adm-install__icon"><Icon name="phone" size={26} /></span>
          <span className="adm-install__text">
            <b>Install the Admin app</b>
            <small>{ios ? "Add it to your home screen" : "One tap to open it like any other app"}</small>
          </span>
          <span className="adm-install__cta">Install</span>
        </button>
        {sheet}
      </>
    );
  if (variant === "row")
    return (
      <>
        <button className="adm-row" onClick={click}>
          <span className="adm-row__icon"><Icon name="download" size={22} /></span>
          <span className="adm-row__text"><b>Install app</b><small>{canPrompt ? "Add Praxis KE Admin to your device" : "See how to add it to your device"}</small></span>
          <Icon name="chevron" size={20} />
        </button>
        {sheet}
      </>
    );
  return (
    <>
      <button className="adm-side__btn" onClick={click}>
        <Icon name="download" size={20} /> Install app
      </button>
      {sheet}
    </>
  );
}
