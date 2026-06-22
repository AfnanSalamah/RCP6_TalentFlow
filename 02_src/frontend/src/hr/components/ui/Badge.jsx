import clsx from "clsx";

const variants = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
  teal: "bg-teal-100 text-teal-700",
  navy: "bg-blue-900 text-white",
};

const statusMap = {
  Active: "green",
  Completed: "blue",
  "On Hold": "yellow",
  New: "blue",
  "Resume Reviewed": "yellow",
  Shortlisted: "teal",
  "Interview Scheduled": "purple",
  Interviewed: "purple",
  Recommended: "green",
  "Offer Drafted": "yellow",
  "Contract Sent": "yellow",
  Hired: "navy",
  Rejected: "red",
  "Talent Pool": "teal",
  Open: "green",
  Closed: "default",
  High: "red",
  Medium: "yellow",
  Low: "green",
  Scheduled: "blue",
  Pending: "yellow",
};

export function Badge({ label, variant }) {
  const v = variant || statusMap[label] || "default";
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[v],
      )}
    >
      {label}
    </span>
  );
}
