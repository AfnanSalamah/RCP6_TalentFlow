import SupportCenter from "../../components/SupportCenter";

// Employee-facing Support Center (Admin / HR Manager / Interviewer — uses HR token).
export default function Support() {
  return <SupportCenter portal="hr" />;
}
