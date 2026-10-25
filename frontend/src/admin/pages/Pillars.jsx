import { useEffect, useState } from "react";
import Icon from "../../components/Icons.jsx";
import { Link, useRoute } from "../../router.jsx";
import { adminApi, useData } from "../api.js";
import { useAdmin } from "../context.js";
import { useLeaveGuard } from "../guard.js";
import { Card, Empty, ErrorBox, Fab, Field, ListEditor, Loading, useUi } from "../ui.jsx";

const ICON_LABEL = { design: "Policy design", implementation: "Delivery", accountability: "Accountability", comparative: "Comparative", outcomes: "Outcomes" };

export function Pillars() {
  const { navigate } = useRoute();
  const { toast } = useUi();
  const { data, loading, error, reload, setData } = useData(adminApi.pillars);

  const move = async (i, dir) => {
    const list = [...data.results];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setData((d) => ({ ...d, results: list }));
    try {
      await adminApi.reorderPillars(list.map((p) => p.id));
    } catch (e) {
      toast(e.message, "error");
      reload();
    }
  };

  return (
    <div className="adm-narrow">
      <p className="adm-intro">These are the research areas shown on your Home and Research pages. Use the arrows to change their order.</p>
      <div className="adm-toolbar adm-desktop-only"><span /><Link to="/manage/pillars/new" className="adm-btn"><Icon name="plus" size={20} /> New research area</Link></div>
      {loading && <Loading />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && data.results.length === 0 && <Empty icon="design" title="No research areas yet" text="Add the topics your research covers." />}
      <ul className="adm-rows">
        {data?.results.map((p, i) => (
          <li key={p.id} className="adm-pillar">
            <Link to={`/manage/pillars/${p.id}`} className="adm-pillar__main">
              <span className="adm-disc"><Icon name={p.icon} size={24} /></span>
              <span className="adm-pillar__text"><b>{p.title}</b><small>{p.summary}</small></span>
            </Link>
            <span className="adm-pillar__move">
              <button className="adm-icon-btn" aria-label={`Move ${p.title} up`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={20} /></button>
              <button className="adm-icon-btn" aria-label={`Move ${p.title} down`} disabled={i === data.results.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={20} /></button>
            </span>
          </li>
        ))}
      </ul>
      <Fab label="New" onClick={() => navigate("/manage/pillars/new")} />
    </div>
  );
}

const BLANK = { title: "", icon: "design", summary: "", description: "", key_questions: [] };

export function PillarEditor({ id }) {
  const { navigate } = useRoute();
  const { refreshSummary } = useAdmin();
  const { toast, confirm } = useUi();
  const list = useData(adminApi.pillars);
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!list.data) return;
    const found = id ? list.data.results.find((p) => String(p.id) === String(id)) : null;
    const base = found ? { ...BLANK, ...found } : BLANK;
    setForm(base);
    setInitial(JSON.stringify(base));
  }, [list.data, id]);

  const dirty = !!form && JSON.stringify(form) !== initial;
  useLeaveGuard(dirty);

  if (list.error) return <ErrorBox error={list.error} onRetry={list.reload} />;
  if (!form) return <Loading />;
  if (id && !list.data.results.some((p) => String(p.id) === String(id))) return <Empty icon="design" title="Not found" text="This research area may have been deleted." />;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  async function save() {
    const local = {};
    if (!form.title.trim()) local.title = "Please give this research area a title.";
    if (!form.summary.trim()) local.summary = "Add a one or two sentence summary.";
    if (form.summary.length > 240) local.summary = "Please keep the summary under 240 characters.";
    setErrors(local);
    if (Object.keys(local).length) { toast("Please fix the highlighted fields", "error"); return; }
    setBusy(true);
    try {
      const saved = await adminApi.savePillar(id, { ...form, key_questions: form.key_questions.filter((q) => q.trim()) });
      refreshSummary();
      toast(id ? "Changes saved" : "Research area added");
      if (!id) navigate(`/manage/pillars/${saved.id}`);
      else list.reload();
    } catch (e) {
      setErrors(e.errors || {});
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirm({ title: "Delete this research area?", text: "It will disappear from the website. This can’t be undone.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi.deletePillar(id);
      refreshSummary();
      toast("Research area deleted");
      navigate("/manage/pillars");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div className="adm-form">
      <Card title="Research area">
        <Field label="Title" htmlFor="pi-title" error={errors.title}><input id="pi-title" value={form.title} onChange={set("title")} /></Field>
        <Field label="Icon">
          <div className="adm-icons" role="radiogroup" aria-label="Icon">
            {Object.keys(ICON_LABEL).map((k) => (
              <button type="button" role="radio" aria-checked={form.icon === k} key={k} className={form.icon === k ? "is-on" : ""} onClick={() => setForm((f) => ({ ...f, icon: k }))}>
                <Icon name={k} size={28} /><small>{ICON_LABEL[k]}</small>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Short summary" htmlFor="pi-summary" hint={`${form.summary.length}/240. Shown on cards.`} error={errors.summary}><textarea id="pi-summary" rows={3} value={form.summary} onChange={set("summary")} /></Field>
      </Card>
      <Card title="More detail" hint="Shown on this area’s own page.">
        <Field label="Description" htmlFor="pi-desc"><textarea id="pi-desc" rows={6} value={form.description} onChange={set("description")} /></Field>
        <Field label="Questions we ask"><ListEditor items={form.key_questions} onChange={(v) => setForm((f) => ({ ...f, key_questions: v }))} placeholder="e.g. Were the policy’s assumptions realistic?" addLabel="Add a question" /></Field>
      </Card>
      {id && <div className="adm-danger-zone"><button className="adm-btn adm-btn--text adm-btn--danger-text" onClick={remove}><Icon name="trash" size={20} /> Delete research area</button></div>}
      <div className="adm-savebar">
        <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="adm-btn adm-btn--lg" onClick={save} disabled={busy || (!dirty && !!id)}>{busy ? "Saving…" : id ? "Save changes" : "Add research area"}</button>
      </div>
    </div>
  );
}
