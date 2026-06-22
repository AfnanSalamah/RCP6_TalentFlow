import { useState, useRef, useEffect } from "react";
import ContractViewerModal from "../../components/ContractViewerModal";
import { contractsApi } from "../../api/index";
import {
  FileText,
  FilePlus,
  FileCheck,
  Send,
  RefreshCw,
  Download,
  Save,
  Bot,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Shield,
  Copy,
  TrendingUp,
  Star,
  BookOpen,
  LayoutDashboard,
  PenLine,
  Loader,
  X,
  Check,
} from "lucide-react";

// â”€â”€â”€ BRAND COLORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const B = {
  navy: "#001D39",
  deep: "#0A4174",
  steel: "#49769F",
  sky: "#7BBDE8",
  light: "#BDD8E9",
  lightBg: "#EFF6FF",
};

// â”€â”€â”€ MOCK DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEFAULT_CONTRACT_BODY = `EMPLOYMENT CONTRACT - TALENTFLOW HR SOLUTIONS

1. EMPLOYMENT TERMS
This Employment Agreement is entered into between TalentFlow HR Solutions ("Company") and the above-named Employee/Contractor for the position specified herein.

The Employee shall commence duties on the agreed start date. Work location and hours are as specified in contract details.

2. REPORTING STRUCTURE
The Employee will report directly to their designated line manager as confirmed by HR.

3. ROLES AND RESPONSIBILITIES
- Deliver high-quality outputs aligned with team objectives
- Attend required meetings, reviews, and collaboration sessions
- Adhere to all Company policies, procedures, and security protocols
- Maintain professional standards at all times
- Complete assigned tasks within agreed timelines and quality standards

4. COMPENSATION & BENEFITS
Compensation is as specified in contract details. Payment is processed monthly via standard payroll. All statutory deductions apply under applicable law.

5. CONFIDENTIALITY & NON-DISCLOSURE
The Employee agrees to maintain strict confidentiality of all proprietary information, trade secrets, and client data during and for 2 years after the term of this agreement.

6. INTELLECTUAL PROPERTY
All work product created during the course of employment is the sole and exclusive property of the Company.

7. TERMINATION
Either party may terminate with 30 days written notice. Immediate termination applies in the event of gross misconduct.

8. GOVERNING LAW
This Agreement is governed by the laws of the Kingdom of Saudi Arabia.

------------------------------------------------------------

SIGNATURES

Company Representative: _____________________   Date: ___________

