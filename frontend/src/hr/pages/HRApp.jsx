import { useState } from "react";
import { COLORS } from "../styles/colors";

import {
  LayoutDashboard,
  Users,
  GitBranch,
  Settings,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Briefcase,
  UserCheck,
  Calendar,
  AlertCircle,
  Zap,
} from "lucide-react";
const pipelineData = {
  New: [
    { id: 1, name: "Alwezdi A.", role: "AI Engineer", company: "BaseTech", day: "2 days" },
    { id: 2, name: "Sara Kholi", role: "Data Analyst", company: "PeopleTech", day: "1 day" },
  ],
  Screening: [
    { id: 3, name: "Fatimah Alkadu", role: "ML Engineer", company: "IntelFlow", day: "5 days" },
    { id: 4, name: "Nasser M.", role: "HR Specialist", company: "PeopleTech", day: "3 days" },
  ],
  Interview: [
    { id: 5, name: "Khalid Alkadu", role: "Cloud Engineer", company: "CloudNine", day: "7 days" },
    { id: 6, name: "Nour Ahmad", role: "Business Analyst", company: "VanSoft", day: "4 days" },
  ],
  Offer: [
    { id: 7, name: "Basem Said", role: "AI Engineer", company: "BaseTech", day: "10 days" },
    { id: 8, name: "Yousef Tariq", role: "Data Analyst", company: "PeopleTech", day: "8 days" },
  ],
  Hired: [
    { id: 9, name: "Abdullah N.", role: "ML Engineer", company: "IntelFlow", day: "15 days" },
    { id: 10, name: "Lujain Fouad", role: "DevOps", company: "CloudNine", day: "12 days" },
  ],
};

const mockUsers = [
  { id: 1, name: "Afnan Alaref", email: "afnan@talentflow.com", role: "Admin", status: "Active" },
  { id: 2, name: "Sarah Ahmad", email: "sarah@talentflow.com", role: "HR Manager", status: "Active" },
  { id: 3, name: "Ali Hassan", email: "ali@talentflow.com", role: "Recruiter", status: "Active" },
  { id: 4, name: "Mona Khalid", email: "mona@talentflow.com", role: "Hiring Manager", status: "Inactive" },
  { id: 5, name: "Omar Baabdi", email: "omar@talentflow.com", role: "Viewer", status: "Active" },
];

// ─────────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────────
function Avatar({ name, size = 36, color = COLORS.deepBlue }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
    }}>{initials}</div>
  );
}

