import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icons.jsx";
import { Link, useRoute } from "../../router.jsx";
import { adminApi, useData, when } from "../api.js";
import { useAdmin } from "../context.js";
import { useLeaveGuard } from "../guard.js";
import { Card, Chip, Empty, ErrorBox, Fab, Field, FilePicker, ListEditor, Loading, Switch, useUi } from "../ui.jsx";

const STATUS = {
  draft: { label: "Draft", hint: "Only you can see it. Keep working on it.", icon: "edit" },
  forthcoming: { label: "In development", hint: "Shown on the website with an “In development” label.", icon: "clock" },
  published: { label: "Published", hint: "Live on the website. Add a PDF so people can download it.", icon: "check" },
};
const KINDS = [["brief", "Policy brief"], ["note", "Research note"], ["commentary", "Commentary"], ["report", "Report"]];

const StatusChip = ({ s }) => <span className={`adm-pill adm-pill--${s}`}>{STATUS[s]?.label || s}</span>;

export function Publications() {
  const { navigate } = useRoute();
  const { data, loading, error, reload } = useData(adminApi.publications);
  const [q, setQ] = useState("");
  const shown = useMemo(() => (data || []).filter((p) => !q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase())), [data, q]);
  return (
    <div className="adm-narrow">
      <div className="adm-toolbar">
        <div className="adm-search"><Icon name="search" size={20} /><input type="search" placeholder="Search publications" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search publications" /></div>
        <Link to="/manage/publications/new" className="adm-btn adm-desktop-only"><Icon name="plus" size={20} /> New publication</Link>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <Empty icon="doc" title="No publications yet" text="Add your first policy brief, research note or report.">
          <Link to="/manage/publications/new" className="adm-btn"><Icon name="plus" size={20} /> New publication</Link>
        </Empty>
      )}
      <ul className="adm-rows">
        {shown.map((p) => (
          <li key={p.id}>
            <Link to={`/manage/publications/${p.id}`} className="adm-pub">
              <span className="adm-pub__cover">{p.cover ? <img src={p.cover} alt="" loading="lazy" /> : <Icon name="doc" size={26} />}</span>
              <span className="adm-pub__body">
                <b>{p.title}</b>
                <span className="adm-pub__meta"><StatusChip s={p.status} /><span>{p.kind_label}</span>{p.featured && <span className="adm-pub__star"><Icon name="star" size={14} /> On Home</span>}</span>
                <small>{p.published_on ? `Published ${when(p.published_on + "T12:00:00")}` : `Edited ${when(p.updated)}`}</small>
              </span>
              <Icon name="chevron" size={20} />
            </Link>
          </li>
        ))}
      </ul>
      <Fab label="New" onClick={() => navigate("/manage/publications/new")} />
    </div>
  );
}

const BLANK = {
  title: "", subtitle: "", author: "", kind: "brief", status: "draft", summary: "", research_question: "", purpose: "", outputs: [],
  scope_note: "", body: "", regions: "", pillars: [], featured: false, published_on: "",
};

