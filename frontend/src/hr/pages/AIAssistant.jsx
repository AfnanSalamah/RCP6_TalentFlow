import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Briefcase,
  FileText,
  Users,
  Star,
  FileSignature,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { aiApi } from "../../api/index";
import { useAuth } from "../context/AuthContext";
import { formatLocalTime } from "../../utils/dateTime";

const capabilities = [
  {
    icon: Briefcase,
    label: "Generate Job Descriptions",
    prompt:
      "Generate a job description for a Senior AI Engineer role requiring Python, TensorFlow, and MLOps skills.",
  },
  {
    icon: FileText,
    label: "Resume Summary",
    prompt:
      "Summarize a resume for a Data Engineer with 7 years of experience in Apache Spark and Kafka.",
  },
  {
    icon: Users,
    label: "Candidate Fit Analysis",
    prompt:
      "Analyze the fit of a candidate with Python, ML, and NLP skills for an AI Instructor role requiring Arabic, Teaching skills.",
  },
  {
    icon: Star,
    label: "Interview Summary",
    prompt:
      "Summarize an interview where the candidate scored well on technical skills and communication and was a Strong Hire.",
  },
  {
    icon: FileSignature,
    label: "Offer Draft",
    prompt:
      "Draft a job offer for Layla Mansouri for the AI Instructor role at $700/day, starting 2026-07-01.",
  },
];

const DEFAULT_MSG = (name) => `Hello ${name || "there"}, I'm TalentFlow AI, your intelligent HR assistant. I can help you with:

• **Job Description Generation** — Create professional, ATS-optimized job descriptions
• **Resume Analysis** — Extract skills, experience, and generate summaries
• **Candidate Fit Analysis** — Match candidate skills to role requirements
• **Interview Summaries** — Compile structured interview feedback
• **Offer Generation** — Draft professional offer letters

How can I assist you today?`;

// Pull a comma/"and"-separated skill list out of free text, best-effort.
function extractSkills(text) {
  const m = text.match(/(?:requiring|skills?|with|in)\s+([A-Za-z0-9 ,/+.#-]+)/i);
  if (!m) return [];
  return m[1].split(/,|\band\b/).map((s) => s.trim()).filter((s) => s && s.length < 30).slice(0, 8);
}

function formatAnalysis(a) {
  const lines = ["## Resume Analysis", ""];
  if (a.summary) lines.push(a.summary, "");
  if (a.resume_score != null) lines.push(`**Resume score:** ${a.resume_score}/100`);
  if (a.ats_score != null) lines.push(`**ATS score:** ${a.ats_score}/100`, "");
  if (a.strengths?.length) { lines.push("### Strengths"); a.strengths.forEach((s) => lines.push(`- ${s}`)); }
  if (a.missing_skills?.length) { lines.push("", "### Missing skills"); a.missing_skills.forEach((s) => lines.push(`- ${s}`)); }
  if (a.improvements?.length) { lines.push("", "### Suggested improvements"); a.improvements.forEach((s) => lines.push(`- ${s}`)); }
  return lines.join("\n");
}

function formatFit(f) {
  const lines = [
    `## Candidate Fit — ${f.candidate_name || "Candidate"}`,
    "",
    `### ${f.verdict} (${f.fit_score}%)`,
    f.recommendation || "",
  ];
  if (f.matching_skills?.length) lines.push("", `**Matching skills:** ${f.matching_skills.join(", ")}`);
  if (f.missing_skills?.length) lines.push(`**Missing skills:** ${f.missing_skills.join(", ")}`);
  return lines.join("\n");
}

// Route a free-text request to the right backend AI endpoint.
async function callBackendAI(text, userName = "") {
  const res = await aiApi.chat(text, { portal: "hr", userName }, "hr");
  return res.answer;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const displayName = user?.name || user?.displayName || user?.email?.split("@")[0] || "";
  const [messages, setMessages] = useState([
    { role: "assistant", content: DEFAULT_MSG(displayName), time: formatLocalTime(new Date()) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0].role !== "assistant") return prev;
      return [{ ...prev[0], content: DEFAULT_MSG(displayName) }, ...prev.slice(1)];
    });
  }, [displayName]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text, time: formatLocalTime(new Date()) }]);
    setInput("");
    setLoading(true);
    try {
      const content = await callBackendAI(text, displayName);
      setMessages((prev) => [...prev, { role: "assistant", content, time: formatLocalTime(new Date()) }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `⚠️ ${e.message || "The AI service is unavailable right now. Please try again."}`,
        time: formatLocalTime(new Date()),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #0A4174, #4E8EA2)" }}
        >
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Assistant</h1>
          <p className="text-slate-500 text-sm">
            Powered by advanced AI for HR workflows
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {capabilities.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => sendMessage(prompt)}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-center hover:border-blue-200 hover:bg-blue-50 transition-all group"
          >
            <Icon
              size={20}
              className="mx-auto mb-2 text-blue-500 group-hover:text-blue-700"
            />
            <p className="text-xs text-slate-600 group-hover:text-blue-700 leading-tight">
              {label}
            </p>
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card className="overflow-hidden">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "text-white" : "bg-slate-200"}`}
                style={
                  msg.role === "assistant"
                    ? {
                        background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
                      }
                    : {}
                }
              >
                {msg.role === "assistant" ? (
                  <Bot size={16} />
                ) : (
                  <User size={16} className="text-slate-600" />
                )}
              </div>
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${msg.role === "assistant" ? "bg-white shadow-sm border border-slate-100" : "text-white"}`}
                style={
                  msg.role === "user"
                    ? {
                        background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
                      }
                    : {}
                }
              >
                <div
                  className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "text-white" : "text-slate-700"}`}
                >
                  {msg.content.split("\n").map((line, j) => {
                    if (line.startsWith("## "))
                      return (
                        <h3 key={j} className="font-bold text-base mb-2">
                          {line.slice(3)}
                        </h3>
                      );
                    if (line.startsWith("### "))
                      return (
                        <h4 key={j} className="font-semibold mb-1 mt-2">
                          {line.slice(4)}
                        </h4>
                      );
                    if (line.startsWith("- "))
                      return (
                        <p key={j} className="ml-3">
                          • {line.slice(2)}
                        </p>
                      );
                    if (line.startsWith("**") && line.endsWith("**"))
                      return (
                        <p key={j} className="font-semibold">
                          {line.slice(2, -2)}
                        </p>
                      );
                    return <p key={j}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
                }}
              >
                <Bot size={16} />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask anything about candidates, roles, or hiring..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl text-white transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #0A4174, #4E8EA2)",
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