Employee: ___________________________________   Date: ___________`;

const TEMPLATES = [
  {
    id: "t1",
    name: "Full-Time Employee",
    icon: "FT",
    color: B.deep,
    form: {
      candidateName: "",
      jobRole: "Software Engineer",
      department: "",
      employmentType: "Full Time",
      salary: "$120,000/year",
      startDate: "2026-07-01",
      endDate: "",
      location: "Riyadh, KSA",
      hours: "",
      manager: "Director of Engineering",
      benefits: "Health, Dental, Vision, Annual Leave (25 days)",
      probation: "90 days",
      terms: "Standard employment terms apply.",
    },
  },
  {
    id: "t2",
    name: "Contractor",
    icon: "CT",
    color: B.steel,
    form: {
      candidateName: "",
      jobRole: "IT Consultant",
      department: "",
      employmentType: "Contract",
      salary: "$85/hour",
      startDate: "2026-07-01",
      endDate: "2026-12-31",
      location: "Remote",
      hours: "Flexible",
      manager: "Project Manager",
      benefits: "None - Independent Contractor",
      probation: "N/A",
      terms: "Contractor is responsible for own taxes and insurance.",
    },
  },
  {
    id: "t3",
    name: "AI Instructor",
    icon: "AI",
    color: "#4E8EA2",
    form: {
      candidateName: "",
      jobRole: "AI Instructor - Machine Learning",
      department: "Education & Training",
      employmentType: "Instructor",
      salary: "$700/day",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      location: "Remote / On-site",
      hours: "Per session schedule",
      manager: "Training Program Director",
      benefits: "Transport + Accommodation where applicable",
      probation: "N/A",
      terms:
        "Curriculum must be delivered as per agreed syllabus. IP of materials remains with client.",
    },
  },
  {
    id: "t4",
    name: "Freelancer",
    icon: "FL",
    color: "#6EA2B3",
    form: {
      candidateName: "",
      jobRole: "UI/UX Designer",
      department: "Product",
      employmentType: "Freelance",
      salary: "$5,500/project",
      startDate: "2026-07-01",
      endDate: "2026-08-15",
      location: "Remote",
      hours: "Project-based",
      manager: "Head of Product",
      benefits: "None",
      probation: "N/A",
      terms:
        "Deliverables defined in attached SOW. Payment on milestone completion.",
    },
  },
  {
    id: "t5",
    name: "AI Engineer",
    icon: "AE",
    color: B.navy,
    form: {
      candidateName: "",
      jobRole: "",
      department: "Artificial Intelligence",
      employmentType: "Full Time",
      salary: "",
      startDate: "",
      endDate: "",
      location: "",
      hours: "",
      manager: "",
      benefits: "",
      probation: "",
      terms: "",
    },
  },
  {
    id: "t6",
    name: "Part-Time Staff",
    icon: "PT",
    color: B.sky,
    form: {
      candidateName: "",
      jobRole: "HR Coordinator",
      department: "Human Resources",
      employmentType: "Part-Time",
      salary: "$3,200/month",
      startDate: "2026-07-15",
      endDate: "",
      location: "Jeddah, KSA",
      hours: "20 hrs/week",
      manager: "HR Manager",
      benefits: "Pro-rated leave and health coverage",
      probation: "60 days",
      terms: "Part-time schedule to be agreed with line manager.",
    },
  },
];

const AI_QUICK_ACTIONS = [
  { id: "legal", label: "Generate legal wording", icon: Shield },
  { id: "improve", label: "Improve language", icon: PenLine },
  { id: "summary", label: "Summarize contract", icon: BookOpen },
  { id: "risks", label: "Highlight risks", icon: AlertCircle },
  { id: "explain", label: "Explain clauses simply", icon: MessageSquare },
];

const AI_RESPONSES = {
  legal:
    'Here are legally-sound clause suggestions:\n\n- "The Employee agrees to maintain strict confidentiality of all proprietary information, trade secrets, and client data both during and after the term of this agreement."\n\n- "Either party may terminate this agreement with thirty (30) days written notice. In the event of gross misconduct, immediate termination without notice is permitted."\n\n- "Any intellectual property created during the course of employment shall remain the sole property of the Company."',
  improve:
    'Suggested language improvements:\n\n- Replace "will be paid" with "shall receive compensation of"\n- Replace "can be fired" with "employment may be terminated"\n- Replace "must follow rules" with "Employee agrees to comply with all Company policies"\n- Add Oxford commas throughout\n- Standardize date formats to DD/MM/YYYY throughout the document',
  summary:
    "Contract Summary:\n\nThis is a Full-Time employment agreement between TalentFlow Client and the candidate. Key terms include:\n\n- Position: As specified in Section 1\n- Compensation: Competitive package with benefits\n- Duration: Ongoing with standard notice period\n- Jurisdiction: Saudi Arabia labor law applies\n- Probation: Standard 90-day evaluation period",
  risks:
    "Risk Assessment:\n\nHIGH: No intellectual property assignment clause detected\nMEDIUM: Non-compete clause missing - consider adding\nMEDIUM: Data protection obligations not explicitly stated\nLOW: Notice period is standard and compliant\nLOW: Compensation structure is clearly defined\n\nRecommendation: Add IP and NDA provisions before sending.",
  explain:
    "Plain Language Explanation:\n\n- Confidentiality = You cannot share company secrets with anyone\n- Termination Clause = How the job can end - both sides must give 30 days notice\n- Probation = The first 3 months are a trial period for both of you\n- IP Ownership = Anything you build at work belongs to the company\n- Governing Law = Any disagreements are handled under Saudi law",
};

function generateContractText(form) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return {
    summary: `This ${form.employmentType} Employment Agreement ("Agreement") is entered into on ${today} between TalentFlow HR Solutions ("Company") and ${form.candidateName || "[CANDIDATE NAME]"} ("Employee/Contractor"), for the position of ${form.jobRole || "[ROLE]"} within the ${form.department || "[DEPARTMENT]"} department.`,
    terms: `1. EMPLOYMENT TERMS\nThe ${form.employmentType === "Full-Time" ? "Employee" : "Contractor"} shall commence duties on ${form.startDate || "[START DATE]"}${form.endDate ? ` and the engagement shall conclude on ${form.endDate}` : ", with no fixed end date"}. The work location is ${form.location || "[LOCATION]"}. Standard working hours are ${form.hours || "[HOURS]"}.\n\n2. REPORTING STRUCTURE\nThe ${form.employmentType === "Full-Time" ? "Employee" : "Contractor"} will report directly to ${form.manager || "[MANAGER]"}.`,
    responsibilities: `3. ROLES AND RESPONSIBILITIES\nThe ${form.jobRole || "[ROLE]"} position carries the following core responsibilities:\n\n- Deliver high-quality outputs aligned with the ${form.department || "[DEPARTMENT]"} team objectives\n- Attend required meetings, reviews, and collaboration sessions\n- Adhere to all Company policies, procedures, and security protocols\n- Maintain professional standards and represent the Company appropriately\n- Complete all assigned tasks within agreed timelines and quality standards\n${form.terms ? `\nAdditional terms: ${form.terms}` : ""}`,
    compensation: `4. COMPENSATION & BENEFITS\nBase Compensation: ${form.salary || "[SALARY]"}\n\nBenefits Package:\n${form.benefits || "[BENEFITS]"}\n\n${form.probation && form.probation !== "N/A" ? `Probation Period: ${form.probation}\nDuring the probation period, either party may terminate this agreement with 7 days written notice.\n\n` : ""}Payment shall be processed according to the Company's standard payroll schedule. All applicable taxes and statutory deductions shall be applied in compliance with applicable law.`,
    confidentiality: `5. CONFIDENTIALITY & NON-DISCLOSURE\nThe ${form.employmentType === "Full-Time" ? "Employee" : "Contractor"} agrees to maintain strict confidentiality of all proprietary information, trade secrets, client data, financial information, and any other non-public information obtained during the course of this engagement. This obligation survives the termination of this Agreement for a period of two (2) years.\n\n6. INTELLECTUAL PROPERTY\nAll work product, inventions, and intellectual property created in connection with this engagement shall be the sole and exclusive property of the Company. The ${form.employmentType === "Full-Time" ? "Employee" : "Contractor"} hereby assigns all such rights to the Company.`,
    termination: `7. TERMINATION\nEither party may terminate this Agreement by providing ${form.probation && form.probation !== "N/A" ? "30" : "14"} days written notice to the other party. The Company reserves the right to terminate this Agreement immediately in the event of gross misconduct, breach of confidentiality, or repeated failure to meet performance standards.\n\n8. GOVERNING LAW\nThis Agreement shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. Any disputes arising from this Agreement shall be resolved through arbitration in Riyadh, KSA.`,
  };
}

