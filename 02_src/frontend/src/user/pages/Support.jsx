import SupportCenter from "../../components/SupportCenter";
import AppLayout from "../components/layout/AppLayout";

// Candidate-facing Support Center (uses the applicant auth token).
export default function Support() {
  return (
    <AppLayout title="Support Center" subtitle="Contact the TalentFlow support team and track every reply">
      <div className="page-wrapper">
        <SupportCenter portal="applicant" />
      </div>
    </AppLayout>
  );
}
