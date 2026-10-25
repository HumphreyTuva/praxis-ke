import { useEffect } from "react";
import { useAdmin } from "./context.js";
import { useUi } from "./ui.jsx";

/** Ask before leaving a form with unsaved changes (back button, tabs, sidebar, closing the tab). */
export function useLeaveGuard(dirty) {
  const { guard } = useAdmin();
  const { confirm } = useUi();
  useEffect(() => {
    const fn = async () =>
      dirty
        ? confirm({ title: "Leave without saving?", text: "Your changes haven’t been saved yet.", confirmLabel: "Leave", cancelLabel: "Keep editing", danger: true })
        : true;
    fn.dirty = dirty;
    guard.current = fn;
    return () => {
      guard.current = null;
    };
  }, [dirty, confirm, guard]);
}