export function PublicationEditor({ id }) {
  const { navigate } = useRoute();
  const { refreshSummary } = useAdmin();
  const { toast, confirm } = useUi();
  const loaded = useData(() => (id ? adminApi.publication(id) : Promise.resolve(null)), [id]);
  const pillars = useData(adminApi.pillars);
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState("");
  const [cover, setCover] = useState({ file: null, clear: false });
  const [pdf, setPdf] = useState({ file: null, clear: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded.loading || loaded.error) return;
    const base = loaded.data ? { ...BLANK, ...loaded.data, published_on: loaded.data.published_on || "" } : BLANK;
    setForm(base);
    setInitial(JSON.stringify(base));
    setCover({ file: null, clear: false });
    setPdf({ file: null, clear: false });
  }, [loaded.data, loaded.loading, loaded.error]);

  const dirty = !!form && (JSON.stringify(form) !== initial || !!cover.file || cover.clear || !!pdf.file || pdf.clear);
  useLeaveGuard(dirty);

  if (loaded.loading || !form) return loaded.error ? <ErrorBox error={loaded.error} onRetry={loaded.reload} /> : <Loading />;

  const isCommentary = form.kind === "commentary";
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e })); setErrors((x) => ({ ...x, [k]: undefined })); };
  const togglePillar = (slug) => setForm((f) => ({ ...f, pillars: f.pillars.includes(slug) ? f.pillars.filter((s) => s !== slug) : [...f.pillars, slug] }));

  async function save() {
    const local = {};
    if (!form.title.trim()) local.title = "Please give the publication a title.";
    if (form.status !== "draft" && !form.summary.trim()) local.summary = "Add a short summary before showing this on the website.";
    setErrors(local);
    if (Object.keys(local).length) {
      toast("Please fix the highlighted fields", "error");
      document.getElementById(`pf-${Object.keys(local)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const fd = new FormData();
    ["title", "subtitle", "author", "kind", "status", "summary", "research_question", "scope_note", "body", "regions", "published_on"].forEach((k) => fd.append(k, form[k] ?? ""));
    fd.append("purpose", isCommentary ? "" : form.purpose ?? "");
    fd.append("outputs", JSON.stringify(form.outputs.filter((x) => x.trim())));
    fd.append("pillars", JSON.stringify(form.pillars));
    fd.append("featured", form.featured ? "true" : "false");
    if (cover.file) fd.append("cover", cover.file);
    if (cover.clear) fd.append("clear_cover", "true");
    if (pdf.file) fd.append("file", pdf.file);
    if (pdf.clear) fd.append("clear_file", "true");
    setBusy(true);
    try {
      const saved = await adminApi.savePublication(id, fd);
      refreshSummary();
      toast(id ? "Changes saved" : "Publication created");
      if (!id) navigate(`/manage/publications/${saved.id}`);
      else loaded.reload();
    } catch (e) {
      setErrors(e.errors || {});
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirm({ title: "Delete this publication?", text: "It will be removed from the website. This can’t be undone.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi.deletePublication(id);
      refreshSummary();
      toast("Publication deleted");
      navigate("/manage/publications");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const coverValue = !cover.clear && loaded.data?.cover ? { url: loaded.data.cover, name: "Current cover" } : null;
  const pdfValue = !pdf.clear && loaded.data?.file_url ? { name: loaded.data.file_name } : null;

  return (
    <div className="adm-form">
      <Card title="The basics">
        <Field label="Title" htmlFor="pf-title" error={errors.title}><input id="pf-title" value={form.title} onChange={set("title")} placeholder="e.g. From Transparency to Accountability" /></Field>
        <Field label="Subtitle (optional)" htmlFor="pf-subtitle" hint="A longer line shown under the title."><textarea id="pf-subtitle" rows={2} value={form.subtitle} onChange={set("subtitle")} /></Field>
        <Field label="Author / commentator (optional)" htmlFor="pf-author" hint="Shown with Praxis KE and the publication date."><input id="pf-author" maxLength={160} value={form.author} onChange={set("author")} placeholder="e.g. Nancy Kanana" /></Field>
        <Field label="What kind is it?">
          <div className="adm-chips adm-chips--wrap">{KINDS.map(([k, l]) => <Chip key={k} on={form.kind === k} onClick={() => setForm((f) => ({ ...f, kind: k }))}>{l}</Chip>)}</div>
        </Field>
      </Card>

      <Card title="Who can see it?">
        <div className="adm-choices" role="radiogroup" aria-label="Status">
          {Object.entries(STATUS).map(([k, s]) => (
            <button type="button" role="radio" aria-checked={form.status === k} key={k} className={`adm-choice adm-choice--${k} ${form.status === k ? "is-on" : ""}`} onClick={() => setForm((f) => ({ ...f, status: k }))}>
              <span className="adm-choice__icon"><Icon name={s.icon} size={22} /></span>
              <span><b>{s.label}</b><small>{s.hint}</small></span>
              <span className="adm-choice__radio" aria-hidden="true" />
            </button>
          ))}
        </div>
        {form.status === "published" && (
          <Field label="Publication date" htmlFor="pf-date" error={errors.published_on}><input id="pf-date" type="date" value={form.published_on} onChange={set("published_on")} /></Field>
        )}
        <Switch checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} title="Show on the Home page" hint="Only one publication is featured at a time." />
      </Card>

      <Card title={isCommentary ? "HOOK" : "Summary"} hint="A few sentences that appear on cards and at the top of the page.">
        <Field htmlFor="pf-summary" error={errors.summary}><textarea id="pf-summary" rows={4} value={form.summary} onChange={set("summary")} /></Field>
      </Card>

      {isCommentary ? (
        <Card title="The Argument">
          <Field label="The Argument" htmlFor="pf-rq"><textarea id="pf-rq" rows={3} value={form.research_question} onChange={set("research_question")} /></Field>
          <Field label="The Evidence" hint="One point per line item.">
            <ListEditor items={form.outputs} onChange={(v) => setForm((f) => ({ ...f, outputs: v }))} placeholder="Add a piece of evidence" />
          </Field>
          <Field label="So What?" htmlFor="pf-scope"><textarea id="pf-scope" rows={3} value={form.scope_note} onChange={set("scope_note")} /></Field>
        </Card>
      ) : (
        <Card title="Research details" hint="Optional, but they make the page richer.">
          <Field label="Research question" htmlFor="pf-rq"><textarea id="pf-rq" rows={3} value={form.research_question} onChange={set("research_question")} /></Field>
          <Field label="Purpose" htmlFor="pf-purpose"><textarea id="pf-purpose" rows={4} value={form.purpose} onChange={set("purpose")} /></Field>
          <Field label={form.status === "published" ? "What it includes" : "What it will include"} hint="One point per line item.">
            <ListEditor items={form.outputs} onChange={(v) => setForm((f) => ({ ...f, outputs: v }))} placeholder="e.g. A comparison of the legal frameworks" />
          </Field>
          <Field label="Scope and limitations" htmlFor="pf-scope" hint="Be honest about what the research can and can’t show."><textarea id="pf-scope" rows={3} value={form.scope_note} onChange={set("scope_note")} /></Field>
        </Card>
      )}

      <Card title="Where and what about">
        <Field label="Countries or contexts" htmlFor="pf-regions" hint="Separate with commas, e.g. Kenya, South Africa"><input id="pf-regions" value={form.regions} onChange={set("regions")} /></Field>
        <Field label="Research areas it belongs to">
          <div className="adm-chips adm-chips--wrap">
            {(pillars.data?.results || []).map((p) => <Chip key={p.slug} on={form.pillars.includes(p.slug)} onClick={() => togglePillar(p.slug)}>{p.title}</Chip>)}
          </div>
        </Field>
      </Card>

      <Card title={isCommentary ? "sources" : "Full text"} hint="Optional. Leave a blank line between paragraphs. Start a line with ## to make a heading.">
        <Field htmlFor="pf-body"><textarea id="pf-body" rows={10} value={form.body} onChange={set("body")} /></Field>
      </Card>

      <Card title="Cover and download">
        <Field label="Cover image" hint="Portrait works best (3:4). JPG, PNG or WebP, up to 6 MB. Without one, a branded cover is made for you." error={errors.cover}>
          <FilePicker kind="image" label="No cover yet" value={coverValue} file={cover.file}
            onPick={(f) => setCover({ file: f, clear: false })} onClear={() => setCover({ file: null, clear: true })} />
        </Field>
        <Field label="PDF to download" hint="People can download this from the publication page once it’s published. Up to 25 MB." error={errors.file}>
          <FilePicker kind="pdf" label="No PDF yet" value={pdfValue} file={pdf.file}
            onPick={(f) => setPdf({ file: f, clear: false })} onClear={() => setPdf({ file: null, clear: true })} />
        </Field>
      </Card>

      {id && (
        <div className="adm-danger-zone">
          {loaded.data?.status !== "draft" && <a className="adm-btn adm-btn--tonal" href={`/publications/${loaded.data.slug}`} target="_blank" rel="noopener"><Icon name="external" size={20} /> View on website</a>}
          <button className="adm-btn adm-btn--text adm-btn--danger-text" onClick={remove}><Icon name="trash" size={20} /> Delete publication</button>
        </div>
      )}

      <div className="adm-savebar">
        <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="adm-btn adm-btn--lg" onClick={save} disabled={busy || (!dirty && !!id)}>{busy ? "Saving…" : id ? "Save changes" : "Create publication"}</button>
      </div>
    </div>
  );
}
