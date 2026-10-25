import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icons.jsx";
import { Link, useRoute } from "../../router.jsx";
import { adminApi, useData, when } from "../api.js";
import { useAdmin } from "../context.js";
import { Avatar, Chip, Empty, ErrorBox, Loading, useUi } from "../ui.jsx";

function Detail({ m, onPatch, onDelete }) {
  const reply = `mailto:${m.email}?subject=${encodeURIComponent("Re: Your message to Praxis KE")}&body=${encodeURIComponent(
    `\n\n— On ${when(m.created, true)}, you wrote:\n${m.message.split("\n").map((l) => "> " + l).join("\n")}`
  )}`;
  return (
    <div className="adm-detail">
      <div className="adm-detail__head">
        <Avatar name={m.name} size={56} />
        <div>
          <h2>{m.name}</h2>
          <a href={`mailto:${m.email}`}>{m.email}</a>
          {m.organisation && <p className="adm-muted">{m.organisation}</p>}
        </div>
        {m.handled && <span className="adm-pill adm-pill--done"><Icon name="check" size={14} /> Done</span>}
      </div>
      <p className="adm-detail__topic"><Icon name="mail" size={16} /> {m.topic_label}</p>
      <div className="adm-bubble">
        <p>{m.message}</p>
        <time>{when(m.created, true)}</time>
      </div>
      <div className="adm-detail__actions">
        <a className="adm-btn adm-btn--lg" href={reply}><Icon name="reply" size={20} /> Reply by email</a>
        <button className="adm-btn adm-btn--tonal adm-btn--lg" onClick={() => onPatch({ handled: !m.handled })}>
          <Icon name="check" size={20} /> {m.handled ? "Reopen" : "Mark as done"}
        </button>
        <button className="adm-btn adm-btn--text adm-btn--danger-text" onClick={onDelete}><Icon name="trash" size={20} /> Delete</button>
      </div>
    </div>
  );
}

export default function Messages({ id }) {
  const { data, loading, error, reload, setData } = useData(adminApi.messages);
  const { refreshSummary } = useAdmin();
  const { toast, confirm } = useUi();
  const { navigate } = useRoute();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const selected = data?.find((m) => String(m.id) === String(id));

  const patch = async (m, change, say) => {
    setData((list) => list.map((x) => (x.id === m.id ? { ...x, ...change, ...(change.handled ? { read: true } : {}) } : x)));
    try {
      await adminApi.patchMessage(m.id, change);
      refreshSummary();
      if (say) toast(say);
    } catch (e) {
      toast(e.message, "error");
      reload();
    }
  };

  // Opening a message marks it as read (like WhatsApp).
  useEffect(() => {
    if (selected && !selected.read) patch(selected, { read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const remove = async (m) => {
    if (!(await confirm({ title: "Delete this message?", text: `The message from ${m.name} will be permanently deleted.`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi.deleteMessage(m.id);
      setData((list) => list.filter((x) => x.id !== m.id));
      refreshSummary();
      navigate("/manage/messages");
      toast("Message deleted");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter(
      (m) =>
        (filter === "all" || (filter === "unread" && !m.read) || (filter === "done" && m.handled)) &&
        (!term || `${m.name} ${m.email} ${m.organisation} ${m.message}`.toLowerCase().includes(term))
    );
  }, [data, filter, q]);

  const unread = (data || []).filter((m) => !m.read).length;

  return (
    <div className="adm-split">
      <section className="adm-split__list" aria-label="Message list">
        <div className="adm-search">
          <Icon name="search" size={20} />
          <input type="search" placeholder="Search messages" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search messages" />
        </div>
        <div className="adm-chips">
          <Chip on={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          <Chip on={filter === "unread"} onClick={() => setFilter("unread")}>Unread{unread ? ` ${unread}` : ""}</Chip>
          <Chip on={filter === "done"} onClick={() => setFilter("done")}>Done</Chip>
        </div>
        {loading && <Loading />}
        {error && <ErrorBox error={error} onRetry={reload} />}
        {data && shown.length === 0 && (
          <Empty icon="mail" title={data.length ? "No messages here" : "No messages yet"}
            text={data.length ? "Try a different filter or search." : "When someone writes to you through the Contact page, it shows up here."} />
        )}
        <ul className="adm-chatlist">
          {shown.map((m) => (
            <li key={m.id}>
              <Link to={`/manage/messages/${m.id}`} className={`adm-chat ${String(m.id) === String(id) ? "is-selected" : ""} ${m.read ? "" : "is-unread"}`}>
                <Avatar name={m.name} />
                <span className="adm-chat__body">
                  <span className="adm-chat__top"><b>{m.name}</b><time>{when(m.created)}</time></span>
                  <span className="adm-chat__bottom">
                    <span className="adm-chat__preview">{m.handled && <Icon name="check" size={15} />} {m.message}</span>
                    {!m.read && <em className="adm-badge">1</em>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="adm-split__detail" aria-label="Message">
        {selected ? (
          <Detail m={selected} onPatch={(c) => patch(selected, c, c.handled ? "Marked as done" : "Reopened")} onDelete={() => remove(selected)} />
        ) : id && data ? (
          <Empty icon="mail" title="Message not found" text="It may have been deleted." />
        ) : (
          <div className="adm-split__placeholder"><Empty icon="mail" title="Select a message" text="Choose a conversation on the left to read it and reply." /></div>
        )}
      </section>
    </div>
  );
}
