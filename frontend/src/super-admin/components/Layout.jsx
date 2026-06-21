import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSAAuth } from '../context/AuthContext';
import { saApi } from '../api/index';
import {
  LayoutDashboard, Building2, CreditCard, Users, Ticket,
  Megaphone, BarChart3, ScrollText, LogOut, ChevronDown,
  Bell, Menu, X, Shield, UserCircle, Settings, LifeBuoy,
  MailCheck,
} from 'lucide-react';
import '../styles/superadmin.css';

// ── Navigation model (Dashboard + 3 category dropdowns, like the HR portal) ──
const NAV = [
  { type: 'link', path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    type: 'group', id: 'platform', label: 'Platform', icon: Building2, accent: '#0A4174', light: '#EFF6FF',
    items: [
      { to: '/super-admin/companies',     label: 'Companies',     icon: Building2,   desc: 'Manage all companies' },
      { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: CreditCard,  desc: 'Plans & billing' },
      { to: '/super-admin/users',         label: 'Users',         icon: Users,       desc: 'Company user accounts' },
      { to: '/super-admin/profile',       label: 'Profile',       icon: UserCircle,  desc: 'Account & password' },
      { to: '/super-admin/settings',      label: 'Settings',      icon: Settings,    desc: 'Security, platform & AI' },
      { to: '/super-admin/notifications', label: 'Notifications', icon: Bell,        desc: 'Send platform notices' },
      { to: '/super-admin/email-center',  label: 'Email Center',  icon: MailCheck,   desc: 'Templates & testing' },
    ],
  },
  {
    type: 'group', id: 'engagement', label: 'Engagement', icon: Megaphone, accent: '#7C3AED', light: '#F5F3FF',
    items: [
      { to: '/super-admin/tickets',       label: 'Support',        icon: Ticket,    desc: 'Company tickets' },
      { to: '/super-admin/support',       label: 'Support Center', icon: LifeBuoy,  desc: 'Candidate & employee help' },
      { to: '/super-admin/announcements', label: 'Announcements', icon: Megaphone, desc: 'Broadcast messages' },
    ],
  },
  {
    type: 'group', id: 'insights', label: 'Insights', icon: BarChart3, accent: '#059669', light: '#ECFDF5',
    items: [
      { to: '/super-admin/ai-usage',   label: 'AI Usage',   icon: BarChart3,  desc: 'AI analytics' },
      { to: '/super-admin/audit-logs', label: 'Audit Logs', icon: ScrollText, desc: 'Activity history' },
    ],
  },
];