function Badge({ text, color = COLORS.skyBlue, textColor = COLORS.darkBlue }) {
  return (
    <span style={{
      background: color + "33", color: textColor, fontSize: 11, fontWeight: 600,
      padding: "3px 8px", borderRadius: 20, border: `1px solid ${color}55`,
      whiteSpace: "nowrap"
    }}>{text}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    "Interview Scheduled": { bg: "#4E8EA2", tx: "#fff" },
    "HR Review": { bg: "#7BBDE8", tx: COLORS.darkBlue },
    "Verification": { bg: "#6EA2B3", tx: "#fff" },
    "Submitted": { bg: COLORS.paleBg, tx: COLORS.darkBlue },
    "Rejected": { bg: "#ff6b6b22", tx: "#c0392b" },
    "Active": { bg: "#27ae6022", tx: "#1e8449" },
    "Inactive": { bg: "#ff6b6b22", tx: "#c0392b" },
  };
  const s = map[status] || { bg: COLORS.paleBg, tx: COLORS.darkBlue };
  return (
    <span style={{
      background: s.bg, color: s.tx, fontSize: 11, fontWeight: 600,
      padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap"
    }}>{status}</span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = COLORS.deepBlue }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "18px 20px",
      border: `1px solid ${COLORS.paleBg}`, display: "flex",
      alignItems: "center", gap: 16, flex: 1, minWidth: 140
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.darkBlue, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: COLORS.medBlue, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: COLORS.teal, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Mini Charts (pure CSS/SVG)
// ─────────────────────────────────────────────
function DonutChart({ data, size = 100 }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 30;
  const centerX = 50;
  const centerY = 50;
  const circumference = 2 * Math.PI * radius;

  const slices = data.map((item, index) => {
    const dash = (item.value / total) * circumference;
    const offset = data
      .slice(0, index)
      .reduce((sum, previousItem) => {
        return sum + (previousItem.value / total) * circumference;
      }, 0);

    return {
      dash,
      offset,
      color: item.color,
    };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={COLORS.paleBg}
        strokeWidth="14"
      />

      {slices.map((slice, index) => (
        <circle
          key={index}
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={slice.color}
          strokeWidth="14"
          strokeDasharray={`${slice.dash} ${circumference - slice.dash}`}
          strokeDashoffset={-slice.offset + circumference / 4}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      ))}
    </svg>
  );
}

function BarChartMini({ bars }) {
  const max = Math.max(...bars.map(b => b.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "8px 0" }}>
      {bars.map((b, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div style={{ fontSize: 10, color: COLORS.medBlue, marginBottom: 3 }}>{b.value}</div>
          <div style={{
            width: "100%", background: COLORS.skyBlue,
            height: (b.value / max) * 55 + 8, borderRadius: "4px 4px 0 0",
            minHeight: 8
          }} />
          <div style={{ fontSize: 9, color: COLORS.medBlue, marginTop: 3, whiteSpace: "nowrap" }}>{b.label}</div>
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────
//  Shared Shell / Sidebar
// ─────────────────────────────────────────────
function Shell({ user, activePage, setActivePage, navItems, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f0f6fa", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? 64 : 230, background: COLORS.darkBlue, flexShrink: 0,
        display: "flex", flexDirection: "column", transition: "width 0.2s ease", overflow: "hidden"
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "18px 16px" : "18px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.skyBlue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={16} color={COLORS.darkBlue} />
          </div>
          {!collapsed && <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>TalentFlow</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
          {navItems.map(({ key, label, icon: Icon }) => {
            const active = activePage === key;
            return (
              <button key={key} onClick={() => setActivePage(key)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 16px" : "10px 12px",
                borderRadius: 8, border: "none", cursor: "pointer",
                background: active ? COLORS.deepBlue : "transparent",
                color: active ? "#fff" : COLORS.paleBg,
                marginBottom: 2, transition: "all 0.15s", textAlign: "left",
                opacity: active ? 1 : 0.7, whiteSpace: "nowrap", overflow: "hidden"
              }}>
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onLogout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "10px 16px" : "10px 12px", borderRadius: 8,
            border: "none", cursor: "pointer", background: "transparent",
            color: COLORS.paleBg, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden"
          }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13 }}>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{
          background: "#fff", borderBottom: `1px solid ${COLORS.paleBg}`,
          padding: "0 24px", height: 60, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.medBlue, padding: 4 }}>
              <Menu size={20} />
            </button>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: COLORS.paleBg + "66", borderRadius: 8, padding: "6px 12px"
            }}>
              <Search size={14} color={COLORS.medBlue} />
              <input placeholder="Search..." style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: 13, color: COLORS.darkBlue, width: 180
              }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: COLORS.medBlue, position: "relative", padding: 4
              }}>
                <Bell size={20} />
                <span style={{
                  position: "absolute", top: 0, right: 0, width: 8, height: 8,
                  background: "#e74c3c", borderRadius: "50%", border: "1.5px solid #fff"
                }} />
              </button>
              {notifOpen && (
                <div style={{
                  position: "absolute", right: 0, top: 36, background: "#fff",
                  borderRadius: 12, border: `1px solid ${COLORS.paleBg}`,
                  boxShadow: "0 8px 32px rgba(0,29,57,0.12)", width: 280, zIndex: 50
                }}>
                  <div style={{ padding: "14px 16px", fontWeight: 700, fontSize: 13, color: COLORS.darkBlue, borderBottom: `1px solid ${COLORS.paleBg}` }}>Notifications</div>
                  {["New application from Ahmed Ali", "Interview scheduled for tomorrow", "3 new candidates matched"].map((n, i) => (
                    <div key={i} style={{ padding: "12px 16px", fontSize: 12, color: COLORS.darkBlue, borderBottom: `1px solid ${COLORS.paleBg}44`, display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.skyBlue, marginTop: 4, flexShrink: 0 }} />
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={user.name} size={32} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkBlue }}>{user.name}</div>
                <div style={{ fontSize: 11, color: COLORS.medBlue }}>{user.role === "hr" ? "HR Admin" : "Applicant"}</div>
              </div>
              <ChevronDown size={14} color={COLORS.medBlue} />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
//  HR PAGES
// ─────────────────────────────────────────────
function HRDashboardPage() {
  const donutData = [
    { label: "Job Boards", value: 142, color: COLORS.deepBlue },
    { label: "LinkedIn", value: 79, color: COLORS.skyBlue },
    { label: "Referral", value: 54, color: COLORS.teal },
    { label: "Direct", value: 17, color: COLORS.paleBg },
  ];
  const total = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>HR Dashboard</h1>
        <p style={{ fontSize: 13, color: COLORS.medBlue, margin: "4px 0 0" }}>Overview of your hiring process</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard icon={Briefcase} label="Total Jobs" value="18" sub="+3 this week" color={COLORS.deepBlue} />
        <StatCard icon={Users} label="Candidates" value="247" sub="All pipelines" color={COLORS.teal} />
        <StatCard icon={Calendar} label="Interviews" value="32" sub="This month" color={COLORS.medBlue} />
        <StatCard icon={UserCheck} label="Hired" value="7" sub="This quarter" color={COLORS.skyBlue} />
        <StatCard icon={AlertCircle} label="Offers Pending" value="12" sub="Awaiting response" color={COLORS.lightTeal} />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Candidates by Source */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${COLORS.paleBg}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue, marginBottom: 16 }}>Candidates by Source</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <DonutChart data={donutData} size={120} />
            <div style={{ flex: 1 }}>
              {donutData.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ fontSize: 12, color: COLORS.medBlue }}>{d.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.darkBlue }}>{d.value}</span>
                    <span style={{ fontSize: 11, color: COLORS.medBlue }}>{Math.round(d.value / total * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Hiring Demand */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${COLORS.paleBg}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue, marginBottom: 4 }}>Top Hiring Demand</div>
          <BarChartMini bars={[
            { label: "AI Eng", value: 42 }, { label: "Data", value: 35 },
            { label: "ML Eng", value: 29 }, { label: "DevOps", value: 18 }, { label: "HR Tech", value: 12 },
          ]} />
        </div>
      </div>

      {/* Recent Applications */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${COLORS.paleBg}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue }}>Recent Applications</div>
          <button style={{ background: "none", border: "none", color: COLORS.skyBlue, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>View All →</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.paleBg}` }}>
              {["Candidate", "Position", "Applied", "Status", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 0", fontSize: 11, fontWeight: 700, color: COLORS.medBlue, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Ahmed Ali", pos: "AI Engineer", date: "May 10", status: "Interview Scheduled" },
              { name: "Sara Kholi", pos: "Data Analyst", date: "May 12", status: "HR Review" },
              { name: "Khalid Noor", pos: "ML Engineer", date: "May 14", status: "Verification" },
              { name: "Nour Ahmad", pos: "Business Analyst", date: "May 15", status: "Submitted" },
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.paleBg}44` }}>
                <td style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={r.name} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkBlue }}>{r.name}</span>
                </td>
                <td style={{ fontSize: 13, color: COLORS.darkBlue, padding: "12px 0" }}>{r.pos}</td>
                <td style={{ fontSize: 12, color: COLORS.medBlue, padding: "12px 0" }}>{r.date}</td>
                <td style={{ padding: "12px 0" }}><StatusBadge status={r.status} /></td>
                <td style={{ padding: "12px 0" }}>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.skyBlue }}><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HiringPipelinePage() {
  const [pipeline, setPipeline] = useState(pipelineData);

  const moveCard = (card, fromCol, toCol) => {
    if (fromCol === toCol) return;
    setPipeline(p => {
      const next = { ...p };
      next[fromCol] = next[fromCol].filter(c => c.id !== card.id);
      next[toCol] = [card, ...next[toCol]];
      return next;
    });
  };

  const cols = ["New", "Screening", "Interview", "Offer", "Hired"];
  const colColors = {
    New: COLORS.paleBg, Screening: COLORS.skyBlue + "22",
    Interview: COLORS.lightTeal + "33", Offer: COLORS.teal + "22", Hired: COLORS.deepBlue + "22"
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>Hiring Pipeline</h1>
        <p style={{ fontSize: 13, color: COLORS.medBlue, margin: "4px 0 0" }}>Drag candidates across stages or use arrows</p>
      </div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12 }}>
        {cols.map(col => (
          <div key={col} style={{ minWidth: 190, flex: 1 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 12
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkBlue, textTransform: "uppercase", letterSpacing: 0.5 }}>{col}</span>
              <span style={{
                background: COLORS.deepBlue, color: "#fff", fontSize: 11, fontWeight: 700,
                width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
              }}>{pipeline[col].length}</span>
            </div>
            <div style={{ background: colColors[col], borderRadius: 12, minHeight: 200, padding: 8, border: `1px dashed ${COLORS.paleBg}` }}>
              {pipeline[col].map(card => (
                <div key={card.id} style={{
                  background: "#fff", borderRadius: 10, padding: "12px 14px",
                  marginBottom: 8, border: `1px solid ${COLORS.paleBg}`,
                  boxShadow: "0 1px 6px rgba(0,29,57,0.06)", cursor: "pointer"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Avatar name={card.name} size={28} color={COLORS.medBlue} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkBlue }}>{card.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.medBlue }}>{card.role}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.lightTeal, marginTop: 8 }}>{card.company}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: COLORS.medBlue }}>{card.day} ago</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {cols.indexOf(col) > 0 && (
                        <button onClick={() => moveCard(card, col, cols[cols.indexOf(col) - 1])} style={{
                          width: 22, height: 22, borderRadius: 6, border: `1px solid ${COLORS.paleBg}`,
                          background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                        }}>←</button>
                      )}
                      {cols.indexOf(col) < cols.length - 1 && (
                        <button onClick={() => moveCard(card, col, cols[cols.indexOf(col) + 1])} style={{
                          width: 22, height: 22, borderRadius: 6, border: "none",
                          background: COLORS.deepBlue, color: "#fff", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                        }}>→</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button style={{
                width: "100%", background: "none", border: `1.5px dashed ${COLORS.lightTeal}`,
                borderRadius: 8, padding: "8px", color: COLORS.medBlue, cursor: "pointer",
                fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4
              }}>
                <Plus size={12} /> Add Candidate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Viewer" });

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    setUsers(u => [...u, { id: u.length + 1, ...newUser, status: "Active" }]);
    setNewUser({ name: "", email: "", role: "Viewer" });
    setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>User Management</h1>
          <p style={{ fontSize: 13, color: COLORS.medBlue, margin: "4px 0 0" }}>Manage system users and their roles</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} style={{
          background: COLORS.deepBlue, color: "#fff", border: "none",
          padding: "10px 18px", borderRadius: 10, cursor: "pointer",
          fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6
        }}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: `1px solid ${COLORS.paleBg}`, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.darkBlue, marginBottom: 14 }}>New User</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
              placeholder="Full Name" style={{ flex: 1, minWidth: 140, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.paleBg}`, outline: "none", fontSize: 13 }} />
            <input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
              placeholder="Email" style={{ flex: 1, minWidth: 180, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.paleBg}`, outline: "none", fontSize: 13 }} />
            <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
              style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.paleBg}`, outline: "none", fontSize: 13, background: "#fff" }}>
              {["Admin", "HR Manager", "Recruiter", "Hiring Manager", "Viewer"].map(r => <option key={r}>{r}</option>)}
            </select>
            <button onClick={addUser} style={{
              background: COLORS.teal, color: "#fff", border: "none", padding: "9px 18px",
              borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13
            }}>Save</button>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${COLORS.paleBg}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.paleBg + "44" }}>
              {["Name", "Email", "Role", "Status", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: COLORS.medBlue, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${COLORS.paleBg}44` }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={u.name} size={30} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkBlue }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: COLORS.medBlue, padding: "14px 16px" }}>{u.email}</td>
                <td style={{ padding: "14px 16px" }}><Badge text={u.role} color={COLORS.medBlue} /></td>
                <td style={{ padding: "14px 16px" }}><StatusBadge status={u.status} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.skyBlue }}><Edit2 size={15} /></button>
                    <button onClick={() => setUsers(us => us.filter(x => x.id !== u.id))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c" }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default function HRApp({ user, onLogout }) {
  const [hrPage, setHrPage] = useState("dashboard");

  const hrNavItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "pipeline", label: "Hiring Pipeline", icon: GitBranch },
    { key: "users", label: "User Management", icon: Users },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Shell
      user={user}
      activePage={hrPage}
      setActivePage={setHrPage}
      navItems={hrNavItems}
      onLogout={onLogout}
    >
      {hrPage === "dashboard" && <HRDashboardPage />}
      {hrPage === "pipeline" && <HiringPipelinePage />}
      {hrPage === "users" && <UserManagementPage />}
    </Shell>
  );
}