// â”€â”€â”€ STATUS BADGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatusBadge({ status }) {
  const styles = {
    Signed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Sent: "bg-blue-100 text-blue-700 border-blue-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Draft: "bg-slate-100 text-slate-600 border-slate-200",
    Expired: "bg-red-100 text-red-700 border-red-200",
    Rejected: "bg-red-100 text-red-600 border-red-200",
  };
  const icons = {
    Signed: CheckCircle,
    Sent: Send,
    Pending: Clock,
    Draft: FileText,
    Expired: XCircle,
    Rejected: XCircle,
  };
  const Icon = icons[status] || FileText;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.Draft}`}
    >
      <Icon size={10} /> {status}
    </span>
  );
}

// â”€â”€â”€ PROGRESS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProgressBar({
  value,
  max = 100,
  color = B.deep,
  height = 8,
  label,
  sublabel,
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-600 font-medium">{label}</span>
          <span className="text-slate-500">
            {sublabel || `${value}/${max}`}
          </span>
        </div>
      )}
      <div
        className="rounded-full overflow-hidden"
        style={{ height, background: "#E2E8F0" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// â”€â”€â”€ WORKFLOW STEP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function WorkflowStep({ label, status }) {
  const isDone = status === "done";
  const isActive = status === "active";
  const isPending = status === "pending";
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all"
        style={{
          background: isDone ? B.steel : isActive ? B.deep : "#E2E8F0",
          color: isDone || isActive ? "#fff" : "#94a3b8",
          boxShadow: isActive ? `0 0 0 4px ${B.light}` : "none",
        }}
      >
        {isDone ? (
          <CheckCircle size={16} />
        ) : (
          <span className="w-2 h-2 rounded-full bg-current" />
        )}
      </div>
      <span
        className={`text-xs text-center font-medium leading-tight ${isDone ? "text-teal-700" : isActive ? "text-blue-800" : "text-slate-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

// â”€â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ContractManagement() {
  // tabs
  const [tab, setTab] = useState("generator");

  // generator form
  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    jobRole: "",
    department: "",
    employmentType: "Full Time",
    salary: "",
    startDate: "",
    endDate: "",
    location: "",
    hours: "",
    manager: "",
    benefits: "",
    probation: "",
    terms: "",
  });

  const [contractSections, setContractSections] = useState(null);
  const [generating, setGenerating] = useState(false);

  // "Send to Candidate" â€” loading + result modal state
  const [sendingContract, setSendingContract] = useState(false);
  const [sendModal, setSendModal] = useState(null); // { ok: bool, msg: string }

  // Flatten the generated section object into a single document string for sending.
  const sectionsToText = (s) =>
    !s ? "" : Object.entries(s)
      .map(([key, val]) => {
        const heading = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
        return `${heading.toUpperCase()}\n${val}`;
      })
      .join("\n\n");

  async function handleSendToCandidate() {
    if (!contractSections) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.candidateEmail || "")) {
      setSendModal({ ok: false, msg: "Please enter a valid candidate email in Contract Details first." });
      return;
    }
    setSendingContract(true);
    try {
      const res = await contractsApi.sendContract({
        candidate_name: form.candidateName,
        candidate_email: form.candidateEmail.trim(),
        title: `${form.employmentType || ""} Contract - ${form.jobRole || "Role"}`.trim(),
        role_title: form.jobRole || "",
        salary: form.salary || "",
        start_date: form.startDate || "",
        document_type: "contract",
        content: sectionsToText(contractSections),
      });
      setSendModal({ ok: true, msg: res.message || "Contract sent successfully via Email and to Candidate Portal." });
    } catch (e) {
      setSendModal({ ok: false, msg: e.message || "Failed to send the contract. Please try again." });
    } finally {
      setSendingContract(false);
    }
  }
  const [saveDraftDone, setSaveDraftDone] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(2);

  // AI Assistant
  const [chatLog, setChatLog] = useState([
    {
      from: "ai",
      text: "Hello! I'm your AI Contract Assistant. I can help you generate legal wording, improve language, highlight risks, and more. What would you like me to do?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  // contract list filters
  const [listSearch, setListSearch] = useState("");
  const [listFilter, setListFilter] = useState("All");

  // live contracts list (mutable â€” supports delete/edit)
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState("");

  // edit modal state
  const [editContract, setEditContract] = useState(null);
  const [editForm, setEditForm] = useState({});

  // contract detail view
  const [selectedContract, setSelectedContract] = useState(null);
  const [viewerZoom, setViewerZoom] = useState(1);

  // open section in editor from template
  const [templateCandidateName, setTemplateCandidateName] = useState("");

  const filteredContracts = contracts.filter((c) => {
    const candidate = c.candidate || "";
    const role = c.role || "";
    const matchSearch =
      candidate.toLowerCase().includes(listSearch.toLowerCase()) ||
      role.toLowerCase().includes(listSearch.toLowerCase());
    const matchFilter = listFilter === "All" || c.status === listFilter;
    return matchSearch && matchFilter;
  });

  useEffect(() => {
    let alive = true;
    setContractsLoading(true);
    setContractsError("");
    contractsApi.hrList()
      .then((rows) => {
        if (!alive) return;
        setContracts((Array.isArray(rows) ? rows : []).map((c) => ({
          id: c.id,
          candidate: c.candidateName || c.candidate_name || c.candidate_email || "Candidate",
          role: c.roleTitle || c.role_title || "",
          dept: c.department || "",
          status: c.status || "Pending Signature",
          date: (c.sent_at || c.created_at || "").slice(0, 10),
          type: c.documentType || c.document_type || "Contract",
          body: c.content || DEFAULT_CONTRACT_BODY,
        })));
      })
      .catch((e) => {
        if (!alive) return;
        setContracts([]);
        setContractsError(e.message || "Could not load contracts.");
      })
      .finally(() => alive && setContractsLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  // â”€â”€ actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setContractSections(generateContractText(form));
      setGenerating(false);
    }, 1600);
  }

  function handleRegenerate() {
    setGenerating(true);
    setTimeout(() => {
      setContractSections(
        generateContractText({ ...form, terms: form.terms + " [Revised]" }),
      );
      setGenerating(false);
    }, 1200);
  }

  function handleSaveDraft() {
    setSaveDraftDone(true);
    setTimeout(() => setSaveDraftDone(false), 2500);
  }

  function applyTemplate(tpl) {
    setSelectedTemplate(tpl.id);
    setForm({
      ...tpl.form,
      candidateName: templateCandidateName || tpl.form.candidateName,
    });
    setContractSections(null);
    setTab("generator");
  }

  function handleAiAction(action) {
    const response = AI_RESPONSES[action];
    if (!response) return;
    const actionLabels = {
      legal: "Generate legal wording",
      improve: "Improve language",
      summary: "Summarize contract",
      risks: "Highlight risks",
      explain: "Explain clauses simply",
    };
    setChatLog((prev) => [
      ...prev,
      { from: "user", text: actionLabels[action] },
    ]);
    setAiLoading(true);
    setTimeout(() => {
      setChatLog((prev) => [...prev, { from: "ai", text: response }]);
      setAiLoading(false);
    }, 1000);
  }

  function handleChatSend() {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatLog((prev) => [...prev, { from: "user", text: q }]);
    setChatInput("");
    setAiLoading(true);
    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          from: "ai",
          text: `I've analyzed your request: "${q}"\n\nBased on the current contract context for ${form.candidateName || "the candidate"}, here is my recommendation:\n\n- The clause appears compliant with standard employment law\n- Consider adding a dispute resolution mechanism\n- Ensure both parties sign all pages\n\nWould you like me to draft specific language for this?`,
        },
      ]);
      setAiLoading(false);
    }, 1200);
  }

  // â”€â”€ Delete contract â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function onDeleteContract(contractId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this contract? This action cannot be undone."
    );
    if (!confirmed) return;
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
    try {
      await contractsApi.hrDelete(contractId);
    } catch (e) {
      setContractsError(e.message || "Could not delete contract.");
      contractsApi.hrList().then((rows) => {
        setContracts((Array.isArray(rows) ? rows : []).map((c) => ({
          id: c.id,
          candidate: c.candidateName || c.candidate_name || c.candidate_email || "Candidate",
          role: c.roleTitle || c.role_title || "",
          dept: c.department || "",
          status: c.status || "Pending Signature",
          date: (c.sent_at || c.created_at || "").slice(0, 10),
          type: c.documentType || c.document_type || "Contract",
          body: c.content || DEFAULT_CONTRACT_BODY,
        })));
      }).catch(() => {});
    }
  }

  async function onViewContract(contract) {
    setViewerZoom(1);
    setSelectedContract(contract);
    try {
      const full = await contractsApi.hrGet(contract.id);
      setSelectedContract({ ...contract, ...full });
    } catch (e) {
      setContractsError(e.message || "Could not load contract details.");
    }
  }

  // â”€â”€ Open edit modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function onEditContract(contract) {
    console.log("[ContractManagement] Edit opened for contract:", contract.id, contract.candidate);
    setEditForm({
      candidate: contract.candidate,
      role: contract.role,
      dept: contract.dept,
      type: contract.type,
      status: contract.status,
    });
    setEditContract(contract);
  }

  // â”€â”€ Save edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleEditSave() {
    if (!editForm.candidate?.trim() || !editForm.role?.trim()) return;
    setContracts((prev) =>
      prev.map((c) =>
        c.id === editContract.id ? { ...c, ...editForm } : c
      )
    );
    console.log("[ContractManagement] Contract saved:", editContract.id, editForm);
    setEditContract(null);
    setEditForm({});
  }

  // â”€â”€ KPI stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const kpiCards = [
    {
      label: "Total Contracts",
      value: contracts.length,
      icon: FileText,
      color: B.deep,
      bg: "#EFF6FF",
    },
    {
      label: "Sent This Month",
      value: contracts.filter((c) => c.status === "Sent").length + 3,
      icon: Send,
      color: B.steel,
      bg: "#F0F9FF",
    },
    {
      label: "Pending Signatures",
      value: contracts.filter((c) => c.status === "Pending").length + 1,
      icon: Clock,
      color: "#D97706",
      bg: "#FFFBEB",
    },
    {
      label: "Active Employees",
      value: 47,
      icon: Users,
      color: "#059669",
      bg: "#ECFDF5",
    },
  ];

  const statusCounters = [
    {
      label: "Draft",
      count: contracts.filter((c) => c.status === "Draft").length,
      color: "bg-slate-100 text-slate-700",
    },
    {
      label: "Pending Approval",
      count: 2,
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Sent",
      count: contracts.filter((c) => c.status === "Sent").length,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Signed",
      count: contracts.filter((c) => c.status === "Signed").length,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Expired",
      count: contracts.filter((c) => c.status === "Expired").length,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Rejected",
      count: contracts.filter((c) => c.status === "Rejected").length,
      color: "bg-rose-100 text-rose-700",
    },
  ];

  // â”€â”€ workflow steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const wfLabels = ["Draft", "Under Review", "Approved", "Sent", "Signed"];
  const wfStatus = (i) =>
    i < workflowStep ? "done" : i === workflowStep ? "active" : "pending";

  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-5 pb-10">
      {selectedContract && (
        <ContractViewerModal
          contract={{ ...selectedContract, zoom: viewerZoom, setZoom: setViewerZoom }}
          onClose={() => setSelectedContract(null)}
        />
      )}
      {/* â•â• SEND-TO-CANDIDATE RESULT MODAL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {sendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,29,57,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setSendModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                sendModal.ok ? "bg-emerald-50" : "bg-red-50"
              }`}
            >
              {sendModal.ok ? (
                <CheckCircle size={30} className="text-emerald-500" />
              ) : (
                <XCircle size={30} className="text-red-500" />
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              {sendModal.ok ? "Contract Sent" : "Couldn't Send"}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">{sendModal.msg}</p>
            <button
              onClick={() => setSendModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: B.deep }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* â•â• PAGE HEADER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div
        className="rounded-2xl px-6 py-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: `linear-gradient(135deg, ${B.navy} 0%, ${B.deep} 55%, ${B.steel} 100%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Contract Management</h1>
            <p className="text-blue-200 text-sm">
              AI-powered contract generation, review, and tracking
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1 gap-1 flex-wrap">
          {[
            { id: "generator", label: "Generator", icon: Sparkles },
            { id: "contracts", label: "Contracts", icon: FileText },
            { id: "templates", label: "Templates", icon: LayoutDashboard },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? "bg-white text-blue-800 shadow" : "text-white/80 hover:bg-white/15"}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* â•â• SECTION 1: DASHBOARD (always visible) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((k) => (
            <div
              key={k.label}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4"
            >
              <div
                className="p-3 rounded-2xl flex-shrink-0"
                style={{ background: k.bg }}
              >
                <k.icon size={20} style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: B.navy }}>
                  {k.value}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                  {k.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Status counters */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Live Status Overview
          </p>
          <div className="flex flex-wrap gap-2">
            {statusCounters.map((s) => (
              <div
                key={s.label}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${s.color}`}
              >
                <span className="text-xl font-bold">{s.count}</span>
                <span className="text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â• SECTION 2: AI CONTRACT GENERATOR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "generator" && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* LEFT: Form */}
            <div className="xl:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div
                className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
                style={{ background: B.lightBg }}
              >
                <FilePlus size={16} style={{ color: B.deep }} />
                <h2 className="font-semibold text-sm" style={{ color: B.navy }}>
                  Contract Details
                </h2>
              </div>
              <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">
                {[
                  {
                    key: "candidateName",
                    label: "Candidate Name",
                    placeholder: "Full name",
                  },
                  {
                    key: "candidateEmail",
                    label: "Candidate Email",
                    placeholder: "candidate@email.com",
                    type: "email",
                  },
                  {
                    key: "jobRole",
                    label: "Job Role",
                    placeholder: "e.g. Senior Engineer",
                  },
                  {
                    key: "department",
                    label: "Department",
                    placeholder: "e.g. Technology",
                  },
                  {
                    key: "salary",
                    label: "Salary / Rate",
                    placeholder: "e.g. $120,000/year",
                  },
                  {
                    key: "startDate",
                    label: "Start Date",
                    placeholder: "",
                    type: "date",
                  },
                  {
                    key: "endDate",
                    label: "End Date",
                    placeholder: "Leave blank if permanent",
                    type: "date",
                  },
                  {
                    key: "location",
                    label: "Work Location",
                    placeholder: "e.g. Riyadh / Remote",
                  },
                  {
                    key: "hours",
                    label: "Working Hours",
                    placeholder: "e.g. 40 hrs/week",
                  },
                  {
                    key: "manager",
                    label: "Reporting Manager",
                    placeholder: "Manager name",
                  },
                  {
                    key: "probation",
                    label: "Probation Period",
                    placeholder: "e.g. 3 months",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                      {f.label}
                    </label>
                    <input
                      type={f.type || "text"}
                      value={form[f.key]}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                    />
                  </div>
                ))}

                {/* Employment Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    Employment Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Full-Time",
                      "Part-Time",
                      "Contract",
                      "Freelance",
                      "Instructor",
                    ].map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, employmentType: t })}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.employmentType === t ? "text-white border-transparent" : "border-slate-200 text-slate-600 hover:border-blue-200"}`}
                        style={
                          form.employmentType === t
                            ? { background: B.deep }
                            : {}
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    Benefits
                  </label>
                  <textarea
                    rows={2}
                    value={form.benefits}
                    onChange={(e) =>
                      setForm({ ...form, benefits: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    Additional Terms
                  </label>
                  <textarea
                    rows={3}
                    value={form.terms}
                    onChange={(e) =>
                      setForm({ ...form, terms: e.target.value })
                    }
                    placeholder="Any specific terms..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${B.navy}, ${B.steel})`,
                  }}
                >
                  {generating ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {generating ? "Generating..." : "Generate Contract"}
                </button>
              </div>
            </div>

            {/* MIDDLE: Document Preview */}
            <div className="xl:col-span-1 flex flex-col">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 overflow-hidden">
                <div
                  className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
                  style={{ background: B.lightBg }}
                >
                  <div className="flex items-center gap-2">
                    <Eye size={16} style={{ color: B.deep }} />
                    <h2
                      className="font-semibold text-sm"
                      style={{ color: B.navy }}
                    >
                      Document Preview
                    </h2>
                  </div>
                  {contractSections && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-emerald-700 bg-emerald-100">
                      Generated
                    </span>
                  )}
                </div>

                {/* Paper Document */}
                <div
                  className="p-4 bg-slate-100 overflow-y-auto"
                  style={{ maxHeight: "62vh" }}
                >
                  <div
                    className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mx-auto"
                    style={{
                      maxWidth: 600,
                      fontFamily: "Georgia, serif",
                      fontSize: 13,
                    }}
                  >
                    {/* Header */}
                    <div className="text-center mb-6 pb-4 border-b-2 border-slate-200">
                      <div
                        className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                        style={{ background: B.deep }}
                      >
                        <FileText size={18} className="text-white" />
                      </div>
                      <h1
                        className="text-lg font-bold tracking-wide"
                        style={{ color: B.navy }}
                      >
                        EMPLOYMENT CONTRACT
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        TalentFlow HR Solutions - Confidential Document
                      </p>
                    </div>

                    {!contractSections && !generating && (
                      <div className="py-16 text-center space-y-3">
                        <div
                          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                          style={{ background: B.lightBg }}
                        >
                          <Sparkles size={28} style={{ color: B.steel }} />
                        </div>
                        <p className="font-semibold" style={{ color: B.navy }}>
                          Ready to Generate
                        </p>
                        <p className="text-xs text-slate-400">
                          Fill in the form and click "Generate Contract" to see
                          your AI-drafted document here.
                        </p>
                      </div>
                    )}

                    {generating && (
                      <div className="py-16 text-center space-y-4">
                        <Loader
                          size={32}
                          className="mx-auto animate-spin"
                          style={{ color: B.steel }}
                        />
                        <p className="text-sm font-medium text-slate-600">
                          AI is drafting your contract...
                        </p>
                        <div className="space-y-2 mx-8">
                          {[
                            "Analyzing role requirements",
                            "Generating legal clauses",
                            "Formatting document",
                            "Finalizing terms",
                          ].map((s, i) => (
                            <div
                              key={s}
                              className="flex items-center gap-2 text-xs text-slate-500"
                            >
                              <CheckCircle
                                size={12}
                                className="text-emerald-500"
                              />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {contractSections && !generating && (
                      <div
                        className="space-y-4 text-slate-700 leading-relaxed"
                        style={{ fontSize: 12 }}
                      >
                        <section>
                          <h3
                            className="font-bold uppercase tracking-wide text-xs mb-1"
                            style={{ color: B.deep }}
                          >
                            Contract Summary
                          </h3>
                          <p>{contractSections.summary}</p>
                        </section>
                        <section>
                          <h3
                            className="font-bold uppercase tracking-wide text-xs mb-1"
                            style={{ color: B.deep }}
                          >
                            Terms & Conditions
                          </h3>
                          <p className="whitespace-pre-line">
                            {contractSections.terms}
                          </p>
                        </section>
                        <section>
                          <h3
                            className="font-bold uppercase tracking-wide text-xs mb-1"
                            style={{ color: B.deep }}
                          >
                            Responsibilities
                          </h3>
                          <p className="whitespace-pre-line">
                            {contractSections.responsibilities}
                          </p>
                        </section>
                        <section>
                          <h3
                            className="font-bold uppercase tracking-wide text-xs mb-1"
                            style={{ color: B.deep }}
                          >
                            Compensation & Benefits
                          </h3>
                          <p className="whitespace-pre-line">
                            {contractSections.compensation}
                          </p>
                        </section>
                        <section>
                          <h3
                            className="font-bold uppercase tracking-wide text-xs mb-1"
                            style={{ color: B.deep }}
                          >
                            Confidentiality & IP
                          </h3>
                          <p className="whitespace-pre-line">
                            {contractSections.confidentiality}
                          </p>
                        </section>
                        <section>
                          <h3
                            className="font-bold uppercase tracking-wide text-xs mb-1"
                            style={{ color: B.deep }}
                          >
                            Termination & Governing Law
                          </h3>
                          <p className="whitespace-pre-line">
                            {contractSections.termination}
                          </p>
                        </section>

                        {/* Signature Section */}
                        <section className="mt-6 pt-4 border-t-2 border-slate-200">
                          <h3
                            className="font-bold uppercase tracking-wide text-xs mb-4"
                            style={{ color: B.deep }}
                          >
                            Signatures
                          </h3>
                          <div className="grid grid-cols-2 gap-8">
                            {[
                              "Company Representative",
                              form.candidateName || "Candidate",
                            ].map((party) => (
                              <div key={party}>
                                <div className="border-b border-slate-400 h-8 mb-1" />
                                <p className="text-xs text-slate-500">
                                  {party}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Date: ___________
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}

                    {/* Legal Disclaimer */}
                    <div className="mt-6 p-3 rounded-xl border-l-4 border-amber-400 bg-amber-50">
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={14}
                          className="text-amber-600 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-amber-800 leading-tight">
                          <strong>Legal Disclaimer:</strong> Generated contracts
                          are templates and do not constitute legal advice.
                          Always have contracts reviewed by a qualified legal
                          professional before signing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-slate-100 flex flex-wrap gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={!contractSections || generating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <RefreshCw size={13} /> Regenerate
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${saveDraftDone ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {saveDraftDone ? (
                      <>
                        <CheckCircle size={13} /> Saved!
                      </>
                    ) : (
                      <>
                        <Save size={13} /> Save Draft
                      </>
                    )}
                  </button>
                  <button
                    disabled={!contractSections}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <Download size={13} /> Export PDF
                  </button>
                  <button
                    disabled={!contractSections}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <Copy size={13} /> Export DOCX
                  </button>
                  <button
                    onClick={handleSendToCandidate}
                    disabled={!contractSections || sendingContract}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: B.deep }}
                  >
                    {sendingContract ? (
                      <><Loader size={13} className="animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={13} /> Send to Candidate</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: AI Assistant Panel */}
            <div className="xl:col-span-1 flex flex-col">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div
                  className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${B.navy}15, ${B.light}30)`,
                  }}
                >
                  <Bot size={16} style={{ color: B.deep }} />
                  <h2
                    className="font-semibold text-sm"
                    style={{ color: B.navy }}
                  >
                    AI Contract Assistant
                  </h2>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium text-blue-700 bg-blue-100">
                    Online
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="p-3 border-b border-slate-100 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Quick Actions
                  </p>
                  {AI_QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleAiAction(a.id)}
                      disabled={aiLoading}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-slate-100 text-slate-700 hover:border-blue-200 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
                    >
                      <a.icon
                        size={13}
                        style={{ color: B.steel }}
                        className="flex-shrink-0"
                      />
                      {a.label}
                      <ChevronRight
                        size={11}
                        className="ml-auto text-slate-300"
                      />
                    </button>
                  ))}
                </div>

                {/* Chat Log */}
                <div
                  className="flex-1 overflow-y-auto p-3 space-y-3"
                  style={{ minHeight: 180, maxHeight: "26vh" }}
                >
                  {chatLog.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${msg.from === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: msg.from === "ai" ? B.deep : B.light,
                        }}
                      >
                        {msg.from === "ai" ? (
                          <Bot size={13} className="text-white" />
                        ) : (
                          <Users size={13} style={{ color: B.deep }} />
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.from === "ai" ? "bg-slate-50 text-slate-700 border border-slate-100" : "text-white"}`}
                        style={
                          msg.from === "user" ? { background: B.deep } : {}
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: B.deep }}
                      >
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2 flex gap-1 items-center">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                      placeholder="Ask the AI assistant..."
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />

                    <button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || aiLoading}
                      className="p-2 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: B.deep }}
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* â•â• SECTION 3: CONTRACTS LIST â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "contracts" && (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div
            className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
            style={{ background: B.lightBg }}
          >
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: B.deep }} />
              <h2 className="font-semibold text-sm" style={{ color: B.navy }}>
                All Contracts
              </h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {filteredContracts.length}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search contracts..."
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />

              <select
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              >
                <option>All</option>
                {[
                  "Draft",
                  "Pending",
                  "Pending Signature",
                  "Sent",
                  "Signed",
                  "Expired",
                  "Rejected",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "ID",
                    "Candidate",
                    "Role",
                    "Department",
                    "Type",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contractsLoading && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Loading contracts...</td></tr>
                )}
                {!contractsLoading && contractsError && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-red-500">{contractsError}</td></tr>
                )}
                {!contractsLoading && !contractsError && filteredContracts.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No contracts available.</td></tr>
                )}
                {!contractsLoading && !contractsError && filteredContracts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 transition-colors"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F8FBFF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td className="px-5 py-3 text-xs font-mono text-slate-500">
                      {c.id}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: B.deep }}
                        >
                          {c.candidate.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-800">
                          {c.candidate}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {c.role}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {c.dept}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {c.type}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {c.date}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onViewContract(c)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => onEditContract(c)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 active:bg-amber-100 transition-colors cursor-pointer"
                          title="Edit contract"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteContract(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 active:bg-red-100 transition-colors cursor-pointer"
                          title="Delete contract"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* â•â• SECTION 4: TEMPLATES & WORKFLOW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "templates" && (
        <section className="space-y-5">
          {/* Template Grid */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
              style={{ background: B.lightBg }}
            >
              <Star size={16} style={{ color: B.deep }} />
              <h2 className="font-semibold text-sm" style={{ color: B.navy }}>
                Pre-built Contract Templates
              </h2>
            </div>
            <div className="p-5">
              <div className="mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Candidate Name (optional pre-fill)
                </label>
                <input
                  value={templateCandidateName}
                  onChange={(e) => setTemplateCandidateName(e.target.value)}
                  placeholder="Candidate name"
                  className="mt-1 w-full max-w-xs px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className={`group cursor-pointer rounded-2xl border-2 p-4 transition-all hover:-translate-y-1 hover:shadow-lg ${selectedTemplate === tpl.id ? "border-blue-400 bg-blue-50" : "border-slate-100 hover:border-blue-200"}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{tpl.icon}</div>
                      {selectedTemplate === tpl.id && (
                        <CheckCircle size={16} className="text-blue-600" />
                      )}
                    </div>
                    <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {tpl.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {tpl.form.employmentType} - {tpl.form.location}
                    </p>
                    <div
                      className="mt-3 flex items-center gap-1 text-xs font-semibold"
                      style={{ color: tpl.color }}
                    >
                      Use Template <ChevronRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Approval Workflow */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div
              className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
              style={{ background: B.lightBg }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: B.deep }} />
                <h2 className="font-semibold text-sm" style={{ color: B.navy }}>
                  Approval Workflow
                </h2>
              </div>
              <div className="flex gap-2">
                {workflowStep > 0 && (
                  <button
                    onClick={() => setWorkflowStep((s) => Math.max(0, s - 1))}
                    className="px-3 py-1 rounded-lg text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                )}
                {workflowStep < wfLabels.length - 1 && (
                  <button
                    onClick={() =>
                      setWorkflowStep((s) =>
                        Math.min(wfLabels.length - 1, s + 1),
                      )
                    }
                    className="px-3 py-1 rounded-lg text-xs text-white hover:opacity-90"
                    style={{ background: B.deep }}
                  >
                    Advance
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                {wfLabels.map((label, i) => (
                  <div key={label} className="flex items-center flex-1">
                    <WorkflowStep label={label} status={wfStatus(i)} />
                    {i < wfLabels.length - 1 && (
                      <div
                        className="h-0.5 flex-1 mx-1 rounded-full transition-all duration-500"
                        style={{
                          background: i < workflowStep ? B.steel : "#E2E8F0",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div
                className="mt-5 p-4 rounded-xl text-sm font-medium text-center"
                style={{ background: B.lightBg, color: B.navy }}
              >
                Current Stage: <strong>{wfLabels[workflowStep]}</strong>
                {workflowStep === 4 && " - Contract cycle complete!"}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* â•â• SECTION 5: ANALYTICS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === "analytics" && (
        <section className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Contracts Signed */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck size={16} style={{ color: B.deep }} />
                <h3 className="font-semibold text-sm" style={{ color: B.navy }}>
                  Contracts Signed
                </h3>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: B.navy }}>
                24
              </p>
              <p className="text-xs text-emerald-600 mb-4">
                Up 18% vs last quarter
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Jan", v: 3, m: 6 },
                  { label: "Feb", v: 5, m: 6 },
                  { label: "Mar", v: 4, m: 6 },
                  { label: "Apr", v: 6, m: 6 },
                  { label: "May", v: 4, m: 6 },
                  { label: "Jun", v: 2, m: 6 },
                ].map((d) => (
                  <ProgressBar
                    key={d.label}
                    label={d.label}
                    value={d.v}
                    max={d.m}
                    color={B.steel}
                    height={10}
                    sublabel={`${d.v}`}
                  />
                ))}
              </div>
            </div>

            {/* Approval Time */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} style={{ color: B.deep }} />
                <h3 className="font-semibold text-sm" style={{ color: B.navy }}>
                  Avg. Approval Time
                </h3>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: B.navy }}>
                3.2{" "}
                <span className="text-base font-medium text-slate-400">
                  days
                </span>
              </p>
              <p className="text-xs text-emerald-600 mb-4">
                Down 0.8 days faster than last month
              </p>
              <div className="space-y-3">
                {[
                  { label: "Full-Time", days: 2.8, max: 7, color: B.deep },
                  { label: "Contract", days: 3.5, max: 7, color: B.steel },
                  { label: "Freelance", days: 2.1, max: 7, color: B.sky },
                  { label: "Instructor", days: 4.2, max: 7, color: "#6EA2B3" },
                ].map((r) => (
                  <ProgressBar
                    key={r.label}
                    label={r.label}
                    value={r.days}
                    max={r.max}
                    color={r.color}
                    height={10}
                    sublabel={`${r.days}d`}
                  />
                ))}
              </div>
            </div>

            {/* Active Agreements */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: B.deep }} />
                <h3 className="font-semibold text-sm" style={{ color: B.navy }}>
                  Active Agreements
                </h3>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: B.navy }}>
                47
              </p>
              <p className="text-xs text-blue-600 mb-4">
                Across 3 active projects
              </p>
              <div className="space-y-3">
                {[
                  { label: "Full-Time", count: 28, total: 47, color: B.navy },
                  { label: "Contractor", count: 11, total: 47, color: B.steel },
                  { label: "Freelance", count: 5, total: 47, color: B.sky },
                  {
                    label: "Instructor",
                    count: 3,
                    total: 47,
                    color: "#6EA2B3",
                  },
                ].map((r) => (
                  <ProgressBar
                    key={r.label}
                    label={r.label}
                    value={r.count}
                    max={r.total}
                    color={r.color}
                    height={10}
                    sublabel={`${r.count}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Summary analytics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Acceptance Rate",
                value: "89%",
                trend: "Up 4%",
                color: "#059669",
              },
              {
                label: "Avg. Contract Value",
                value: "$128K",
                trend: "Up 12%",
                color: B.deep,
              },
              {
                label: "Renewal Rate",
                value: "72%",
                trend: "Up 8%",
                color: B.steel,
              },
              {
                label: "Time to Sign",
                value: "4.1d",
                trend: "Down 1.2d",
                color: "#D97706",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 text-center"
              >
                <p className="text-2xl font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                <p className="text-xs font-semibold mt-1 text-emerald-600">
                  {s.trend}
                </p>
              </div>
            ))}
          </div>

          {/* Status distribution */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <h3
              className="font-semibold text-sm mb-4"
              style={{ color: B.navy }}
            >
              Contract Status Distribution
            </h3>
            <div className="flex gap-1 h-8 rounded-xl overflow-hidden">
              {[
                { label: "Signed", count: 24, color: "#059669" },
                { label: "Sent", count: 12, color: B.steel },
                { label: "Pending", count: 7, color: "#D97706" },
                { label: "Draft", count: 4, color: "#94a3b8" },
              ].map((s) => {
                const total = 47;
                return (
                  <div
                    key={s.label}
                    className="flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-90"
                    style={{
                      width: `${(s.count / total) * 100}%`,
                      background: s.color,
                      minWidth: 32,
                    }}
                    title={`${s.label}: ${s.count}`}
                  >
                    {s.count}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                { label: "Signed", color: "#059669" },
                { label: "Sent", color: B.steel },
                { label: "Pending", color: "#D97706" },
                { label: "Draft", color: "#94a3b8" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-1.5 text-xs text-slate-500"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* â•â• EDIT CONTRACT MODAL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {editContract && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,29,57,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => { setEditContract(null); setEditForm({}); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${B.navy} 0%, ${B.deep} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15">
                  <Edit size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Edit Contract</h2>
                  <p className="text-blue-200 text-xs mt-0.5">
                    {editContract.id} - {editContract.candidate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setEditContract(null); setEditForm({}); }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form body */}
            <div className="p-6 space-y-4">
              {/* Candidate Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={editForm.candidate ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, candidate: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Role / Job Title
                </label>
                <input
                  type="text"
                  value={editForm.role ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Senior Engineer"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Department
                  </label>
                  <select
                    value={editForm.dept ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, dept: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
                  >
                    {["Technology", "Education", "Finance", "Human Resources", "Product", "Artificial Intelligence", "Operations"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Contract Type
                  </label>
                  <select
                    value={editForm.type ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
                  >
                    {["Full-Time", "Contract", "Instructor", "Part-Time", "Freelance"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Draft", "Pending", "Sent", "Signed", "Expired", "Rejected"].map((s) => {
                    const active = editForm.status === s;
                    const colors = {
                      Signed:   { on: "bg-emerald-600 text-white border-emerald-600", off: "border-emerald-200 text-emerald-700 hover:bg-emerald-50" },
                      Sent:     { on: "bg-blue-600 text-white border-blue-600",       off: "border-blue-200 text-blue-700 hover:bg-blue-50"         },
                      Pending:  { on: "bg-amber-500 text-white border-amber-500",     off: "border-amber-200 text-amber-700 hover:bg-amber-50"       },
                      Draft:    { on: "bg-slate-500 text-white border-slate-500",     off: "border-slate-200 text-slate-600 hover:bg-slate-50"       },
                      Expired:  { on: "bg-red-600 text-white border-red-600",         off: "border-red-200 text-red-700 hover:bg-red-50"             },
                      Rejected: { on: "bg-rose-600 text-white border-rose-600",       off: "border-rose-200 text-rose-700 hover:bg-rose-50"          },
                    };
                    return (
                      <button
                        key={s}
                        onClick={() => setEditForm((f) => ({ ...f, status: s }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${active ? colors[s].on : colors[s].off}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setEditContract(null); setEditForm({}); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editForm.candidate?.trim() || !editForm.role?.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.steel})` }}
              >
                <Check size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



