import { useState } from "react";
import {
  FileText,
  Edit,
  Download,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  Send,
  Clock,
  XCircle,
  User,
  Briefcase,
  Building2,
  Tag,
  Calendar,
  DollarSign,
  Loader2,
  Shield,
  AlertCircle,
  FileCheck,
} from "lucide-react";

const DEFAULT_CONTRACT = {
  id: "",
  candidate: "",
  initials: "",
  role: "",
  dept: "",
  type: "",
  salary: "",
  startDate: "",
  status: "Draft",
  body: "No contract document selected.",
};

// â”€â”€â”€ STATUS BADGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatusBadge({ status }) {
  const cfg = {
    Signed:  { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle },
    Sent:    { cls: "bg-blue-100 text-blue-700 border-blue-200",          Icon: Send },
    Pending: { cls: "bg-amber-100 text-amber-700 border-amber-200",       Icon: Clock },
    Draft:   { cls: "bg-slate-100 text-slate-600 border-slate-200",       Icon: FileText },
    Expired: { cls: "bg-red-100 text-red-700 border-red-200",             Icon: XCircle },
    Rejected:{ cls: "bg-rose-100 text-rose-600 border-rose-200",          Icon: XCircle },
  };
  const { cls, Icon } = cfg[status] ?? cfg.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={11} /> {status}
    </span>
  );
}

// â”€â”€â”€ FIELD ROW (view mode) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FieldRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{ background: B.lightBg }}
      >
        <Icon size={14} style={{ color: B.deep }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-slate-800">{children}</div>
      </div>
    </div>
  );
}

// â”€â”€â”€ FORM INPUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FormInput({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
      />
    </div>
  );
}

