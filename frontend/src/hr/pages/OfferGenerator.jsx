import { useState } from "react";
import {
  FileSignature,
  Download,
  Copy,
  RefreshCw,
  Edit3,
  Check,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { aiApi, contractsApi } from "../../api/index";

export default function OfferGenerator() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    company: "",
    comp: "",
    start: "",
    type: "email",
  });
  const [content, setContent] = useState("");
  const [generated, setGenerated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Send-via-email state
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { ok: bool, msg: string }

  const sendViaEmail = async () => {
    setSendResult(null);
    // Basic client-side guard before hitting the API.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSendResult({ ok: false, msg: "Enter a valid candidate email first." });
      return;
    }
    if (!content.trim()) {
      setSendResult({ ok: false, msg: "Generate the document before sending." });
      return;
    }
    setSending(true);
    try {
      const res = await contractsApi.sendOffer({
        candidate_name: form.name || "Candidate",
        candidate_email: form.email.trim(),
        role_title: form.role || "",
        content,
      });
      setSendResult({
        ok: true,
        msg: res.dev_mode
          ? "Offer recorded (email in dev mode — check server logs)."
          : `Offer emailed to ${form.email}${res.linked_to_portal ? " and added to their portal." : "."}`,
      });
    } catch (e) {
      setSendResult({ ok: false, msg: e.message || "Could not send the email." });
    } finally {
      setSending(false);
    }
  };

  const generate = async () => {
    setError("");
    setLoading(true);
    try {
      // Server-side generation only — no templates on the client.
      const res = await aiApi.offerGenerator({
        candidate_name: form.name || "Candidate",
        role_title: form.role || "the role",
        salary: form.comp || "a competitive salary",
        start_date: form.start || "a mutually agreed date",
      });
      setContent(res.offer_letter || "");
      setGenerated(true);
      setEditing(false);
    } catch (e) {
      setError(e.message || "Could not generate the document.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}
        >
          <FileSignature size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Offer Generator</h1>
          <p className="text-slate-500 text-sm">
            Generate professional offers, contracts, and agreements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Document Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Document Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "email", label: "Offer Email" },
                  { value: "contract", label: "Contractor Agreement" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${form.type === t.value ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-blue-200"}`}
                    style={
                      form.type === t.value
                        ? {
                            background:
                              "linear-gradient(135deg, #0A4174, #4E8EA2)",
                          }
                        : {}
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {[
              {
                label: "Candidate Name",
                key: "name",
                placeholder: "Full name",
              },
              {
                label: "Candidate Email",
                key: "email",
                placeholder: "candidate@email.com",
                type: "email",
              },
              {
                label: "Role / Position",
                key: "role",
                placeholder: "Job title",
              },
              { label: "Company Name", key: "company", placeholder: "Company" },
              {
                label: "Compensation",
                key: "comp",
                placeholder: "$100,000 or $500/day",
              },
              {
                label: "Start Date",
                key: "start",
                placeholder: "2026-07-01",
                type: "date",
              },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            ))}

            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FileSignature size={16} />}
              {loading ? "Generating…" : "Generate Document"}
            </button>
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-2 space-y-4">
          {generated ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">
                  Generated Document
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      generate();
                    }}
                    title="Regenerate"
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={() => setEditing(!editing)}
                    className={`p-2 rounded-xl border transition-all ${editing ? "border-blue-300 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={copy}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm"
                  >
                    {copied ? (
                      <Check size={16} className="text-emerald-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  {/* Send the generated offer to the candidate by email (and to their portal). */}
                  <button
                    onClick={sendViaEmail}
                    disabled={sending}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
                    }}
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {sending ? "Sending…" : "Send via Email"}
                  </button>
                </div>
              </div>

              {/* Send result banner */}
              {sendResult && (
                <div
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                    sendResult.ok
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {sendResult.ok ? <Check size={15} /> : <Mail size={15} />}
                  {sendResult.msg}
                </div>
              )}

              <Card>
                <CardContent className="py-6">
                  {editing ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-[500px] text-sm font-mono text-slate-700 focus:outline-none resize-none"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                      {content}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-24 text-center">
                <div
                  className="p-5 rounded-3xl inline-flex mb-4"
                  style={{ background: "#BDD8E920" }}
                >
                  <FileSignature size={40} style={{ color: "#4E8EA2" }} />
                </div>
                <p className="text-slate-500 font-medium">
                  Fill in the details and click Generate
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Your professional document will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
