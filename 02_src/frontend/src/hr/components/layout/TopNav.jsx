import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Bell, Settings, Menu, X, LogOut, User, Check, ChevronDown,
  Calendar, UserPlus, FileSignature, Lock, Shield, Info,
} from "lucide-react";
import { getNavigationForRole, ROLE_LABELS, ROLE_COLORS } from "../../rbac/rbacConfig";
import { notificationsApi } from "../../../api/index";
import { formatLocalDateTime } from "../../../utils/dateTime";

const NOTIF_ICON = {
  interview: { icon: Calendar,      color: "#0A4174", bg: "#EFF6FF" },
  candidate: { icon: UserPlus,      color: "#4E8EA2", bg: "#ECFEFF" },
  contract:  { icon: FileSignature, color: "#7C3AED", bg: "#F5F3FF" },
  offer:     { icon: FileSignature, color: "#7C3AED", bg: "#F5F3FF" },
  info:      { icon: Info,          color: "#49769F", bg: "#EAF6FC" },
};

function normalizeNotificationRoute(link) {
  if (!link) return "/hr/notifications";
  if (link.startsWith("/hr/")) return link;
  if (link.startsWith("/super-admin/")) return "/hr/notifications";
  if (link.startsWith("/")) return `/hr${link}`;
  return "/hr/notifications";
}

