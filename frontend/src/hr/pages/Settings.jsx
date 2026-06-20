import { useState } from "react";
import {
  Settings as SettingsIcon,
  Building,
  Bell,
  Bot,
  Database,
  Upload,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";

const sections = [
  { id: "company", label: "Company Information", icon: Building },
  { id: "brand", label: "Brand Settings", icon: SettingsIcon },
  { id: "notifications", label: "Notification Preferences", icon: Bell },
  { id: "ai", label: "AI Settings", icon: Bot },
  { id: "data", label: "Data Management", icon: Database },
];

export default function Settings() {
  const [active, setActive] = useState("company");
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your platform preferences and configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${active === s.id ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              style={
                active === s.id
                  ? { background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }
                  : {}
              }
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {active === "company" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-800">
                  Company Information
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Company Name", value: "TalentFlow HR Solutions" },
                  { label: "Industry", value: "Human Resources & Recruitment" },
                  { label: "Website", value: "www.talentflow.ai" },
                  { label: "Primary Contact", value: "hr@talentflow.ai" },
                  { label: "Phone", value: "+966 11 000 0000" },
                  { label: "Headquarters", value: "Riyadh, Saudi Arabia" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {f.label}
                    </label>
                    <input
                      defaultValue={f.value}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {active === "brand" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-800">Brand Settings</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Platform Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src="/logo.png"
                      alt="TalentFlow"
                      className="w-16 h-16 rounded-2xl object-contain border border-slate-200 p-2"
                    />
                    <button className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all">
                      <Upload size={16} /> Upload New Logo
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Brand Colors
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Dark Navy", color: "#001D39" },
                      { label: "Deep Blue", color: "#0A4174" },
                      { label: "Steel Blue", color: "#49769F" },
                      { label: "Teal Blue", color: "#4E8EA2" },
                    ].map((c) => (
                      <div key={c.color} className="text-center">
                        <div
                          className="w-full h-10 rounded-xl mb-1"
                          style={{ background: c.color }}
                        />
                        <p className="text-xs text-slate-500">{c.label}</p>
                        <p className="text-xs font-mono text-slate-400">
                          {c.color}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Platform Name
                  </label>
                  <input
                    defaultValue="TalentFlow"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tagline
                  </label>
                  <input
                    defaultValue="AI-Powered Hiring & Talent Pool Management"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {active === "notifications" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-800">
                  Notification Preferences
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "New Candidate Added",
                    desc: "When a new candidate joins the pipeline",
                  },
                  {
                    label: "Interview Scheduled",
                    desc: "When an interview is scheduled or rescheduled",
                  },
                  {
                    label: "Offer Sent",
                    desc: "When an offer or contract is sent to a candidate",
                  },
                  {
                    label: "Candidate Hired",
                    desc: "When a candidate is marked as hired",
                  },
                  {
                    label: "Pipeline Stage Changed",
                    desc: "When a candidate moves to a different stage",
                  },
                  {
                    label: "Daily Digest Email",
                    desc: "Receive a daily summary of hiring activity",
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {n.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-500 transition-all after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {active === "ai" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-800">AI Settings</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    defaultValue="sk-••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Your API key is encrypted and stored securely.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    AI Model
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                    <option>GPT-4o (Recommended)</option>
                    <option>GPT-4 Turbo</option>
                    <option>GPT-3.5 Turbo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    AI Features
                  </label>
                  {[
                    "Resume Analysis",
                    "Job Description Generation",
                    "Candidate Fit Scoring",
                    "Interview Summary",
                    "Offer Draft Generation",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-sm text-slate-700">{f}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-500 transition-all after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {active === "data" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-800">
                  Data Management
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Candidates", value: "20" },
                    { label: "Resumes Stored", value: "5" },
                    { label: "Projects", value: "3" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="p-4 bg-slate-50 rounded-xl text-center"
                    >
                      <p className="text-2xl font-bold text-slate-800">
                        {s.value}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                {[
                  {
                    label: "Export All Data",
                    desc: "Download complete HR data as CSV",
                    action: "Export CSV",
                    color: "#0A4174",
                  },
                  {
                    label: "Backup Database",
                    desc: "Create a full backup of all records",
                    action: "Create Backup",
                    color: "#4E8EA2",
                  },
                  {
                    label: "Import Candidates",
                    desc: "Bulk import from CSV or Excel",
                    action: "Import Data",
                    color: "#49769F",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 rounded-xl text-white text-sm"
                      style={{ background: item.color }}
                    >
                      {item.action}
                    </button>
                  </div>
                ))}
                <div className="p-4 border border-red-100 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-700">
                    Danger Zone
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">
                    Permanently delete all data. This action cannot be undone.
                  </p>
                  <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700">
                    Delete All Data
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={save}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all"
              style={{
                background: saved
                  ? "#10b981"
                  : "linear-gradient(135deg, #0A4174, #4E8EA2)",
              }}
            >
              {saved ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
