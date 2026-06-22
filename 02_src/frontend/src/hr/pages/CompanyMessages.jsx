import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock, Loader2, Mail, MessageSquare, RefreshCw, Send } from "lucide-react";
import { applicationsApi } from "../../api/index";

const statusColor = {
  Open: { bg: "#EAF6FC", color: "#0A4174", border: "#BDD8E9" },
  "In Progress": { bg: "#FFF7E6", color: "#B45309", border: "#FEDB8B" },
  Resolved: { bg: "#ECFDF3", color: "#047857", border: "#B7E4C7" },
  Closed: { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
};

export default function CompanyMessages() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const bottomRef = useRef(null);

  const stats = useMemo(() => ({
    total: threads.length,
    unread: threads.filter((t) => t.unreadForAdmin).length,
    active: threads.filter((t) => ["Open", "In Progress"].includes(t.status)).length,
  }), [threads]);

  async function loadList() {
    setLoading(true);
    try {
      const data = await applicationsApi.hrCompanyMessages();
      setThreads(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function openThread(id) {
    setOpenId(id);
    setThread(null);
    setNotice("");
    const data = await applicationsApi.hrCompanyMessage(id);
    setThread(data);
    loadList();
  }

  async function sendReply() {
    if (!reply.trim() || !openId) return;
    setBusy(true);
    setNotice("");
    try {
      const updated = await applicationsApi.hrReplyCompanyMessage(openId, reply.trim());
      setThread(updated);
      setReply("");
      setNotice("Reply sent to the candidate.");
      loadList();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { loadList(); }, []);
  useEffect(() => {
    const timer = setInterval(() => { openId ? openThread(openId) : loadList(); }, 12000);
    return () => clearInterval(timer);
  }, [openId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.messages?.length]);

  if (openId) {
    return (
      <div className="space-y-5">
        <button onClick={() => { setOpenId(null); setThread(null); loadList(); }} className="flex items-center gap-2 text-sm font-semibold text-[#0A4174]">
          <ArrowLeft size={17} /> Back to candidate messages
        </button>
        {!thread ? (
          <div className="grid place-items-center min-h-[420px] text-[#4E8EA2]"><Loader2 className="animate-spin" size={28} /></div>
        ) : (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[min(760px,calc(100vh-210px))] min-h-[560px] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase text-[#4E8EA2]">Candidate Conversation #{thread.id}</p>
                <h1 className="text-xl font-black text-slate-900 mt-1">{thread.subject}</h1>
                <p className="text-sm text-slate-500 mt-1">{thread.requesterName} · {thread.requesterEmail}</p>
              </div>
              <StatusBadge status={thread.status} />
            </div>
            {notice && <div className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-bold">{notice}</div>}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/70 space-y-3">
              {thread.messages?.map((m) => {
                const hr = m.senderType === "hr";
                return (
                  <div key={m.id} className={`flex ${hr ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[76%] rounded-2xl px-4 py-3 ${hr ? "text-white" : "bg-white border border-slate-200 text-slate-700"}`} style={hr ? { background: "linear-gradient(135deg,#0A4174,#4E8EA2)" } : undefined}>
                      <p className={`text-xs font-extrabold mb-1 ${hr ? "text-blue-100" : "text-[#0A4174]"}`}>{hr ? m.senderName || "Hiring Team" : m.senderName || "Candidate"}</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                      <p className={`text-[11px] mt-2 ${hr ? "text-blue-100" : "text-slate-400"}`}>{m.createdAt}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3 items-end">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={1}
                placeholder="Reply to the candidate..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#BDD8E9] resize-none"
              />
              <button onClick={sendReply} disabled={busy || !reply.trim()} className="w-11 h-11 rounded-xl text-white grid place-items-center disabled:opacity-50" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
                {busy ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-white shadow-sm" style={{ background: "linear-gradient(135deg,#0A4174,#4E8EA2)" }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-[#4E8EA2]">Hiring Inbox</p>
            <h1 className="text-2xl font-black text-slate-900">Candidate Messages</h1>
            <p className="text-sm text-slate-500 mt-1">Messages sent by candidates to your company hiring team.</p>
          </div>
        </div>
        <button onClick={loadList} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#0A4174]">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total Conversations" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Unread" value={stats.unread} />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {loading ? (
          <div className="grid place-items-center min-h-[280px] text-[#4E8EA2]"><Loader2 className="animate-spin" size={28} /></div>
        ) : threads.length === 0 ? (
          <div className="grid place-items-center text-center min-h-[280px] text-slate-400">
            <div>
              <MessageSquare size={42} className="mx-auto mb-3 opacity-60" />
              <p className="font-bold text-slate-500">No candidate messages yet</p>
              <p className="text-sm mt-1">New candidate conversations will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {threads.map((t) => (
              <button key={t.id} onClick={() => openThread(t.id)} className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-md transition-all p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {t.unreadForAdmin && <span className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                    <h3 className="font-black text-slate-900 truncate">{t.subject}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <Mail size={13} /> {t.requesterName} · {t.requesterEmail}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                    <Clock size={12} /> {t.lastMessageAt} · {t.messageCount} messages
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="text-3xl font-black text-[#0A4174]">{value}</div>
      <div className="text-sm font-bold text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = statusColor[status] || statusColor.Open;
  return (
    <span className="px-3 py-1.5 rounded-full text-xs font-black border whitespace-nowrap" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      {status}
    </span>
  );
}