// Flat list for the mobile drawer
const FLAT_NAV = [
  { to: '/super-admin/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/super-admin/companies',     label: 'Companies',     icon: Building2 },
  { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/super-admin/users',         label: 'Users',         icon: Users },
  { to: '/super-admin/profile',       label: 'Profile',       icon: UserCircle },
  { to: '/super-admin/settings',      label: 'Settings',      icon: Settings },
  { to: '/super-admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/super-admin/email-center',  label: 'Email Center',  icon: MailCheck },
  { to: '/super-admin/tickets',       label: 'Support',        icon: Ticket },
  { to: '/super-admin/support',       label: 'Support Center', icon: LifeBuoy },
  { to: '/super-admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/super-admin/ai-usage',      label: 'AI Usage',      icon: BarChart3 },
  { to: '/super-admin/audit-logs',    label: 'Audit Logs',    icon: ScrollText },
];

// ── Category dropdown ────────────────────────────────────────────────────────
function CategoryDropdown({ cat, location, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const CatIcon = cat.icon;
  const isActive = cat.items.some((i) => location.pathname.startsWith(i.to));

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-sm font-bold px-3 py-2.5 rounded-full transition-all duration-150 select-none
          ${isActive ? 'bg-[#EAF6FC] text-[#0A4174]' : 'text-[#49769F] hover:text-[#001D39] hover:bg-[#EAF6FC]'}`}
      >
        <CatIcon size={16} strokeWidth={2} style={{ color: cat.accent }} />
        {cat.label}
        <ChevronDown size={14} style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 z-50 overflow-hidden" style={{ minWidth: 240 }}>
          <div className="h-[3px] w-full" style={{ background: cat.accent }} />
          <div className="px-4 pt-3 pb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full" style={{ color: cat.accent, background: cat.light }}>
              {cat.label}
            </span>
          </div>
          <div className="px-2 pb-2 flex flex-col gap-0.5">
            {cat.items.map(({ to, label, icon: Icon, desc }) => {
              const active = location.pathname.startsWith(to);
              return (
                <button
                  key={to}
                  onClick={() => { setOpen(false); navigate(to); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-100 text-left"
                  style={active ? { background: cat.light } : {}}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: active ? cat.light : '#f1f5f9' }}>
                    <Icon size={15} strokeWidth={1.75} style={{ color: active ? cat.accent : '#94a3b8' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: active ? cat.accent : '#1e293b' }}>{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{desc}</p>
                  </div>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.accent }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
export default function SALayout({ children, title }) {
  const { user, logout } = useSAAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userName = user?.name || 'Super Admin';
  const avatar = userName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const isDash = location.pathname.startsWith('/super-admin/dashboard');
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    let alive = true;
    saApi.listNotifications()
      .then((rows) => {
        if (alive) setNotifications(Array.isArray(rows) ? rows : []);
      })
      .catch(() => alive && setNotifications([]));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function openNotification(n) {
    setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item));
    saApi.markNotificationRead(n.id).catch(() => {});
    setNotifOpen(false);
    navigate(n.link?.startsWith('/super-admin/') ? n.link : '/super-admin/notifications');
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ══════════════ TOP BAR ══════════════ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="h-[80px] px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4">

          {/* Logo + portal tag */}
          <button onClick={() => navigate('/super-admin/dashboard')} className="flex items-center gap-3 flex-shrink-0" aria-label="TalentFlow Super Admin home">
            <img src="/logo.png" alt="TalentFlow" className="h-10 w-auto object-contain" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
              style={{ color: '#5B21B6', background: '#EDE9FE' }}>
              <Shield size={11} /> Super Admin
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-5 flex-1 justify-center">
            <button
              onClick={() => navigate('/super-admin/dashboard')}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-full transition-all duration-150
                ${isDash ? 'bg-[#001D39] text-white shadow-lg' : 'text-[#49769F] hover:text-[#001D39] hover:bg-[#EAF6FC]'}`}
            >
              <LayoutDashboard size={16} strokeWidth={2.2} />
              Dashboard
            </button>
            <div className="w-px h-7 bg-slate-200 mx-1" />
            {NAV.filter((n) => n.type === 'group').map((cat) => (
              <CategoryDropdown key={cat.id} cat={cat} location={location} navigate={navigate} />
            ))}
          </nav>

          <div className="flex-1 lg:hidden" />

          {/* Right controls */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative hidden sm:block" ref={notifRef}>
              <button onClick={() => setNotifOpen((o) => !o)} className="w-11 h-11 rounded-full flex items-center justify-center bg-white hover:bg-[#EAF6FC] transition-colors relative">
                <Bell size={20} className="text-[#49769F]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">Notifications</span>
                    {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold">{unreadCount}</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.slice(0, 6).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => openNotification(n)}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors ${n.is_read ? 'bg-white' : 'bg-[#F5FBFF]'}`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#EAF6FC] text-[#0A4174] flex items-center justify-center flex-shrink-0">
                          <Bell size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs leading-snug ${n.is_read ? 'text-slate-500' : 'text-slate-800 font-bold'}`}>{n.title}</span>
                          <span className="block text-[11px] text-slate-400 mt-1 truncate">{n.message}</span>
                        </span>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      </button>
                    ))}
                    {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>}
                  </div>
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/super-admin/notifications'); }}
                    className="w-full px-4 py-3 text-sm font-bold text-[#0A4174] hover:bg-[#EAF6FC] border-t border-slate-100"
                  >
                    View notification center
                  </button>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="px-2.5 sm:px-3 xl:px-4 py-2 rounded-full flex items-center gap-2.5 text-[#001D39] font-bold border border-[#BDD8E9] bg-[#F5FBFF] hover:bg-[#EAF6FC] transition-colors shadow-sm max-w-[230px]"
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0A4174,#49769F)' }}>
                  {avatar}
                </span>
                <span className="hidden md:flex flex-col items-start leading-tight min-w-0">
                  <strong className="text-sm max-w-[116px] xl:max-w-[140px] truncate">{userName}</strong>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
                    style={{ background: '#EDE9FE', color: '#5B21B6', borderColor: '#C4B5FD' }}>
                    Super Admin
                  </span>
                </span>
                <ChevronDown size={16} className="hidden md:block text-[#49769F] flex-shrink-0" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-[60px] w-64 bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 z-50 overflow-hidden">
                    <div className="px-4 py-3.5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#0A4174,#49769F)' }}>
                          {avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{userName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/super-admin/profile'); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <UserCircle size={14} className="text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">Profile</p>
                    </button>
                    <div className="mx-4 my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // logout() clears all auth state and redirects to "/" (Back-button safe).
                        logout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-red-50 transition-colors mb-1 text-left"
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
              className="lg:hidden w-11 h-11 rounded-full flex items-center justify-center bg-[#EAF6FC] hover:bg-[#DFF1FA] transition-colors"
            >
              {mobileOpen ? <X size={22} className="text-[#0A4174]" /> : <Menu size={22} className="text-[#0A4174]" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 sm:px-8 py-3">
            <div className="flex flex-col gap-1">
              {FLAT_NAV.map(({ to, label, icon: Icon }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <button
                    key={to}
                    onClick={() => { setMobileOpen(false); navigate(to); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left"
                    style={active ? { background: '#001D39', color: '#fff' } : { color: '#475569' }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ══════════════ CONTENT ══════════════ */}
      <main className="px-4 sm:px-8 lg:px-12 py-6">
        <div className="sa-main">
          {title && (
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#001D39] mb-5" style={{ letterSpacing: '-0.01em' }}>
              {title}
            </h1>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
