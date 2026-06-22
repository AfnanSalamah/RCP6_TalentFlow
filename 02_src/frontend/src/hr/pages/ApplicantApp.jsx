import { useState } from "react";
import { COLORS } from "../styles/colors";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Settings,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  Eye,
  Check,
  MapPin,
  Building2,
  Calendar,
  Upload,
  Award,
  CheckCircle,
  Loader,
  Download,
  Edit2,
  Zap,
} from "lucide-react";

const mockJobs = [
  {
    id: 1,
    title: "AI Engineer",
    company: "BaseTech",
    location: "Riyadh, Saudi Arabia",
    type: "Full Time",
    tags: ["Python", "LLM", "NLP"],
    match: 95,
    salary: "SAR 18,000–24,000",
  },
  {
    id: 2,
    title: "Data Analyst",
    company: "PeopleTech",
    location: "Riyadh, Saudi Arabia",
    type: "Full Time",
    tags: ["SQL", "Python", "Analytics"],
    match: 88,
    salary: "SAR 12,000–16,000",
  },
  {
    id: 3,
    title: "Machine Learning Engineer",
    company: "IntelFlow",
    location: "Riyadh, Saudi Arabia",
    type: "Full Time",
    tags: ["Python", "Deep Learning", "APIs"],
    match: 82,
    salary: "SAR 16,000–22,000",
  },
  {
    id: 4,
    title: "Business Analyst",
    company: "VanSoft",
    location: "Jeddah, Saudi Arabia",
    type: "Full Time",
    tags: ["SQL", "Power BI", "Excel"],
    match: 70,
    salary: "SAR 10,000–13,000",
  },
];

const mockApplications = [
  {
    id: 1,
    position: "AI Engineer",
    company: "BaseTech",
    date: "May 10, 2024",
    status: "Interview Scheduled",
  },
  {
    id: 2,
    position: "Data Analyst",
    company: "PeopleTech",
    date: "May 12, 2024",
    status: "HR Review",
  },
  {
    id: 3,
    position: "Machine Learning Engineer",
    company: "IntelFlow",
    date: "May 14, 2024",
    status: "Verification",
  },
  {
    id: 4,
    position: "Business Analyst",
    company: "VanSoft",
    date: "May 16, 2024",
    status: "Submitted",
  },
];