// â”€â”€â”€ FORM SELECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white appearance-none"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// â”€â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ContractDetail({ contract = DEFAULT_CONTRACT, onBack }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // edit form state
  const [form, setForm] = useState({
    candidate: contract.candidate,
    role: contract.role,
    dept: contract.dept,
    type: contract.type,
    salary: contract.salary,
    startDate: contract.startDate,
    status: contract.status,
    body: contract.body,
  });

  // committed (view) state
  const [committed, setCommitted] = useState({ ...contract });

  function patch(key) {
    return (val) => setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setCommitted({ ...committed, ...form });
      setSaving(false);
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2500);
    }, 1400);
  }

  function handleCancel() {
    setForm({
      candidate: committed.candidate,
      role: committed.role,
      dept: committed.dept,
      type: committed.type,
      salary: committed.salary,
      startDate: committed.startDate,
      status: committed.status,
      body: committed.body,
    });
    setIsEditing(false);
  }

  const avatarColors = ["#0A4174", "#49769F", "#4E8EA2", "#001D39"];
  const avatarBg = avatarColors[(committed.candidate.charCodeAt(0) + committed.candidate.charCodeAt(1)) % avatarColors.length];

  return (
    <div className="space-y-5 pb-10">
      {/* â”€â”€ PAGE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="rounded-2xl px-6 py-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${B.navy} 0%, ${B.deep} 55%, ${B.steel} 100%)`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">Contract Details</h1>
                <span className="text-xs font-mono bg-white/15 px-2 py-0.5 rounded-full">
                  {committed.id}
                </span>
                {isEditing && (
                  <span className="text-xs font-semibold bg-amber-400/20 border border-amber-300/40 text-amber-200 px-2 py-0.5 rounded-full">
                    Editing
                  </span>
                )}
              </div>
              <p className="text-blue-200 text-sm mt-0.5">
                {isEditing
                  ? "Make changes below, then save to update the contract."
                  : "Review contract information and document preview."}
              </p>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-blue-800 hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <Edit size={14} /> Edit Contract
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition-colors">
                  <Download size={14} /> Download PDF
                </button>
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to List
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 transition-colors shadow-sm"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {saving ? "Savingâ€¦" : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/15 hover:bg-white/25 border border-white/20 disabled:opacity-50 transition-colors"
                >
                  <X size={14} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ SAVED TOAST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {saved && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium shadow-sm animate-pulse">
          <CheckCircle size={16} />
          Contract updated successfully.
        </div>
      )}

      {/* â”€â”€ MAIN GRID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* â”€â”€ LEFT PANEL: Details / Edit Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Candidate Avatar Card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md"
                style={{ background: avatarBg }}
              >
                {committed.candidate
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {committed.candidate}
                </h2>
                <p className="text-sm text-slate-500 truncate">{committed.role}</p>
                <div className="mt-1.5">
                  <StatusBadge status={committed.status} />
                </div>
              </div>
            </div>
          </div>

          {/* â”€â”€ VIEW MODE: Field List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {!isEditing && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div
                className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2"
                style={{ background: B.lightBg }}
              >
                <FileCheck size={15} style={{ color: B.deep }} />
                <h3 className="font-semibold text-sm" style={{ color: B.navy }}>
                  Contract Information
                </h3>
              </div>
              <div className="px-5 py-1">
                <FieldRow icon={User} label="Candidate Name">
                  {committed.candidate}
                </FieldRow>
                <FieldRow icon={Briefcase} label="Role">
                  {committed.role}
                </FieldRow>
                <FieldRow icon={Building2} label="Department">
                  {committed.dept}
                </FieldRow>
                <FieldRow icon={Tag} label="Contract Type">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {committed.type}
                  </span>
                </FieldRow>
                <FieldRow icon={DollarSign} label="Salary / Compensation">
                  {committed.salary}
                </FieldRow>
                <FieldRow icon={Calendar} label="Start Date">
                  {committed.startDate}
                </FieldRow>
                <FieldRow icon={Shield} label="Status">
                  <StatusBadge status={committed.status} />
                </FieldRow>
              </div>
            </div>
          )}

          {/* â”€â”€ EDIT MODE: Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {isEditing && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div
                className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2"
                style={{ background: B.lightBg }}
              >
                <Edit size={15} style={{ color: B.deep }} />
                <h3 className="font-semibold text-sm" style={{ color: B.navy }}>
                  Edit Contract Fields
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <FormInput
                  label="Candidate Name"
                  value={form.candidate}
                  onChange={patch("candidate")}
                  placeholder="Full name"
                />
                <FormInput
                  label="Role / Job Title"
                  value={form.role}
                  onChange={patch("role")}
                  placeholder="e.g. Senior Engineer"
                />
                <FormSelect
                  label="Department"
                  value={form.dept}
                  onChange={patch("dept")}
                  options={[
                    "Technology",
                    "Education",
                    "Finance",
                    "Human Resources",
                    "Product",
                    "Artificial Intelligence",
                    "Operations",
                  ]}
                />
                <FormSelect
                  label="Contract Type"
                  value={form.type}
                  onChange={patch("type")}
                  options={["Full-Time", "Contract", "Instructor", "Part-Time", "Freelance"]}
                />
                <FormInput
                  label="Salary / Compensation"
                  value={form.salary}
                  onChange={patch("salary")}
                  placeholder="e.g. $120,000/year"
                />
                <FormInput
                  label="Start Date"
                  value={form.startDate}
                  onChange={patch("startDate")}
                  type="date"
                />
                <FormSelect
                  label="Status"
                  value={form.status}
                  onChange={patch("status")}
                  options={["Draft", "Pending", "Sent", "Signed", "Expired", "Rejected"]}
                />
              </div>
            </div>
          )}

          {/* Legal disclaimer (view mode only) */}
          {!isEditing && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border-l-4 border-amber-400 bg-amber-50">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Legal Notice:</strong> This document is a template draft.
                Have it reviewed by a qualified legal professional before signing.
              </p>
            </div>
          )}
        </div>

        {/* â”€â”€ RIGHT PANEL: Document Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Panel header */}
            <div
              className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"
              style={{ background: B.lightBg }}
            >
              <div className="flex items-center gap-2">
                <FileText size={15} style={{ color: B.deep }} />
                <h3 className="font-semibold text-sm" style={{ color: B.navy }}>
                  {isEditing ? "Contract Body Editor" : "Document Preview"}
                </h3>
              </div>
              <StatusBadge status={isEditing ? form.status : committed.status} />
            </div>

            {/* Document area */}
            <div
              className="flex-1 overflow-y-auto p-4 bg-slate-100"
              style={{ minHeight: 400 }}
            >
              {/* Paper shell */}
              <div
                className="bg-white rounded-xl shadow-md border border-slate-200 mx-auto overflow-hidden"
                style={{ maxWidth: 680, fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {/* Document letterhead */}
                <div
                  className="px-8 py-5 text-white text-center"
                  style={{
                    background: `linear-gradient(135deg, ${B.navy} 0%, ${B.deep} 100%)`,
                  }}
                >
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="p-1.5 rounded-lg bg-white/20">
                      <FileText size={18} />
                    </div>
                    <h2 className="text-base font-bold tracking-widest uppercase">
                      Employment Contract
                    </h2>
                  </div>
                  <p className="text-blue-200 text-xs">
                    TalentFlow HR Solutions Â· Strictly Confidential
                  </p>
                </div>

                {/* Meta strip */}
                <div className="flex flex-wrap divide-x divide-slate-100 border-b border-slate-100">
                  {[
                    { label: "Contract ID", value: committed.id },
                    { label: "Type", value: isEditing ? form.type : committed.type },
                    { label: "Department", value: isEditing ? form.dept : committed.dept },
                    { label: "Start Date", value: isEditing ? form.startDate : committed.startDate },
                  ].map((m) => (
                    <div key={m.label} className="flex-1 px-4 py-2.5 text-center min-w-[100px]">
                      <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Body: view or editable textarea */}
                {!isEditing ? (
                  <pre
                    className="px-8 py-6 text-slate-700 leading-relaxed whitespace-pre-wrap"
                    style={{ fontSize: 12.5, fontFamily: "Georgia, serif" }}
                  >
                    {committed.body}
                  </pre>
                ) : (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
                      Contract Body â€” editable
                    </p>
                    <textarea
                      value={form.body}
                      onChange={(e) => patch("body")(e.target.value)}
                      rows={28}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-y transition-all"
                      style={{ fontFamily: "Georgia, serif", fontSize: 12.5 }}
                      spellCheck
                    />
                    <p className="text-xs text-slate-400 mt-1.5 px-1">
                      {form.body.length.toLocaleString()} characters Â·{" "}
                      {form.body.split(/\n/).length} lines
                    </p>
                  </div>
                )}

                {/* Signature footer (view mode) */}
                {!isEditing && (
                  <div
                    className="mx-8 mb-8 mt-2 p-5 rounded-xl border border-slate-100"
                    style={{ background: B.lightBg }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-4"
                      style={{ color: B.deep }}
                    >
                      Signatures
                    </p>
                    <div className="grid grid-cols-2 gap-8">
                      {["Company Representative", committed.candidate].map(
                        (party) => (
                          <div key={party}>
                            <div className="border-b-2 border-slate-400 h-10 mb-2" />
                            <p className="text-xs text-slate-600 font-medium">{party}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Date: ___________
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="p-4 border-t border-slate-100 flex flex-wrap items-center gap-2 bg-white">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ background: B.deep }}
                  >
                    <Edit size={13} /> Edit Contract
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    <Download size={13} /> Download PDF
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    <Send size={13} /> Send to Candidate
                  </button>
                  <button
                    onClick={onBack}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft size={13} /> Back to List
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-all"
                    style={{ background: "#059669" }}
                  >
                    {saving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    {saving ? "Savingâ€¦" : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <p className="ml-auto text-xs text-slate-400 hidden sm:block">
                    Changes are local until you save.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

