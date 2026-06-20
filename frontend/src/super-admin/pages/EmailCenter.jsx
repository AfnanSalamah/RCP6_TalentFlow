import { useEffect, useMemo, useState } from "react";
import {
  Copy, Eye, Mail, MonitorSmartphone, Save, Send, Smartphone,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import SALayout from "../components/Layout";
import { saApi } from "../api/index";

const AUDIENCE = {
  candidate: { label: "Candidate Emails", color: "#2563EB", light: "#EFF6FF" },
  company: { label: "Company / Organization", color: "#10B981", light: "#ECFDF5" },
  hr: { label: "HR Manager Emails", color: "#4F46E5", light: "#F5F3FF" },
  employee: { label: "Employee Emails", color: "#F97316", light: "#FFF7ED" },
  super_admin: { label: "Super Admin Emails", color: "#EF4444", light: "#FEF2F2" },
};

const SAMPLE_EMAIL = "afnansalamah22@gmail.com";

function audienceMeta(key) {
  return AUDIENCE[key] || AUDIENCE.candidate;
}

function TemplateCard({ template, active, onSelect }) {
  const meta = audienceMeta(template.audience);
  return (
    <button
      onClick={() => onSelect(template)}
      className="text-left bg-white border transition-all hover:-translate-y-0.5"
      style={{
        borderColor: active ? meta.color : "#E2E8F0",
        borderRadius: 16,
        boxShadow: active ? `0 18px 40px ${meta.color}22` : "0 12px 28px rgba(15,23,42,.07)",
        minHeight: 220,
        overflow: "hidden",
      }}
    >
      <div style={{ height: 74, background: `linear-gradient(135deg,${meta.color},#4F46E5)`, padding: 14, color: "#fff", position: "relative" }}>
        <div className="font-black text-sm">TalentFlow</div>
        <div className="text-[10px] opacity-85">AI-Powered Hiring Platform</div>
        <div style={{ position: "absolute", right: 14, top: 13, width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.20)", border: "1px solid rgba(255,255,255,.35)", display: "grid", placeItems: "center", fontWeight: 900 }}>
          {template.illustration?.slice(0, 2).toUpperCase() || "TF"}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-black text-slate-950 leading-snug">{template.title}</h3>
          {template.enabled ? <ToggleRight size={20} color={meta.color} /> : <ToggleLeft size={20} color="#94A3B8" />}
        </div>
        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{template.body || "A branded TalentFlow email template."}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(template.fields || []).slice(0, 3).map(([label]) => (
            <span key={label} className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: meta.color, background: meta.light }}>
              {label}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center justify-center text-xs font-black text-white px-3 py-2 rounded-lg" style={{ background: `linear-gradient(135deg,${meta.color},#4F46E5)` }}>
            {template.cta_label || "Open"}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function EmailCenter() {
  const [templates, setTemplates] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState("");
  const [subject, setSubject] = useState("");
  const [mobile, setMobile] = useState(false);
  const [testEmail, setTestEmail] = useState(SAMPLE_EMAIL);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([saApi.emailTemplates(), saApi.emailVariables()])
      .then(([rows, vars]) => {
        setTemplates(rows);
        setVariables(vars);
        setSelected(rows[0] || null);
      })
      .catch((err) => setNotice(err.message));
  }, []);

  useEffect(() => {
    if (!selected) return;
    saApi.previewEmailTemplate(selected.key, {}, mobile)
      .then((res) => {
        setPreview(res.html);
        setSubject(res.subject);
      })
      .catch((err) => setNotice(err.message));
  }, [selected, mobile]);

  const grouped = useMemo(() => {
    return templates.reduce((acc, item) => {
      acc[item.audience] = acc[item.audience] || [];
      acc[item.audience].push(item);
      return acc;
    }, {});
  }, [templates]);

  function patchSelected(field, value) {
    setSelected((prev) => ({ ...prev, [field]: value }));
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    setNotice("");
    try {
      const row = await saApi.updateEmailTemplate(selected.key, {
        title: selected.title,
        subject: selected.subject,
        cta_label: selected.cta_label,
        tone: selected.tone,
        enabled: selected.enabled,
        body: selected.body,
      });
      setTemplates((prev) => prev.map((item) => item.key === row.key ? row : item));
      setSelected(row);
      setNotice("Template saved.");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function duplicateSelected() {
    if (!selected) return;
    const row = await saApi.duplicateEmailTemplate(selected.key);
    setTemplates((prev) => [row, ...prev]);
    setSelected(row);
    setNotice("Template duplicated.");
  }

  async function sendTest() {
    if (!selected) return;
    const res = await saApi.sendTestEmail(selected.key, testEmail);
    setNotice(res.dev_mode ? "Test email rendered in backend dev mode." : "Test email sent.");
  }

  const meta = audienceMeta(selected?.audience);

  return (
    <SALayout title="Email Template Center">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_520px] gap-6">
        <section className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">TalentFlow Enterprise Emails</h2>
                <p className="text-sm text-slate-500 mt-1">Premium templates for candidates, companies, employees and admins.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-blue-700 bg-blue-50 px-3 py-2 rounded-full">
                <Mail size={15} /> {templates.length} templates
              </div>
            </div>
          </div>

          {Object.keys(AUDIENCE).map((audience) => {
            const items = grouped[audience] || [];
            const groupMeta = audienceMeta(audience);
            if (!items.length) return null;
            return (
              <div key={audience}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: groupMeta.color }} />
                  <h2 className="text-sm font-black uppercase tracking-wide" style={{ color: groupMeta.color }}>{groupMeta.label}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {items.map((template) => (
                    <TemplateCard
                      key={template.key}
                      template={template}
                      active={selected?.key === template.key}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-28 self-start">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between" style={{ borderTop: `4px solid ${meta.color}` }}>
              <div>
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</p>
                <h2 className="text-lg font-black text-slate-950 mt-1">{selected?.title || "Select a template"}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button title="Desktop preview" onClick={() => setMobile(false)} className={`p-2 rounded-lg ${!mobile ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}><MonitorSmartphone size={16} /></button>
                <button title="Mobile preview" onClick={() => setMobile(true)} className={`p-2 rounded-lg ${mobile ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}><Smartphone size={16} /></button>
              </div>
            </div>

            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              <button onClick={saveSelected} disabled={saving || !selected} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-black disabled:opacity-50"><Save size={15} /> Save</button>
              <button onClick={duplicateSelected} disabled={!selected} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-black"><Copy size={15} /> Duplicate</button>
              <button onClick={() => patchSelected("enabled", !selected?.enabled)} disabled={!selected} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-black">
                {selected?.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} {selected?.enabled ? "Enabled" : "Disabled"}
              </button>
              <button onClick={() => saApi.previewEmailTemplate(selected.key).then((res) => { setPreview(res.html); setSubject(res.subject); })} disabled={!selected} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-black"><Eye size={15} /> Preview</button>
            </div>

            {selected && (
              <div className="px-4 pb-4 space-y-3">
                <input value={selected.title || ""} onChange={(e) => patchSelected("title", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" placeholder="Template title" />
                <input value={selected.cta_label || ""} onChange={(e) => patchSelected("cta_label", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" placeholder="CTA label" />
                <textarea value={selected.body || ""} onChange={(e) => patchSelected("body", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm min-h-20" placeholder="Message body" />
                <div className="flex gap-2">
                  <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="test@email.com" />
                  <button onClick={sendTest} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-black" style={{ background: `linear-gradient(135deg,${meta.color},#4F46E5)` }}><Send size={15} /> Test</button>
                </div>
                {notice && <p className="text-xs font-bold text-slate-500">{notice}</p>}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">{subject || "HTML Preview"}</p>
              <p className="text-xs font-bold text-slate-400">{mobile ? "390px" : "100%"}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 overflow-auto">
              <iframe
                title="Email preview"
                srcDoc={preview}
                style={{ width: mobile ? 390 : "100%", height: 640, border: 0, borderRadius: 12, background: "#fff", margin: "0 auto", display: "block" }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-950 mb-3">Dynamic Variables</h3>
            <div className="flex flex-wrap gap-2">
              {variables.slice(0, 16).map((v) => (
                <span key={v.name} className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{`{{${v.name}}}`}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </SALayout>
  );
}
