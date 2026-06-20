import { useEffect, useMemo, useRef, useState } from "react";
import SALayout from "../components/Layout";
import { saApi } from "../api/index";
import { BASE as API } from "../../api/client";
import { ArrowLeft, Clock, Filter, LifeBuoy, Loader2, Mail, MessageSquare, Paperclip, RefreshCw, Send } from "lucide-react";

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const statusStyle = {
  Open: { bg: "#EAF6FC", color: "#0A4174", border: "#BDD8E9" },
  "In Progress": { bg: "#FFF7E6", color: "#B45309", border: "#FEDB8B" },
  Resolved: { bg: "#ECFDF3", color: "#047857", border: "#B7E4C7" },
  Closed: { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
};
const priorityDot = { Low: "#94A3B8", Medium: "#3478F6", High: "#F59E0B", Urgent: "#DC2626" };

export default function SupportManagement() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const bottomRef = useRef(null);

  const stats = useMemo(() => ({
    open: tickets.filter((t) => t.status === "Open").length,
    active: tickets.filter((t) => t.status === "In Progress").length,
    unread: tickets.filter((t) => t.unreadForAdmin).length,
    resolved: tickets.filter((t) => ["Resolved", "Closed"].includes(t.status)).length,
  }), [tickets]);

  async function loadList() {
    try {
      const data = await saApi.supportTickets(filter);
      setTickets(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(id) {
    const data = await saApi.supportGet(id);
    setThread(data);
  }

  useEffect(() => { setLoading(true); loadList(); }, [filter]);
  useEffect(() => {
    const timer = setInterval(() => { openId ? loadThread(openId) : loadList(); }, 12000);
    return () => clearInterval(timer);
  }, [openId, filter]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.messages?.length]);

  async function openTicket(id) {
    setOpenId(id);
    setThread(null);
    setNotice("");
    await loadThread(id);
    loadList();
  }

  function back() {
    setOpenId(null);
    setThread(null);
    setNotice("");
    loadList();
  }

  async function sendReply() {
    if (!reply.trim() || !openId) return;
    setBusy("reply");
    setNotice("");
    try {
      const updated = await saApi.supportReply(openId, reply.trim());
      setThread(updated);
      setReply("");
      setNotice("Reply sent successfully.");
    } finally {
      setBusy("");
    }
  }

  async function setStatus(status) {
    setBusy(status);
    try {
      await saApi.supportSetStatus(openId, status);
      await loadThread(openId);
      setNotice(`Ticket marked as ${status}.`);
    } finally {
      setBusy("");
    }
  }

  return (
    <SALayout title="Support Management">
      {openId ? (
        <ThreadView
          thread={thread}
          reply={reply}
          setReply={setReply}
          busy={busy}
          notice={notice}
          onBack={back}
          onReply={sendReply}
          onStatus={setStatus}
          bottomRef={bottomRef}
        />
      ) : (
        <div style={styles.page}>
          <div style={styles.hero}>
            <div style={styles.heroIcon}><LifeBuoy size={24} /></div>
            <div>
              <div style={styles.kicker}>Platform Support</div>
              <h1 style={styles.title}>Support Management</h1>
              <p style={styles.subtitle}>Manage candidate and employee tickets sent to the platform support team.</p>
            </div>
            <div style={styles.heroActions}>
              <button type="button" onClick={loadList} style={styles.secondaryButton}><RefreshCw size={16} /> Refresh</button>
              <div style={styles.filterWrap}>
                <Filter size={15} />
                <select value={filter} onChange={(event) => setFilter(event.target.value)} style={styles.filterSelect}>
                  <option value="">All Statuses</option>
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <Stat label="Open" value={stats.open} tone="#0A4174" />
            <Stat label="In Progress" value={stats.active} tone="#B45309" />
            <Stat label="Unread" value={stats.unread} tone="#DC2626" />
            <Stat label="Resolved" value={stats.resolved} tone="#047857" />
          </div>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Tickets</h2>
                <p style={styles.panelSub}>Company hiring messages are routed to the company admin and are not shown here.</p>
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}><Loader2 size={28} className="animate-spin" /></div>
            ) : tickets.length === 0 ? (
              <div style={styles.empty}>
                <MessageSquare size={38} />
                <h3>No support tickets</h3>
                <p>New platform support tickets will appear here.</p>
              </div>
            ) : (
              <div style={styles.ticketGrid}>
                {tickets.map((ticket) => (
                  <button key={ticket.id} type="button" onClick={() => openTicket(ticket.id)} style={styles.ticketCard}>
                    <div style={styles.ticketMain}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {ticket.unreadForAdmin && <span style={styles.unreadDot} />}
                        <h3 style={styles.ticketTitle}>{ticket.subject}</h3>
                      </div>
                      <p style={styles.ticketMeta}>
                        <Mail size={13} /> {ticket.requesterName} ({ticket.requesterType}) · {ticket.requesterEmail}
                      </p>
                      <div style={styles.tags}>
                        <span style={styles.tag}>{ticket.category}</span>
                        <span style={styles.priority}><span style={{ ...styles.priorityDot, background: priorityDot[ticket.priority] || "#94A3B8" }} /> {ticket.priority}</span>
                        <span style={styles.time}><Clock size={12} /> {ticket.lastMessageAt}</span>
                      </div>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </SALayout>
  );
}

function ThreadView({ thread, reply, setReply, busy, notice, onBack, onReply, onStatus, bottomRef }) {
  return (
    <div style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}><ArrowLeft size={17} /> Back to tickets</button>
      {!thread ? (
        <div style={styles.loading}><Loader2 size={28} className="animate-spin" /></div>
      ) : (
        <section style={styles.thread}>
          <div style={styles.threadHeader}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.kicker}>Ticket #{thread.id}</div>
              <h2 style={styles.threadTitle}>{thread.subject}</h2>
              <p style={styles.threadMeta}>{thread.category} · {thread.priority} · {thread.requesterName} · {thread.requesterEmail}</p>
            </div>
            <StatusBadge status={thread.status} />
          </div>
          <div style={styles.statusRow}>
            {STATUSES.map((status) => (
              <button key={status} type="button" onClick={() => onStatus(status)} disabled={!!busy} style={{
                ...styles.statusButton,
                ...(thread.status === status ? styles.statusButtonActive : {}),
              }}>
                {busy === status ? "Updating..." : status}
              </button>
            ))}
          </div>
          {notice && <div style={styles.notice}>{notice}</div>}
          <div style={styles.messages}>
            {thread.messages?.map((message) => {
              const admin = message.senderType === "super_admin";
              return (
                <div key={message.id} style={{ ...styles.messageRow, justifyContent: admin ? "flex-end" : "flex-start" }}>
                  <div style={{ ...styles.bubble, ...(admin ? styles.adminBubble : styles.userBubble) }}>
                    <div style={{ ...styles.sender, color: admin ? "#BFDBFE" : "#0A4174" }}>{message.senderName || (admin ? "Support" : "User")}</div>
                    <p style={styles.messageText}>{message.message}</p>
                    {message.attachments?.map((attachment) => (
                      <a key={attachment.id} href={API + attachment.url} target="_blank" rel="noreferrer" style={{ ...styles.attachment, color: admin ? "#DBEAFE" : "#0A6E86" }}>
                        <Paperclip size={12} /> {attachment.fileName}
                      </a>
                    ))}
                    <div style={{ ...styles.msgTime, color: admin ? "#BFDBFE" : "#94A3B8" }}>{message.createdAt}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={styles.composer}>
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              rows={1}
              placeholder="Reply to the user..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onReply();
                }
              }}
              style={styles.replyInput}
            />
            <button type="button" onClick={onReply} disabled={busy === "reply" || !reply.trim()} style={styles.sendButton}>
              {busy === "reply" ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div style={styles.stat}>
      <div style={{ ...styles.statValue, color: tone }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = statusStyle[status] || statusStyle.Open;
  return <span style={{ ...styles.statusBadge, background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{status}</span>;
}

const styles = {
  page: { display: "grid", gap: 18 },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 22,
    borderRadius: 18,
    background: "linear-gradient(135deg, rgba(10,65,116,0.08), rgba(78,142,162,0.12))",
    border: "1px solid rgba(78,142,162,0.22)",
  },
  heroIcon: { width: 54, height: 54, borderRadius: 16, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0A4174,#4E8EA2)", color: "#fff", flexShrink: 0 },
  heroActions: { marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" },
  kicker: { color: "#4E8EA2", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 },
  title: { margin: "2px 0 4px", color: "#001D39", fontSize: 28, fontWeight: 900 },
  subtitle: { margin: 0, color: "#64748B", fontSize: 14, lineHeight: 1.6 },
  secondaryButton: { border: "1px solid #D8E5EE", borderRadius: 12, background: "#fff", color: "#0A4174", padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800, cursor: "pointer" },
  filterWrap: { display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #D8E5EE", borderRadius: 12, background: "#fff", color: "#0A4174", padding: "0 12px" },
  filterSelect: { height: 42, border: 0, outline: 0, color: "#0F172A", fontWeight: 700, background: "transparent" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 },
  stat: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18 },
  statValue: { fontSize: 28, fontWeight: 900 },
  statLabel: { color: "#64748B", fontSize: 13, fontWeight: 800, marginTop: 2 },
  panel: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: 18 },
  panelHeader: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  panelTitle: { margin: 0, fontSize: 18, color: "#0F172A", fontWeight: 900 },
  panelSub: { margin: "4px 0 0", color: "#64748B", fontSize: 13 },
  loading: { minHeight: 260, display: "grid", placeItems: "center", color: "#4E8EA2" },
  empty: { minHeight: 260, display: "grid", placeItems: "center", textAlign: "center", gap: 8, color: "#94A3B8" },
  ticketGrid: { display: "grid", gap: 10 },
  ticketCard: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textAlign: "left", border: "1px solid #E2E8F0", background: "#F8FBFD", borderRadius: 14, padding: 16, cursor: "pointer" },
  ticketMain: { minWidth: 0, flex: 1, display: "grid", gap: 7 },
  ticketTitle: { margin: 0, color: "#0F172A", fontSize: 15, fontWeight: 900 },
  ticketMeta: { margin: 0, display: "flex", alignItems: "center", gap: 6, color: "#64748B", fontSize: 13 },
  tags: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tag: { background: "#EFF6FF", color: "#0A4174", borderRadius: 999, padding: "4px 9px", fontSize: 12, fontWeight: 800 },
  priority: { display: "inline-flex", alignItems: "center", gap: 6, color: "#334155", fontSize: 12, fontWeight: 800 },
  priorityDot: { width: 8, height: 8, borderRadius: 99 },
  time: { display: "inline-flex", alignItems: "center", gap: 5, color: "#94A3B8", fontSize: 12, fontWeight: 700 },
  unreadDot: { width: 9, height: 9, borderRadius: 99, background: "#DC2626", flexShrink: 0 },
  statusBadge: { border: "1px solid", borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" },
  backButton: { justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 8, border: 0, background: "transparent", color: "#0A4174", fontWeight: 900, cursor: "pointer" },
  thread: { height: "min(760px, calc(100vh - 210px))", minHeight: 560, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 18px 45px rgba(15,23,42,0.08)" },
  threadHeader: { padding: 18, borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 },
  threadTitle: { margin: "2px 0 4px", color: "#0F172A", fontSize: 20, fontWeight: 900 },
  threadMeta: { margin: 0, color: "#64748B", fontSize: 13, fontWeight: 700 },
  statusRow: { display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 18px", borderBottom: "1px solid #E2E8F0", background: "#F8FBFD" },
  statusButton: { border: "1px solid #D8E5EE", background: "#fff", color: "#475569", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" },
  statusButtonActive: { background: "#0A4174", color: "#fff", borderColor: "#0A4174" },
  notice: { margin: "12px 18px 0", border: "1px solid #B7E4C7", background: "#ECFDF3", color: "#047857", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 800 },
  messages: { flex: 1, overflowY: "auto", padding: 18, display: "grid", alignContent: "start", gap: 12, background: "#F8FBFD" },
  messageRow: { display: "flex" },
  bubble: { maxWidth: "76%", borderRadius: 16, padding: "11px 13px" },
  adminBubble: { color: "#fff", background: "linear-gradient(135deg,#0A4174,#2E7DA1)" },
  userBubble: { color: "#334155", background: "#fff", border: "1px solid #E2E8F0" },
  sender: { fontSize: 11, fontWeight: 900, marginBottom: 4 },
  messageText: { margin: 0, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" },
  attachment: { display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 12, fontWeight: 800, textDecoration: "underline" },
  msgTime: { fontSize: 11, marginTop: 6 },
  composer: { borderTop: "1px solid #E2E8F0", padding: 12, display: "flex", gap: 10, background: "#fff" },
  replyInput: { flex: 1, border: "1px solid #D8E5EE", borderRadius: 12, padding: "11px 12px", minHeight: 44, resize: "none", fontSize: 14, outline: "none" },
  sendButton: { border: 0, borderRadius: 12, width: 46, height: 44, display: "grid", placeItems: "center", color: "#fff", background: "linear-gradient(135deg,#0A4174,#4E8EA2)", cursor: "pointer" },
};