// â”€â”€ CategoryDropdown (used by admin + hr_manager) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CategoryDropdown({ cat, location, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const CategoryIcon = cat.icon;

  const isActive = cat.items.some((i) => location.pathname.startsWith(i.to));

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 text-base font-bold px-3 py-3 rounded-full
          transition-all duration-150 select-none
          ${isActive ? "bg-[#EAF6FC] text-[#0A4174]" : "text-[#49769F] hover:text-[#001D39] hover:bg-[#EAF6FC]"}
        `}
      >
        <CategoryIcon size={16} strokeWidth={2} style={{ color: cat.accent }} />
        {cat.label}
        <ChevronDown
          size={15}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] bg-white rounded-2xl shadow-xl ring-1 ring-slate-100/80 z-50 overflow-hidden"
          style={{ minWidth: 230 }}
        >
          <div className="h-[3px] w-full rounded-t-2xl" style={{ background: cat.accent }} />

          <div className="px-4 pt-3 pb-1.5">
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
              style={{ color: cat.accent, background: cat.light }}
            >
              {cat.label}
            </span>
          </div>

          <div className="px-2 pb-2 flex flex-col gap-0.5">
            {cat.items.map(({ to, label, icon: Icon, desc }) => {
              const active = location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => { setOpen(false); onNavigate && onNavigate(); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-100"
                  style={active ? { background: cat.light } : {}}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ""; }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? cat.light : "#f1f5f9" }}
                  >
                    <Icon size={15} strokeWidth={1.75} style={{ color: active ? cat.accent : "#94a3b8" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: active ? cat.accent : "#1e293b" }}>
                      {label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.accent }} />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ RoleBadge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RoleBadge({ hrRole }) {
  const label = ROLE_LABELS[hrRole] ?? hrRole;
  const colors = ROLE_COLORS[hrRole] ?? ROLE_COLORS.interviewer;
  return (
    <span
      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {label}
    </span>
  );
}

// â”€â”€ Main TopNav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function TopNav({ user, onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const hrRole   = user?.hrRole ?? "admin";
  const nav      = getNavigationForRole(hrRole);
  const userName = user?.name ?? "HR Admin";
  const avatar   = user?.avatar ?? userName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const roleLabel = ROLE_LABELS[hrRole] ?? "Admin";

  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [mobileOpenCat, setMobileOpenCat] = useState(null);
  const [, setPermissionVersion] = useState(0);

  const notifRef   = useRef(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = () => setPermissionVersion((v) => v + 1);
    window.addEventListener("tf:role-permissions-updated", handler);
    return () => window.removeEventListener("tf:role-permissions-updated", handler);
  }, []);

  useEffect(() => {
    let alive = true;
    setNotifLoading(true);
    notificationsApi.hrList()
      .then((rows) => {
        if (!alive) return;
        setNotifications((Array.isArray(rows) ? rows : []).map((n) => ({
          id: n.id,
          type: n.type || "info",
          text: n.message || n.title || "",
          time: n.created_at ? formatLocalDateTime(n.created_at) : "",
          isRead: Boolean(n.is_read ?? n.read),
          route: normalizeNotificationRoute(n.link),
        })));
      })
      .catch(() => alive && setNotifications([]))
      .finally(() => alive && setNotifLoading(false));
    return () => { alive = false; };
  }, []);

  function markAsRead(id) {
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n));
    notificationsApi.hrMarkRead(id).catch(() => {});
  }
  function markAllRead() {
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
    notificationsApi.hrMarkAllRead().catch(() => {});
  }
  function handleNotifClick(n) { markAsRead(n.id); setNotifOpen(false); navigate(n.route || "/hr/notifications"); }
  function handleSignOut() {
    localStorage.clear(); sessionStorage.clear(); setUserMenuOpen(false);
    if (onLogout) onLogout(); else navigate("/");
  }

  const isDash = location.pathname === "/hr/dashboard";

  // â”€â”€ Desktop nav content depends on role type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function DesktopNav() {
    if (nav.type === "flat") {
      // Interviewer: flat pill links, no category dropdowns
      return (
        <nav className="hidden lg:flex items-center gap-2 xl:gap-3 flex-1 justify-center">
          {nav.items.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to) && (to !== "/hr/dashboard" || isDash);
            return (
              <NavLink
                key={to}
                to={to}
                className={`
                  flex items-center gap-2 text-base font-bold px-4 py-3 rounded-full
                  transition-all duration-150
                  ${active ? "bg-[#001D39] text-white shadow-lg" : "text-[#49769F] hover:text-[#001D39] hover:bg-[#EAF6FC]"}
                `}
              >
                <Icon size={17} strokeWidth={2.2} />
                {label}
              </NavLink>
            );
          })}
        </nav>
      );
    }

    // Admin / HR Manager: Dashboard pill + category dropdowns
    return (
      <nav className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center">
        <NavLink
          to="/hr/dashboard"
          className={`
            flex items-center gap-2 text-base font-bold px-4 py-3 rounded-full
            transition-all duration-150
            ${isDash ? "bg-[#001D39] text-white shadow-lg" : "text-[#49769F] hover:text-[#001D39] hover:bg-[#EAF6FC]"}
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Dashboard
        </NavLink>

        <div className="w-px h-7 bg-slate-200 mx-1" />

        {nav.categories.map((cat) => (
          <CategoryDropdown key={cat.id} cat={cat} location={location} />
        ))}
      </nav>
    );
  }

  // â”€â”€ Mobile nav content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function MobileNav() {
    if (nav.type === "flat") {
      return (
        <div className="flex flex-col gap-1">
          {nav.items.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to) && (to !== "/hr/dashboard" || isDash);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={active ? { background: "#001D39", color: "white" } : { color: "#475569" }}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            );
          })}
        </div>
      );
    }

    return (
      <>
        <NavLink
          to="/hr/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold mb-2 transition-colors ${isDash ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Dashboard
        </NavLink>

        {nav.categories.map((cat) => {
          const catActive = cat.items.some((i) => location.pathname.startsWith(i.to));
          const catOpen   = mobileOpenCat === cat.id;
          const CatIcon   = cat.icon;
          return (
            <div key={cat.id} className="mb-1">
              <button
                onClick={() => setMobileOpenCat(catOpen ? null : cat.id)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={catActive ? { background: cat.light, color: cat.accent } : { color: "#475569" }}
                onMouseEnter={(e) => { if (!catActive) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (!catActive) e.currentTarget.style.background = ""; }}
              >
                <span className="flex items-center gap-2">
                  <CatIcon size={15} strokeWidth={2} style={{ color: cat.accent }} />
                  {cat.label}
                </span>
                <ChevronDown
                  size={14}
                  style={{ transition: "transform .2s", transform: catOpen ? "rotate(180deg)" : "rotate(0deg)", color: cat.accent }}
                />
              </button>

              {catOpen && (
                <div className="pl-3 mt-0.5 flex flex-col gap-0.5">
                  {cat.items.map(({ to, label, icon: Icon }) => {
                    const active = location.pathname.startsWith(to);
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => { setMobileOpen(false); setMobileOpenCat(null); }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors"
                        style={active ? { background: cat.light, color: cat.accent, fontWeight: 600 } : { color: "#64748b" }}
                      >
                        <Icon size={14} strokeWidth={1.75} style={{ color: active ? cat.accent : "#94a3b8" }} />
                        {label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TOP BAR */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="h-[88px] px-6 sm:px-10 lg:px-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <button onClick={() => navigate("/hr/dashboard")} className="flex-shrink-0" aria-label="TalentFlow HR home">
            <img src="/logo.png" alt="TalentFlow" className="h-11 w-auto object-contain" />
          </button>

          <DesktopNav />

          <div className="flex-1 lg:hidden" />

          {/* â”€â”€ Right controls â”€â”€ */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-white hover:bg-[#EAF6FC] transition-colors relative"
              >
                <Bell size={22} className="text-[#49769F]" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[22px] h-[22px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-[#0A4174] hover:underline">
                        <Check size={11} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {notifLoading && (
                      <p className="px-4 py-8 text-center text-sm text-slate-400">Loading notifications...</p>
                    )}
                    {!notifLoading && notifications.map((n) => {
                      const cfg  = NOTIF_ICON[n.type] || NOTIF_ICON.interview;
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`flex gap-3 w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${n.isRead ? "opacity-60" : "bg-blue-50/30"}`}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                            <Icon size={14} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug ${n.isRead ? "text-slate-500" : "text-slate-800 font-medium"}`}>{n.text}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{n.time}</p>
                          </div>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                        </button>
                      );
                    })}
                    {!notifLoading && notifications.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setNotifOpen(false); navigate("/hr/notifications"); }}
                    className="w-full px-4 py-3 text-sm font-bold text-[#0A4174] hover:bg-[#EAF6FC] border-t border-slate-100"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* Profile + role badge */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="h-14 px-3 xl:px-4 rounded-full flex items-center gap-2.5 xl:gap-3 text-[#001D39] font-bold border border-[#BDD8E9] bg-[#F5FBFF] hover:bg-[#EAF6FC] transition-colors shadow-sm max-w-[230px]"
              >
                {/* Avatar */}
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#0A4174,#49769F)" }}
                >
                  {avatar}
                </span>
                {/* Name + role */}
                <span className="hidden lg:flex flex-col items-start leading-tight min-w-0">
                  <strong className="text-sm max-w-[116px] xl:max-w-[140px] truncate">{userName}</strong>
                  <RoleBadge hrRole={hrRole} />
                </span>
                <ChevronDown size={16} className="hidden lg:block text-[#49769F] flex-shrink-0" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-[60px] w-64 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 z-50 overflow-hidden">
                    {/* Identity header */}
                    <div className="px-4 py-3.5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#0A4174,#49769F)" }}
                        >
                          {avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{userName}</p>
                          <div className="mt-1">
                            <RoleBadge hrRole={hrRole} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile menu items */}
                    {[
                      { label: "My Profile",       desc: "View & edit your profile",   icon: User,     to: "/hr/profile",             tab: null        },
                      { label: "Account Settings",  desc: "Account info & role",        icon: Shield,   to: "/hr/profile?tab=account",  tab: "account"   },
                      { label: "Security",          desc: "Password & sessions",        icon: Lock,     to: "/hr/profile?tab=security", tab: "security"  },
                      { label: "Notifications",     desc: "View all alerts",            icon: Bell,     to: "/hr/notifications", tab: "notifications" },
                    ].map(({ label, desc, icon: Icon, to }) => (
                      <button
                        key={label}
                        onClick={() => { setUserMenuOpen(false); navigate(to); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Icon size={14} className="text-slate-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-700 leading-tight">{label}</p>
                          <p className="text-[11px] text-slate-400">{desc}</p>
                        </div>
                      </button>
                    ))}

                    {/* System settings â€” admin only */}
                    {hrRole === "admin" && (
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate("/hr/settings"); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Settings size={14} className="text-slate-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-700 leading-tight">System Settings</p>
                          <p className="text-[11px] text-slate-400">Platform configuration</p>
                        </div>
                      </button>
                    )}

                    <div className="mx-4 my-1 border-t border-slate-100" />

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-red-50 transition-colors mb-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <LogOut size={14} className="text-red-500" />
                      </div>
                      <p className="text-sm font-semibold text-red-600">Sign Out</p>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden w-12 h-12 rounded-full flex items-center justify-center bg-[#EAF6FC] hover:bg-[#DFF1FA] transition-colors"
            >
              {mobileOpen ? <X size={24} className="text-[#0A4174]" /> : <Menu size={24} className="text-[#0A4174]" />}
            </button>
          </div>
        </div>
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MOBILE DRAWER */}
      {mobileOpen && (
        <div className="lg:hidden sticky top-[88px] z-30 px-4 sm:px-8">
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-slate-100 p-4 mt-1">
            <MobileNav />
          </div>
        </div>
      )}
    </>
  );
}


