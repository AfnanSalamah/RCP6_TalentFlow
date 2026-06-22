import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, Check, FileSignature, Info, Trash2, UserPlus } from "lucide-react";
import { notificationsApi } from "../../api/index";

const ICONS = {
  interview: { icon: Calendar, color: "#0A4174", bg: "#EFF6FF" },
  candidate: { icon: UserPlus, color: "#4E8EA2", bg: "#ECFEFF" },
  contract: { icon: FileSignature, color: "#7C3AED", bg: "#F5F3FF" },
  offer: { icon: FileSignature, color: "#7C3AED", bg: "#F5F3FF" },
  info: { icon: Info, color: "#49769F", bg: "#EAF6FC" },
};

const FILTERS = ["All", "Unread", "Company", "System"];

function normalizeLink(link) {
  if (!link) return "/hr/notifications";
  if (link.startsWith("/hr/")) return link;
  if (link.startsWith("/super-admin/")) return "/hr/notifications";
  if (link.startsWith("/")) return `/hr${link}`;
  return "/hr/notifications";
}

export default function HRNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    notificationsApi.hrList()
      .then((rows) => {
        if (!alive) return;
        setItems((Array.isArray(rows) ? rows : []).map((n) => ({
          ...n,
          is_read: Boolean(n.is_read ?? n.read),
          link: normalizeLink(n.link),
        })));
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;
  const filtered = useMemo(() => items.filter((n) => {
    if (filter === "Unread") return !n.is_read;
    if (filter === "Company") return n.company_id;
    if (filter === "System") return !n.company_id;
    return true;
  }), [items, filter]);

  function markRead(id) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    notificationsApi.hrMarkRead(id).catch(() => {});
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    notificationsApi.hrMarkAllRead().catch(() => {});
  }

  function openNotification(n) {
    markRead(n.id);
    navigate(n.link || "/hr/notifications");
  }

  function deleteNotification(id) {
    if (!window.confirm("Delete this notification?")) return;
    setItems((prev) => prev.filter((n) => n.id !== id));
    notificationsApi.hrDelete(id).catch(() => {});
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#EAF6FC] text-[#0A4174] flex items-center justify-center">
              <Bell size={22} />
            </span>
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-2">{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A4174] text-white text-sm font-bold shadow-sm hover:bg-[#001D39]">
            <Check size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${filter === f ? "bg-[#EAF6FC] text-[#0A4174] border-[#BDD8E9]" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && <p className="px-6 py-12 text-center text-sm text-slate-400">Loading notifications...</p>}
        {!loading && filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Bell size={24} />
            </div>
            <p className="font-bold text-slate-700">No notifications</p>
            <p className="text-sm text-slate-400 mt-1">New updates will appear here.</p>
          </div>
        )}
        {!loading && filtered.map((n) => {
          const cfg = ICONS[n.type] || ICONS.info;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              onClick={() => openNotification(n)}
              className={`w-full text-left flex gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${n.is_read ? "bg-white" : "bg-[#F5FBFF]"}`}
            >
              <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${n.is_read ? "font-semibold text-slate-700" : "font-extrabold text-slate-900"}`}>{n.title || "Notification"}</span>
                <span className="block text-sm text-slate-500 mt-1 leading-6">{n.message}</span>
                <span className="block text-xs text-slate-400 mt-2">{n.created_at}</span>
              </span>
              {!n.is_read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />}
              <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete notification"><Trash2 size={16} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
