import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Icon from "../components/common/Icon";
import { contractsApi } from "../../api/index";

const statusStyles = {
  "Pending Signature": { bg: "#FEF3C7", color: "#92400E", border: "#F59E0B" },
  Sent: { bg: "#EAF5FB", color: "#0A4174", border: "#7BBDE8" },
  Signed: { bg: "#D1FAE5", color: "#065F46", border: "#10B981" },
  Declined: { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5" },
};

const docTypeMeta = {
  offer: { label: "Offer", icon: "gift", bg: "#EAF7FA", color: "#4E8EA2" },
  contract: { label: "Contract", icon: "fileCheck", bg: "#EAF5FB", color: "#0A4174" },
};

function StatusBadge({ status }) {
  const s = statusStyles[status] || { bg: "#EEF7FC", color: "#49769F", border: "#BDD8E9" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "5px 11px",
      borderRadius: 999,
      border: `1px solid ${s.border}`,
      background: s.bg,
      color: s.color,
      fontSize: 12,
      fontWeight: 800,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

function ContractIcon({ type }) {
  const meta = docTypeMeta[(type || "").toLowerCase()] || docTypeMeta.contract;
  return (
    <div style={{
      width: 46,
      height: 46,
      borderRadius: 12,
      background: meta.bg,
      color: meta.color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon name={meta.icon} size={21} />
    </div>
  );
}

export default function MyContracts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const contractIdFromUrl = searchParams.get("contract");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeType, setActiveType] = useState("all");

  const load = () => {
    setLoading(true);
    setError("");
    contractsApi.myContracts()
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch((e) => {
        setList([]);
        setError(e.message || "Could not load contracts.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const stats = useMemo(() => ({
    total: list.length,
    offers: list.filter((c) => (c.documentType || "").toLowerCase() === "offer").length,
    contracts: list.filter((c) => (c.documentType || "").toLowerCase() !== "offer").length,
    pending: list.filter((c) => c.status === "Pending Signature" || c.status === "Sent").length,
    signed: list.filter((c) => c.status === "Signed").length,
  }), [list]);

  const visibleList = useMemo(() => {
    if (activeType === "offer") return list.filter((c) => (c.documentType || "").toLowerCase() === "offer");
    if (activeType === "contract") return list.filter((c) => (c.documentType || "").toLowerCase() !== "offer");
    return list;
  }, [activeType, list]);

  const view = async (id) => {
    const full = await contractsApi.getMine(id);
    setOpen(full);
    setSignature("");
  };

  useEffect(() => {
    if (!contractIdFromUrl) return;
    view(contractIdFromUrl).catch(() => setSearchParams({}, { replace: true }));
  }, [contractIdFromUrl, setSearchParams]);

  const closeDetail = () => {
    setOpen(null);
    setSearchParams({}, { replace: true });
  };

  const sign = async () => {
    if (!signature.trim()) return;
    setBusy(true);
    try {
      await contractsApi.sign(open.id, signature.trim());
      closeDetail();
      load();
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await contractsApi.decline(open.id, "");
      closeDetail();
      load();
    } finally {
      setBusy(false);
    }
  };

  if (open) {
    const canSign = open.status === "Pending Signature" || open.status === "Sent";
    const meta = docTypeMeta[(open.documentType || "").toLowerCase()] || docTypeMeta.contract;

    return (
      <AppLayout title="My Contracts" subtitle="Review and sign offers and contracts sent to you">
        <div className="page-wrapper" style={{ maxWidth: 980, display: "flex", flexDirection: "column", gap: 18 }}>
          <button className="btn btn-ghost btn-sm" onClick={closeDetail} style={{ alignSelf: "flex-start", color: "var(--text-secondary)" }}>
            <Icon name="chevronLeft" size={16} /> Back to contracts
          </button>

          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{
              background: "linear-gradient(135deg, #001D39 0%, #0A4174 65%, #4E8EA2 100%)",
              color: "#fff",
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={meta.icon} size={24} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#BDD8E9", textTransform: "uppercase", letterSpacing: ".06em" }}>{meta.label}</div>
                  <h1 style={{ fontSize: 22, lineHeight: 1.25, marginTop: 3 }}>{open.title}</h1>
                  <p style={{ color: "#BDD8E9", fontSize: 13, marginTop: 4 }}>{open.roleTitle || "Role not specified"} · sent {open.sentAt || open.createdAt}</p>
                </div>
              </div>
              <StatusBadge status={open.status} />
            </div>

            <div style={{ padding: 28, background: "#fff" }}>
              <div style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "linear-gradient(180deg, #FFFFFF 0%, #F8FCFE 100%)",
                padding: 22,
                maxHeight: "52vh",
                overflowY: "auto",
              }}>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.75, color: "var(--text-primary)" }}>
                  {open.content}
                </pre>
              </div>
            </div>

            {canSign && (
              <div style={{ padding: "22px 28px", borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <label className="form-label" htmlFor="contract-signature" style={{ textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Type your full legal name to sign
                </label>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 9, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 260px", position: "relative" }}>
                    <span className="search-icon"><Icon name="edit" size={16} /></span>
                    <input
                      id="contract-signature"
                      className="form-input search-input"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Your full legal name"
                    />
                  </div>
                  <button className="btn btn-primary" onClick={sign} disabled={busy || !signature.trim()}>
                    {busy ? <Icon name="spinner" size={16} className="animate-spin" /> : <Icon name="check" size={16} />}
                    Sign
                  </button>
                  <button className="btn btn-outline" onClick={decline} disabled={busy} style={{ borderColor: "var(--error)", color: "var(--error)" }}>
                    <Icon name="close" size={16} /> Decline
                  </button>
                </div>
              </div>
            )}

            {open.status === "Signed" && (
              <div style={{ padding: "18px 28px", borderTop: "1px solid #A7F3D0", background: "#ECFDF5", color: "#065F46", fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }}>
                <Icon name="checkCircle" size={18} /> Signed by {open.signatureName} on {open.signedAt}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Contracts" subtitle="Review and sign offers and contracts sent to you">
      <div className="page-wrapper" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { label: "Total Documents", value: stats.total, icon: "fileCheck", bg: "#EAF5FB", color: "#0A4174" },
            { label: "Offers", value: stats.offers, icon: "gift", bg: "#EAF7FA", color: "#4E8EA2" },
            { label: "Contracts", value: stats.contracts, icon: "fileCheck", bg: "#F0F7FB", color: "#49769F" },
            { label: "Awaiting Action", value: stats.pending, icon: "timer", bg: "#F0F7FB", color: "#49769F" },
            { label: "Signed", value: stats.signed, icon: "checkCircle", bg: "#D1FAE5", color: "#065F46" },
          ].map((card) => (
            <div key={card.label} className="card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={card.icon} size={20} />
              </div>
              <div>
                <div style={{ fontSize: 25, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginTop: 3 }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Icon name="spinner" size={30} className="animate-spin" /></div>
              <div className="empty-title">Loading contracts</div>
            </div>
          </div>
        ) : error ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Icon name="alert" size={30} /></div>
              <div className="empty-title">Could not load contracts</div>
              <div className="empty-desc">{error}</div>
              <button className="btn btn-primary" onClick={load}>Try again</button>
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><Icon name="fileCheck" size={30} /></div>
              <div className="empty-title">No contracts yet</div>
              <div className="empty-desc">Documents sent to you by employers will appear here.</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "rgba(234,245,251,.7)" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>
                  {activeType === "offer" ? "Offers" : activeType === "contract" ? "Contracts" : "Documents"}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Open a document to review details or sign.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "All", count: stats.total },
                  { id: "offer", label: "Offers", count: stats.offers },
                  { id: "contract", label: "Contracts", count: stats.contracts },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`btn btn-sm ${activeType === tab.id ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setActiveType(tab.id)}
                    type="button"
                  >
                    {tab.label} <span style={{ opacity: 0.75 }}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {visibleList.length === 0 ? (
                <div className="empty-state" style={{ padding: 38 }}>
                  <div className="empty-icon"><Icon name={activeType === "offer" ? "gift" : "fileCheck"} size={30} /></div>
                  <div className="empty-title">No {activeType === "offer" ? "offers" : "contracts"} yet</div>
                  <div className="empty-desc">New documents from employers will appear here.</div>
                </div>
              ) : visibleList.map((c) => {
                const meta = docTypeMeta[(c.documentType || "").toLowerCase()] || docTypeMeta.contract;
                return (
                  <button
                    key={c.id}
                    onClick={() => view(c.id)}
                    className="card-hover"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "18px 22px",
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                      gap: 14,
                      alignItems: "center",
                      borderBottom: "1px solid var(--border)",
                      background: "#fff",
                    }}
                  >
                    <ContractIcon type={c.documentType} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h3 className="truncate" style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", maxWidth: "100%" }}>{c.title}</h3>
                        <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, background: meta.bg, padding: "3px 8px", borderRadius: 999 }}>{meta.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                        {c.roleTitle || "Role not specified"} · sent {c.sentAt || c.createdAt || "recently"}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                    <Icon name="chevronRight" size={18} color="var(--text-muted)" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