function Avatar({ name, size = 36, color = COLORS.deepBlue }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.36,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Badge({ text, color = COLORS.skyBlue, textColor = COLORS.darkBlue }) {
  return (
    <span
      style={{
        background: color + "33",
        color: textColor,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 20,
        border: `1px solid ${color}55`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    "Interview Scheduled": { bg: "#4E8EA2", tx: "#fff" },
    "HR Review": { bg: "#7BBDE8", tx: COLORS.darkBlue },
    Verification: { bg: "#6EA2B3", tx: "#fff" },
    Submitted: { bg: COLORS.paleBg, tx: COLORS.darkBlue },
    Rejected: { bg: "#ff6b6b22", tx: "#c0392b" },
  };

  const s = map[status] || { bg: COLORS.paleBg, tx: COLORS.darkBlue };

  return (
    <span
      style={{
        background: s.bg,
        color: s.tx,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 20,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color = COLORS.deepBlue }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "18px 20px",
        border: `1px solid ${COLORS.paleBg}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flex: 1,
        minWidth: 140,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>

      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.darkBlue,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: COLORS.medBlue, marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function ProgressTimeline({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "20px 0" }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? 1 : 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: done ? COLORS.teal : active ? COLORS.deepBlue : COLORS.paleBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${
                    done ? COLORS.teal : active ? COLORS.deepBlue : COLORS.lightTeal
                  }`,
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <Check size={14} color="#fff" />
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: active ? "#fff" : COLORS.medBlue,
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: active ? COLORS.deepBlue : COLORS.medBlue,
                  marginTop: 5,
                  textAlign: "center",
                  maxWidth: 60,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {step}
              </div>
            </div>

            {i < steps.length - 1 && (
              <div
                style={{
                  height: 2,
                  background: done ? COLORS.teal : COLORS.paleBg,
                  flex: 1,
                  margin: "0 2px",
                  marginBottom: 20,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Shell({ user, activePage, setActivePage, navItems, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        background: "#f0f6fa",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: collapsed ? 64 : 230,
          background: COLORS.darkBlue,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: collapsed ? "18px 16px" : "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: COLORS.skyBlue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={16} color={COLORS.darkBlue} />
          </div>
          {!collapsed && (
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
              TalentFlow
            </span>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(({ key, label, icon: Icon }) => {
            const active = activePage === key;

            return (
              <button
                key={key}
                onClick={() => setActivePage(key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px 16px" : "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: active ? COLORS.deepBlue : "transparent",
                  color: active ? "#fff" : COLORS.paleBg,
                  marginBottom: 2,
                  textAlign: "left",
                  opacity: active ? 1 : 0.7,
                }}
              >
                <Icon size={18} />
                {!collapsed && <span style={{ fontSize: 13 }}>{label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 16px" : "10px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: COLORS.paleBg,
              opacity: 0.7,
            }}
          >
            <LogOut size={18} />
            {!collapsed && <span style={{ fontSize: 13 }}>Sign Out</span>}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            background: "#fff",
            borderBottom: `1px solid ${COLORS.paleBg}`,
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.medBlue }}
            >
              <Menu size={20} />
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: COLORS.paleBg + "66",
                borderRadius: 8,
                padding: "6px 12px",
              }}
            >
              <Search size={14} color={COLORS.medBlue} />
              <input
                placeholder="Search..."
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 13,
                  color: COLORS.darkBlue,
                  width: 180,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: COLORS.medBlue,
                  position: "relative",
                }}
              >
                <Bell size={20} />
              </button>

              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 36,
                    background: "#fff",
                    borderRadius: 12,
                    border: `1px solid ${COLORS.paleBg}`,
                    boxShadow: "0 8px 32px rgba(0,29,57,0.12)",
                    width: 260,
                    zIndex: 50,
                    padding: 14,
                    fontSize: 12,
                    color: COLORS.darkBlue,
                  }}
                >
                  No new notifications
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={user.name} size={32} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkBlue }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.medBlue }}>Applicant</div>
              </div>
              <ChevronDown size={14} color={COLORS.medBlue} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>{children}</div>
      </div>
    </div>
  );
}

function ApplicantDashboard({ user }) {
  const steps = ["Applied", "Verification", "HR Review", "Interview Scheduled", "Final Decision"];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p style={{ fontSize: 13, color: COLORS.medBlue, margin: "4px 0 0" }}>
          Track your applications and progress
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard icon={Briefcase} label="Applied Jobs" value="12" color={COLORS.deepBlue} />
        <StatCard icon={Loader} label="Active Applications" value="5" color={COLORS.teal} />
        <StatCard icon={Calendar} label="Interviews" value="2" color={COLORS.medBlue} />
        <StatCard icon={Award} label="Accepted" value="1" color={COLORS.skyBlue} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: COLORS.darkBlue, borderRadius: 14, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>
            Upcoming Interview
          </div>
          <div style={{ fontSize: 12, color: COLORS.paleBg, marginBottom: 16 }}>
            AI Engineer Interview — BaseTech
          </div>
          <button
            style={{
              background: COLORS.skyBlue,
              color: COLORS.darkBlue,
              border: "none",
              padding: "9px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Join Interview
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${COLORS.paleBg}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue, marginBottom: 4 }}>
            Application Progress
          </div>
          <div style={{ fontSize: 12, color: COLORS.medBlue, marginBottom: 4 }}>
            AI Engineer — BaseTech
          </div>
          <ProgressTimeline steps={steps} current={3} />
        </div>
      </div>

      <ApplicationsTable />
    </div>
  );
}

function ApplicationsTable() {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${COLORS.paleBg}` }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue, marginBottom: 16 }}>
        My Applications
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.paleBg}` }}>
            {["Position", "Company", "Applied On", "Status", ""].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.medBlue,
                  textTransform: "uppercase",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {mockApplications.map((a) => (
            <tr key={a.id} style={{ borderBottom: `1px solid ${COLORS.paleBg}44` }}>
              <td style={{ padding: "12px 0", fontSize: 13, fontWeight: 600, color: COLORS.darkBlue }}>
                {a.position}
              </td>
              <td style={{ padding: "12px 0", fontSize: 13, color: COLORS.medBlue }}>
                {a.company}
              </td>
              <td style={{ padding: "12px 0", fontSize: 12, color: COLORS.medBlue }}>
                {a.date}
              </td>
              <td style={{ padding: "12px 0" }}>
                <StatusBadge status={a.status} />
              </td>
              <td style={{ padding: "12px 0" }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.skyBlue }}>
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AvailableJobsPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState([]);
  const [filter, setFilter] = useState("All");

  const types = ["All", "Full Time", "Remote"];

  const filtered = mockJobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase());
    const matchType = filter === "All" || j.type === filter;
    return matchSearch && matchType;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
          Available Jobs
        </h1>
        <p style={{ fontSize: 13, color: COLORS.medBlue, margin: "4px 0 0" }}>
          Find the right opportunity for you
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 200,
            background: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            border: `1px solid ${COLORS.paleBg}`,
          }}
        >
          <Search size={16} color={COLORS.medBlue} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, skills, or company..."
            style={{
              border: "none",
              outline: "none",
              fontSize: 13,
              flex: 1,
              color: COLORS.darkBlue,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: `1.5px solid ${filter === t ? COLORS.deepBlue : COLORS.paleBg}`,
                background: filter === t ? COLORS.deepBlue : "#fff",
                color: filter === t ? "#fff" : COLORS.medBlue,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.map((job) => {
          const isApplied = applied.includes(job.id);

          return (
            <div
              key={job.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 20,
                border: `1px solid ${COLORS.paleBg}`,
                boxShadow: "0 2px 12px rgba(0,29,57,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: COLORS.paleBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building2 size={18} color={COLORS.deepBlue} />
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkBlue }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.medBlue }}>{job.company}</div>
                  </div>
                </div>

                <div
                  style={{
                    background: COLORS.teal + "22",
                    color: COLORS.teal,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {job.match}% Match
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <MapPin size={12} color={COLORS.medBlue} />
                <span style={{ fontSize: 12, color: COLORS.medBlue }}>{job.location}</span>
                <Badge text={job.type} color={COLORS.skyBlue} />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {job.tags.map((t) => (
                  <Badge key={t} text={t} color={COLORS.medBlue} />
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.deepBlue }}>
                  {job.salary}
                </span>

                <button
                  onClick={() =>
                    setApplied((a) =>
                      isApplied ? a.filter((x) => x !== job.id) : [...a, job.id]
                    )
                  }
                  style={{
                    background: isApplied ? COLORS.teal : COLORS.deepBlue,
                    color: "#fff",
                    border: "none",
                    padding: "7px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {isApplied ? (
                    <>
                      <Check size={12} /> Applied
                    </>
                  ) : (
                    "Apply Now"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResumeProfilePage({ user }) {
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
          Resume & Profile
        </h1>
        <p style={{ fontSize: 13, color: COLORS.medBlue, margin: "4px 0 0" }}>
          Upload your resume and manage your profile
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${COLORS.paleBg}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue, marginBottom: 16 }}>
            Resume
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              setUploaded(true);
            }}
            onClick={() => setUploaded(true)}
            style={{
              border: `2px dashed ${dragOver ? COLORS.deepBlue : COLORS.paleBg}`,
              borderRadius: 12,
              padding: "36px 24px",
              textAlign: "center",
              background: dragOver ? COLORS.paleBg + "44" : "#fff",
              cursor: "pointer",
            }}
          >
            {uploaded ? (
              <div>
                <CheckCircle size={40} color={COLORS.teal} style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.darkBlue }}>
                  resume_afnan_2024.pdf
                </div>
                <div style={{ fontSize: 12, color: COLORS.medBlue, marginTop: 4 }}>
                  Uploaded successfully · 2.1 MB
                </div>
              </div>
            ) : (
              <div>
                <Upload size={36} color={COLORS.medBlue} style={{ marginBottom: 12, opacity: 0.6 }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.darkBlue }}>
                  Drag & drop your resume here
                </div>
                <div style={{ fontSize: 12, color: COLORS.medBlue, marginTop: 6 }}>
                  or click to choose file
                </div>
              </div>
            )}
          </div>

          {uploaded && (
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  background: COLORS.deepBlue,
                  color: "#fff",
                  border: "none",
                  padding: "9px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Download size={14} /> Download
              </button>

              <button
                style={{
                  flex: 1,
                  background: "none",
                  border: `1.5px solid ${COLORS.paleBg}`,
                  color: COLORS.darkBlue,
                  padding: "9px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Eye size={14} /> Preview
              </button>
            </div>
          )}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${COLORS.paleBg}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue, marginBottom: 16 }}>
            Parsed Information
          </div>

          {uploaded ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.medBlue, fontWeight: 600, marginBottom: 8 }}>
                  Skills
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Python", "SQL", "Machine Learning", "Power BI"].map((s) => (
                    <Badge key={s} text={s} color={COLORS.skyBlue} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.medBlue }}>
              <FileText size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 13 }}>Upload a resume to see AI-extracted information</div>
            </div>
          )}
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            border: `1px solid ${COLORS.paleBg}`,
            gridColumn: "1 / -1",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkBlue }}>
              Personal Profile
            </div>
            <button
              style={{
                background: COLORS.deepBlue,
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Edit2 size={14} /> Edit Profile
            </button>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            <Avatar name={user.name} size={72} />

            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                ["Full Name", user.name],
                ["Email", user.email],
                ["Phone", "+966 55 123 4567"],
                ["Location", "Riyadh, Saudi Arabia"],
                ["Title", "AI/ML Engineer"],
                ["LinkedIn", "linkedin.com/in/profile"],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 11, color: COLORS.medBlue, fontWeight: 600 }}>
                    {lbl}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.darkBlue, fontWeight: 500 }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantApp({ user, onLogout }) {
  const [userPage, setUserPage] = useState("dashboard");

  const userNavItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "jobs", label: "Available Jobs", icon: Briefcase },
    { key: "applications", label: "My Applications", icon: FileText },
    { key: "resume", label: "Resume & Profile", icon: User },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Shell
      user={user}
      activePage={userPage}
      setActivePage={setUserPage}
      navItems={userNavItems}
      onLogout={onLogout}
    >
      {userPage === "dashboard" && <ApplicantDashboard user={user} />}
      {userPage === "jobs" && <AvailableJobsPage />}
      {userPage === "applications" && <ApplicationsTable />}
      {userPage === "resume" && <ResumeProfilePage user={user} />}
      {userPage === "settings" && <div>Settings page coming soon</div>}
    </Shell>
  );
}