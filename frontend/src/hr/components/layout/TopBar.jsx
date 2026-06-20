import {
  Search,
  Bell,
  ChevronDown,
  Calendar,
  UserPlus,
  FileSignature,
  LogOut,
  User,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NOTIF_ICON = {
  interview: { icon: Calendar, color: "#0A4174", bg: "#EFF6FF" },
  candidate: { icon: UserPlus, color: "#4E8EA2", bg: "#ECFEFF" },
  contract: { icon: FileSignature, color: "#7C3AED", bg: "#F5F3FF" },
};

const INITIAL_NOTIFS = [];
export default function TopBar() {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFS);

  function handleSignOut() {
    // clear any stored data, then return to the Dashboard (no login screen)
    localStorage.clear();
    sessionStorage.clear();
    setUserMenuOpen(false);
    navigate("/");
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleNotifClick(n) {
    // mark as read
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
    );
    // auto-close dropdown
    setNotifOpen(false);
    // smart routing by type
    navigate(n.route);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-20 shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search candidates, roles, projects..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Bell size={20} className="text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              {/* click-away overlay */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />

              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.map((n) => {
                  const cfg = NOTIF_ICON[n.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`flex gap-3 p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${n.isRead ? "opacity-60" : ""}`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.bg }}
                      >
                        <Icon size={15} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug ${n.isRead ? "text-slate-500 font-normal" : "text-slate-700 font-medium"}`}
                        >
                          {n.msg}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })}

                {notifications.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-400">
                    No notifications
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User */}
        <div className="relative">
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-xl px-2 py-1 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
              }}
            >
              HR
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-slate-700">HR Admin</div>
              <div className="text-xs text-slate-400">TalentFlow</div>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            />
          </div>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">
                    HR Admin
                  </p>
                  <p className="text-xs text-slate-400">admin@talentflow.ai</p>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/hr/settings");
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={15} className="text-slate-400" /> My Profile
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/hr/settings");
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <SettingsIcon size={15} className="text-slate-400" /> Settings
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

