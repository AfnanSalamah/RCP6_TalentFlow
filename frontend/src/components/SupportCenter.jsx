import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { supportApi } from "../api/index";

const CATEGORIES = [
  "Technical Issue",
  "Login Issue",
  "Resume Issue",
  "Contract Issue",
  "Interview Issue",
  "Account Issue",
  "General Support",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const statusColors = {
  Open: { bg: "#EAF7FA", text: "#0A6E86", border: "#BFE9F2" },
  "In Progress": { bg: "#FFF7E6", text: "#A15C00", border: "#FEDB8B" },
  Resolved: { bg: "#ECFDF3", text: "#047857", border: "#B7E4C7" },
  Closed: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
};

const priorityColors = {
  Low: "#94A3B8",
  Medium: "#2E7DA1",
  High: "#F59E0B",
  Urgent: "#DC2626",
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8001";

export default function SupportCenter({ portal = "applicant" }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [thread, setThread] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "General Support",
    priority: "Medium",
    message: "",
  });
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const stats = useMemo(() => ({
    open: tickets.filter((t) => ["Open", "In Progress"].includes(t.status)).length,
    resolved: tickets.filter((t) => ["Resolved", "Closed"].includes(t.status)).length,
    unread: tickets.filter((t) => t.unreadForUser).length,
  }), [tickets]);

  async function loadList() {
    try {
      const data = await supportApi.myTickets(portal);
      setTickets(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(id) {
    const data = await supportApi.getTicket(id, portal);
    setThread(data);
  }

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (openId) {
        loadThread(openId);
      } else {
        loadList();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [openId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function openTicket(id) {
    setOpenId(id);
    setThread(null);
    setNotice(null);
    await loadThread(id);
  }

  async function backToList() {
    setOpenId(null);
    setThread(null);
    setNotice(null);
    await loadList();
  }

  async function submitNew(event) {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setBusy("create");
    setNotice(null);
    try {
      const ticket = await supportApi.create(form, portal);
      setCreating(false);
      setForm({ subject: "", category: "General Support", priority: "Medium", message: "" });
      await loadList();
      await openTicket(ticket.id);
      setNotice({ type: "success", message: "Your ticket was sent. Support will reply here." });
    } catch (error) {
      setNotice({ type: "error", message: "Ticket could not be sent. Please try again." });
    } finally {
      setBusy("");
    }
  }

  async function sendReply() {
    if (!reply.trim() || !openId) return;
    setBusy("reply");
    setNotice(null);
    try {
      const updated = await supportApi.reply(openId, reply.trim(), portal);
      setThread(updated);
      setReply("");
      setNotice({ type: "success", message: "Your message was sent." });
    } catch (error) {
      setNotice({ type: "error", message: "Message could not be sent. Please try again." });
    } finally {
      setBusy("");
    }
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file || !openId) return;
    setBusy("upload");
    setNotice(null);
    try {
      await supportApi.uploadAttachment(openId, file, portal);
      await loadThread(openId);
      setNotice({ type: "success", message: "Attachment uploaded." });
    } catch (error) {
      setNotice({ type: "error", message: "Attachment could not be uploaded." });
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (openId) {
    return (
      <div style={styles.shell}>
        <button type="button" onClick={backToList} style={styles.backButton}>
          <ArrowLeft size={17} /> Back to all tickets
        </button>

        {!thread ? (
          <div style={styles.loadingBox}>
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : (
          <section style={styles.threadPanel}>
            <div style={styles.threadHeader}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.kicker}>Ticket #{thread.id}</div>
                <h2 style={styles.threadTitle}>{thread.subject}</h2>
                <div style={styles.metaLine}>
                  <span>{thread.category}</span>
                  <span style={styles.dot} />
                  <span>{thread.priority} priority</span>
                </div>
              </div>
              <StatusBadge status={thread.status} />
            </div>

            {notice && <Notice notice={notice} />}

            <div style={styles.messages}>
              {thread.messages?.map((message) => {
                const mine = message.senderType === "user";
                return (
                  <div key={message.id} style={{ ...styles.messageRow, justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div style={{ ...styles.messageBubble, ...(mine ? styles.myBubble : styles.supportBubble) }}>
                      <div style={{ ...styles.sender, color: mine ? "#DBEAFE" : "#0A4174" }}>
                        {mine ? "You" : message.senderName || "Support Team"}
                      </div>
                      <p style={styles.messageText}>{message.message}</p>
                      {message.attachments?.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`${apiBase}${attachment.url}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ ...styles.attachment, color: mine ? "#DBEAFE" : "#0A6E86" }}
                        >
                          <Paperclip size={12} /> {attachment.fileName}
                        </a>
                      ))}
                      <div style={{ ...styles.time, color: mine ? "#BFDBFE" : "#94A3B8" }}>{message.createdAt}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div style={styles.composer}>
              {thread.status === "Closed" && (
                <div style={styles.reopenNote}>Send a reply to reopen this ticket and continue the conversation.</div>
              )}
              <div style={styles.composerRow}>
                <input ref={fileRef} type="file" hidden onChange={onFile} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy === "upload"}
                  style={styles.iconButton}
                  title="Attach file"
                >
                  {busy === "upload" ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
                </button>
                <textarea
                  rows={1}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Write your message..."
                  style={styles.replyInput}
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={busy === "reply" || !reply.trim()}
                  style={{ ...styles.primaryButton, minWidth: 46, padding: "12px 14px" }}
                  title="Send message"
                >
                  {busy === "reply" ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.hero}>
        <div style={styles.heroIcon}><LifeBuoy size={24} /></div>
        <div>
          <div style={styles.kicker}>Platform Support</div>
          <h2 style={styles.title}>How can we help?</h2>
          <p style={styles.subtitle}>Send a ticket, follow replies, and keep all support communication in one place.</p>
        </div>
        <div style={styles.heroActions}>
          <button type="button" onClick={loadList} style={styles.secondaryButton}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button type="button" onClick={() => setCreating(true)} style={styles.primaryButton}>
            <Plus size={16} /> New Ticket
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Active Tickets" value={stats.open} />
        <StatCard label="Resolved" value={stats.resolved} />
        <StatCard label="New Replies" value={stats.unread} />
      </div>

      {notice && <Notice notice={notice} />}

      <section style={styles.listPanel}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Your Tickets</h3>
            <p style={styles.sectionSub}>Support replies update automatically every few seconds.</p>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div style={styles.emptyState}>
            <MessageSquare size={38} />
            <h3 style={styles.emptyTitle}>No support tickets yet</h3>
            <p style={styles.emptyText}>Create a ticket and the support team will respond in this page.</p>
            <button type="button" onClick={() => setCreating(true)} style={styles.primaryButton}>
              <Plus size={16} /> Create Ticket
            </button>
          </div>
        ) : (
          <div style={styles.ticketList}>
            {tickets.map((ticket) => (
              <button key={ticket.id} type="button" onClick={() => openTicket(ticket.id)} style={styles.ticketCard}>
                <span style={{ ...styles.priorityDot, background: priorityColors[ticket.priority] || "#94A3B8" }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={styles.ticketTop}>
                    <h4 style={styles.ticketTitle}>
                      {ticket.subject}
                      {ticket.unreadForUser && <span style={styles.unreadDot} />}
                    </h4>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div style={styles.ticketMeta}>
                    <span>{ticket.category}</span>
                    <span style={styles.dot} />
                    <span>{ticket.priority}</span>
                    <span style={styles.dot} />
                    <span>{ticket.messageCount} messages</span>
                    <span style={styles.dot} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> {ticket.lastMessageAt}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {creating && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.kicker}>New request</div>
                <h2 style={styles.modalTitle}>Contact Support</h2>
              </div>
              <button type="button" onClick={() => setCreating(false)} style={styles.iconButton}><X size={18} /></button>
            </div>
            <form onSubmit={submitNew} style={styles.form}>
              <Field label="Subject">
                <input
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  required
                  placeholder="Brief summary of your issue"
                  style={styles.input}
                />
              </Field>
              <div style={styles.formGrid}>
                <Field label="Category">
                  <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} style={styles.input}>
                    {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} style={styles.input}>
                    {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Message">
                <textarea
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  required
                  rows={5}
                  placeholder="Describe what happened and what you need help with."
                  style={{ ...styles.input, resize: "vertical", minHeight: 130 }}
                />
              </Field>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setCreating(false)} style={styles.secondaryButton}>Cancel</button>
                <button type="submit" disabled={busy === "create"} style={styles.primaryButton}>
                  {busy === "create" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const color = statusColors[status] || statusColors.Open;
  return (
    <span style={{
      border: `1px solid ${color.border}`,
      background: color.bg,
      color: color.text,
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      padding: "5px 10px",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function Notice({ notice }) {
  const good = notice.type === "success";
  return (
    <div style={{
      border: `1px solid ${good ? "#B7E4C7" : "#FECACA"}`,
      background: good ? "#ECFDF3" : "#FEF2F2",
      color: good ? "#047857" : "#B91C1C",
      borderRadius: 12,
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 700,
    }}>
      {notice.message}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  shell: {
    display: "grid",
    gap: 18,
    maxWidth: 1120,
    margin: "0 auto",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 22,
    borderRadius: 18,
    background: "linear-gradient(135deg, rgba(10,65,116,0.08), rgba(78,142,162,0.12))",
    border: "1px solid rgba(78,142,162,0.24)",
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    color: "#fff",
    background: "linear-gradient(135deg,#0A4174,#4E8EA2)",
    flexShrink: 0,
  },
  heroActions: {
    marginLeft: "auto",
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  kicker: {
    color: "#4E8EA2",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  title: {
    margin: "2px 0 4px",
    color: "#0F172A",
    fontSize: 26,
    fontWeight: 850,
  },
  subtitle: {
    margin: 0,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 1.6,
  },
  primaryButton: {
    border: 0,
    borderRadius: 12,
    color: "#fff",
    background: "linear-gradient(135deg,#0A4174,#4E8EA2)",
    padding: "11px 16px",
    fontSize: 14,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(10,65,116,0.18)",
  },
  secondaryButton: {
    border: "1px solid #D8E5EE",
    borderRadius: 12,
    color: "#0A4174",
    background: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 14,
    padding: 18,
  },
  statValue: {
    color: "#0A4174",
    fontSize: 28,
    fontWeight: 900,
  },
  statLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: 700,
    marginTop: 2,
  },
  listPanel: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 18,
    padding: 18,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    margin: 0,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: 850,
  },
  sectionSub: {
    margin: "4px 0 0",
    color: "#64748B",
    fontSize: 13,
  },
  loadingBox: {
    minHeight: 240,
    display: "grid",
    placeItems: "center",
    color: "#4E8EA2",
  },
  emptyState: {
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    gap: 10,
    minHeight: 260,
    color: "#94A3B8",
  },
  emptyTitle: {
    margin: 0,
    color: "#0F172A",
    fontSize: 18,
  },
  emptyText: {
    margin: 0,
    color: "#64748B",
    fontSize: 14,
  },
  ticketList: {
    display: "grid",
    gap: 10,
  },
  ticketCard: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
    background: "#F8FBFD",
    border: "1px solid #E2E8F0",
    borderRadius: 14,
    padding: 14,
    cursor: "pointer",
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    flexShrink: 0,
  },
  ticketTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  ticketTitle: {
    margin: 0,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: 850,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#DC2626",
    flexShrink: 0,
  },
  ticketMeta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    color: "#64748B",
    fontSize: 12,
    fontWeight: 650,
    marginTop: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    background: "#CBD5E1",
  },
  backButton: {
    justifySelf: "start",
    border: 0,
    background: "transparent",
    color: "#0A4174",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 800,
    cursor: "pointer",
  },
  threadPanel: {
    height: "min(760px, calc(100vh - 210px))",
    minHeight: 560,
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 18,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
  },
  threadHeader: {
    padding: 18,
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  threadTitle: {
    margin: "2px 0 4px",
    color: "#0F172A",
    fontSize: 20,
    fontWeight: 850,
  },
  metaLine: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#64748B",
    fontSize: 13,
    fontWeight: 650,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 18,
    display: "grid",
    alignContent: "start",
    gap: 12,
    background: "#F8FBFD",
  },
  messageRow: {
    display: "flex",
  },
  messageBubble: {
    maxWidth: "76%",
    borderRadius: 16,
    padding: "11px 13px",
  },
  myBubble: {
    color: "#fff",
    background: "linear-gradient(135deg,#0A4174,#2E7DA1)",
  },
  supportBubble: {
    color: "#334155",
    background: "#fff",
    border: "1px solid #E2E8F0",
  },
  sender: {
    fontSize: 11,
    fontWeight: 850,
    marginBottom: 4,
  },
  messageText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  attachment: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    fontSize: 12,
    fontWeight: 800,
    textDecoration: "underline",
  },
  time: {
    fontSize: 11,
    marginTop: 6,
  },
  composer: {
    borderTop: "1px solid #E2E8F0",
    padding: 12,
    background: "#fff",
  },
  reopenNote: {
    marginBottom: 10,
    border: "1px solid #FEDB8B",
    background: "#FFF7E6",
    color: "#A15C00",
    borderRadius: 12,
    padding: "9px 11px",
    fontSize: 13,
    fontWeight: 750,
  },
  composerRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
  },
  iconButton: {
    border: "1px solid #D8E5EE",
    background: "#fff",
    color: "#0A4174",
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  replyInput: {
    flex: 1,
    border: "1px solid #D8E5EE",
    borderRadius: 12,
    padding: "11px 12px",
    minHeight: 44,
    resize: "none",
    fontSize: 14,
    outline: "none",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "rgba(0,29,57,0.46)",
    backdropFilter: "blur(5px)",
  },
  modal: {
    width: "min(560px, 100%)",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 28px 70px rgba(15,23,42,0.22)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: 20,
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: {
    margin: "2px 0 0",
    color: "#0F172A",
    fontSize: 20,
    fontWeight: 850,
  },
  form: {
    padding: 20,
    display: "grid",
    gap: 14,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
  },
  label: {
    color: "#475569",
    fontSize: 12,
    fontWeight: 850,
  },
  input: {
    width: "100%",
    border: "1px solid #D8E5EE",
    borderRadius: 12,
    padding: "11px 12px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    color: "#0F172A",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
};
