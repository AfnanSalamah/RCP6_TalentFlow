import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  Users,
  FileText,
  CalendarCheck,
  Star,
  Bot,
  FileSignature,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  CalendarClock,
  LifeBuoy,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/hr/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hr/projects", label: "Hiring Projects", icon: FolderKanban },
  { to: "/hr/roles", label: "Job Roles", icon: Briefcase },
  { to: "/hr/candidates", label: "Candidates", icon: Users },
  { to: "/hr/resume-center", label: "Resume Center", icon: FileText },
  { to: "/hr/interviews", label: "Interview Management", icon: CalendarCheck },
  { to: "/hr/scheduling", label: "Interview Scheduling", icon: CalendarClock },
  { to: "/hr/pipeline", label: "Hiring Pipeline", icon: LayoutDashboard },
  { to: "/hr/talent-pool", label: "Talent Pool", icon: Star },
  { to: "/hr/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/hr/offer-generator", label: "Offer Generator", icon: FileSignature },
  { to: "/hr/contracts", label: "Contracts", icon: FileCheck },
  { to: "/hr/company-messages", label: "Candidate Messages", icon: MessageSquare },
  { to: "/hr/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/hr/users", label: "User Management", icon: Users },
  { to: "/hr/support", label: "Help & Support", icon: LifeBuoy },
  { to: "/hr/settings", label: "Settings", icon: Settings },
];

// Brand tokens
const C = {
  bg: "#BDD8E9",
  bgBorder: "#a8c8de",
  hover: "#7BBDE8",
  active: "#4E8EA2",
  activeBorder: "#49769F",
  textPrimary: "#001D39",
  textSecondary: "#0A4174",
  textActive: "#ffffff",
  collapseBtn: "#49769F",
  collapseBtnHover: "#001D39",
};

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  function handleSignOut() {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  }

  return (
    <aside
      className="flex flex-col relative transition-all duration-300"
      style={{
        width: collapsed ? 68 : 256,
        minHeight: "100vh",
        flexShrink: 0,
        background: C.bg,
        borderRight: `1px solid ${C.bgBorder}`,
        boxShadow: "2px 0 12px rgba(189, 216, 233, 0.5)",
      }}
    >
      {/* Logo — no text */}
      <div
        className="flex items-center justify-center transition-all duration-300"
        style={{
          padding: collapsed ? "14px 10px" : "22px 20px",
          borderBottom: `1px solid ${C.bgBorder}`,
        }}
      >
        <img
          src="/logo.png"
          alt="TalentFlow"
          style={{
            width: collapsed ? 40 : "72%",
            minWidth: collapsed ? 40 : 110,
            maxWidth: collapsed ? 48 : 190,
            height: "auto",
            minHeight: collapsed ? 40 : 75,
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
            transition: "all 0.3s ease",
            filter: "drop-shadow(0 1px 4px rgba(0,29,57,0.12))",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/hr/dashboard"}
            title={collapsed ? label : undefined}
            className="block mx-2 mb-0.5"
            style={{ textDecoration: "none" }}
          >
            {({ isActive }) => (
              <div
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none"
                style={{
                  borderRadius: 10,
                  background: isActive ? C.active : "transparent",
                  borderLeft: isActive
                    ? `3px solid ${C.activeBorder}`
                    : "3px solid transparent",
                  paddingLeft: isActive ? 10 : 12,
                  color: isActive ? C.textActive : C.textPrimary,
                  fontWeight: isActive ? 600 : 450,
                  boxShadow: isActive
                    ? "0 4px 12px rgba(78, 142, 162, 0.25)"
                    : "none",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.background = C.hover;
                    el.style.color = C.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.background = "transparent";
                    el.style.color = C.textPrimary;
                  }
                }}
              >
                <Icon
                  size={18}
                  className="flex-shrink-0"
                  style={{ color: isActive ? C.textActive : C.textSecondary }}
                />

                {!collapsed && (
                  <span className="text-sm truncate">{label}</span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div
        className="px-2 pb-4 pt-2"
        style={{ borderTop: `1px solid ${C.bgBorder}` }}
      >
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] cursor-pointer transition-all"
          style={{ color: "#B91C1C", fontWeight: 500 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 bg-white rounded-full p-1 z-10"
        style={{
          border: `1px solid ${C.bgBorder}`,
          boxShadow: "0 2px 6px rgba(0,29,57,0.12)",
          color: C.collapseBtn,
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = C.collapseBtnHover)}
        onMouseLeave={(e) => (e.currentTarget.style.color = C.collapseBtn)}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
