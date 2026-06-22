import React from "react";
import EmailLayout, { EmailDataSection, EmailIllustration, EmailProgress } from "./EmailLayout";

const TITLES = {
  candidate_welcome: ["Welcome to TalentFlow", "Complete Your Profile", "person", "default", [["Candidate", "candidate_name"], ["Company", "company_name"]]],
  candidate_email_verification: ["Verify Your Email Address", "Verify Email Address", "security", "success", [["Verification Code", "verification_code"]]],
  candidate_password_reset: ["Reset Your Password", "Reset Password", "security", "warning", [["Reset Code", "verification_code"], ["Expires In", "expires_in"]]],
  candidate_interview_invitation: ["You're Invited to an Interview", "View Interview Details", "calendar", "default", [["Position", "job_title"], ["Date", "interview_date"], ["Time", "interview_time"], ["Location", "interview_location"]]],
  candidate_interview_reminder: ["Interview Reminder", "Join Interview", "reminder", "warning", [["Position", "job_title"], ["Date", "interview_date"], ["Time", "interview_time"], ["Location", "interview_location"]]],
  candidate_interview_result: ["Interview Update", "View Your Status", "trophy", "success", [["Status", "status"], ["Next Step", "next_step"]]],
  candidate_job_offer: ["Congratulations! You Received an Offer", "Review Offer", "gift", "success", [["Position", "job_title"], ["Department", "department"], ["Salary", "salary"], ["Start Date", "start_date"]]],
  candidate_contract_ready: ["Your Employment Contract is Ready", "View Contract", "contract", "default", [["Position", "job_title"], ["Company", "company_name"], ["Contract ID", "contract_id"]]],
  candidate_contract_signed: ["Contract Successfully Signed", "View Contract", "success", "success", [["Candidate", "candidate_name"], ["Contract Date", "contract_date"], ["Contract ID", "contract_id"]]],
  candidate_onboarding_welcome: ["Welcome to Onboarding", "Open Onboarding", "team", "success", [["Candidate", "candidate_name"], ["Company", "company_name"], ["Start Date", "start_date"]]],
  company_registration_approved: ["Your Organization Has Been Successfully Activated", "Open Dashboard", "office", "default", [["Organization Name", "organization_name"], ["Plan", "plan"], ["Activation Date", "activation_date"]]],
  subscription_purchased: ["Subscription Activated", "Manage Subscription", "billing", "success", [["Plan Name", "plan_name"], ["Billing Cycle", "billing_cycle"], ["Renewal Date", "renewal_date"]]],
  subscription_expiring: ["Subscription Expiring Soon", "Renew Subscription", "warning", "warning", [["Days Remaining", "days_remaining"], ["Plan Name", "plan_name"]]],
  subscription_renewal_reminder: ["Subscription Renewal Reminder", "Manage Renewal", "billing", "warning", [["Plan Name", "plan_name"], ["Renewal Date", "renewal_date"], ["Company", "company_name"]]],
  new_candidate_applied: ["New Candidate Application", "Review Candidate", "candidate", "default", [["Candidate Name", "candidate_name"], ["Position", "position"], ["Match Score", "match_score"], ["Application Date", "application_date"]]],
  interview_scheduled: ["Interview Successfully Scheduled", "View Interview", "calendar", "default", [["Candidate", "candidate_name"], ["Date", "interview_date"], ["Time", "interview_time"], ["Interviewer", "interviewer"]]],
  candidate_hired: ["Hiring Completed Successfully", "View Employee Profile", "success", "success", [["Candidate Name", "candidate_name"], ["Position", "position"], ["Department", "department"], ["Start Date", "start_date"]]],
  hr_new_application_alert: ["A New Candidate Applied", "Review Application", "candidate", "default", [["Candidate", "candidate_name"], ["Position", "position"], ["Match Score", "match_score"]]],
  hr_evaluation_submitted: ["Interview Feedback Submitted", "View Evaluation", "score", "default", [["Interviewer", "interviewer"], ["Candidate", "candidate_name"], ["Score", "score"]]],
  hr_offer_accepted: ["Offer Accepted", "View Details", "success", "success", [["Candidate", "candidate_name"], ["Position", "position"]]],
  hr_offer_rejected: ["Offer Rejected", "View Details", "warning", "warning", [["Candidate", "candidate_name"], ["Position", "job_title"], ["Reason", "reason"]]],
  hr_contract_signed: ["Employment Contract Signed", "View Contract", "contract", "success", [["Candidate", "candidate_name"], ["Contract Date", "contract_date"]]],
  hr_hiring_completed: ["Hiring Completed", "Open Candidate Profile", "success", "success", [["Candidate", "candidate_name"], ["Position", "job_title"], ["Department", "department"]]],
  employee_welcome: ["Welcome to the Team", "Open Employee Portal", "team", "success", [["Employee Name", "employee_name"], ["Department", "department"], ["Manager", "manager"], ["Start Date", "start_date"]]],
  employee_profile_completion: ["Complete Your Employee Profile", "Update Profile", "profile", "default", [["Completion", "completion_percent"], ["Required By", "deadline"]]],
  employee_training_assignment: ["New Training Assigned", "Start Training", "learning", "default", [["Course Name", "course_name"], ["Deadline", "deadline"]]],
  employee_performance_review: ["Performance Review Due", "Open Review", "review", "warning", [["Review Period", "review_period"], ["Manager", "manager"]]],
  employee_company_announcement: ["New Company Announcement", "Read Full Announcement", "announcement", "default", [["Announcement Title", "announcement_title"], ["Summary", "summary"]]],
  employee_promotion_notification: ["Promotion Notification", "View Details", "trophy", "success", [["Employee Name", "employee_name"], ["New Title", "new_title"], ["Effective Date", "effective_date"]]],
  employee_internal_transfer: ["Internal Transfer Notification", "View Transfer", "office", "default", [["Employee Name", "employee_name"], ["Department", "department"], ["Manager", "manager_name"]]],
  super_admin_new_company_registered: ["New Company Registered", "Open Executive Dashboard", "office", "default", [["Company", "company_name"], ["Owner", "owner_name"], ["Registered", "registered_at"]]],
  super_admin_subscription_purchased: ["Subscription Purchased", "View Subscription", "billing", "success", [["Company", "company_name"], ["Plan", "plan_name"], ["Amount", "amount"]]],
  super_admin_platform_error_alert: ["Platform Error Alert", "Review Incident", "danger", "danger", [["Service", "service"], ["Severity", "severity"], ["Detected At", "detected_at"]]],
  super_admin_security_alert: ["Security Alert", "Open Security Center", "security", "danger", [["Event", "event"], ["Risk Level", "risk_level"], ["Detected At", "detected_at"]]],
  super_admin_ai_processing_failure: ["AI Processing Failure", "Review AI Queue", "ai", "warning", [["Workflow", "workflow"], ["Failure Count", "failure_count"], ["Last Attempt", "last_attempt"]]],
  super_admin_monthly_platform_report: ["Monthly Platform Report", "Open Report", "analytics", "default", [["Reporting Month", "reporting_month"], ["Companies", "companies_count"], ["Active Users", "active_users"]]],
  super_admin_revenue_report: ["Revenue Report", "View Revenue", "revenue", "success", [["Period", "period"], ["Revenue", "revenue"], ["Growth", "growth"]]],
  super_admin_usage_analytics: ["Usage Analytics", "Open Analytics", "analytics", "default", [["Period", "period"], ["AI Requests", "ai_requests"], ["Interviews", "interviews_count"]]],
  welcome: ["Welcome to TalentFlow", "Complete Your Profile", "person", "default", [["Candidate", "candidate_name"], ["Company", "company_name"]]],
  verification: ["Verify Your Email Address", "Verify Email", "security", "success", [["Verification Code", "verification_code"]]],
  password_reset: ["Reset Your Password", "Reset Password", "security", "warning", [["Reset Code", "verification_code"], ["Expires In", "expires_in"]]],
  application: ["New Candidate Application", "Review Candidate", "candidate", "default", [["Candidate Name", "candidate_name"], ["Position", "position"], ["Match Score", "match_score"]]],
  interview: ["Interview Successfully Scheduled", "View Interview", "calendar", "default", [["Candidate", "candidate_name"], ["Date", "interview_date"], ["Time", "interview_time"]]],
  offer: ["Offer Accepted", "View Details", "success", "success", [["Candidate", "candidate_name"], ["Position", "position"]]],
  contract: ["Employment Contract Signed", "View Contract", "contract", "success", [["Candidate", "candidate_name"], ["Contract Date", "contract_date"]]],
  contract_signed: ["Employment Contract Signed", "View Contract", "contract", "success", [["Candidate", "candidate_name"], ["Contract Date", "contract_date"]]],
  onboarding: ["Welcome to the Team", "Open Employee Portal", "team", "success", [["Employee Name", "employee_name"], ["Department", "department"], ["Manager", "manager"], ["Start Date", "start_date"]]],
  admin_alert: ["Platform Error Alert", "Review Incident", "danger", "danger", [["Service", "service"], ["Severity", "severity"], ["Detected At", "detected_at"]]],
};

export default function EmailTemplate({ type = "welcome", data = {} }) {
  const [title, ctaLabel, illustration, tone, fields = []] = TITLES[type] || ["TalentFlow Notification", "Open TalentFlow", "announcement", "default", []];
  const items = fields.map(([label, key]) => ({ label, value: data[key] }));
  const recipient = data.user_name || data.employee_name || data.candidate_name || data.company_name || "there";

  return (
    <EmailLayout title={data.title || title} preheader={data.preheader || data.title || title} ctaLabel={data.ctaLabel || ctaLabel} ctaUrl={data.action_url || "#"} badge={data.badge || (type.startsWith("super_admin") ? "Executive Dashboard" : "")} tone={data.tone || tone}>
      <p>Hi {recipient},</p>
      <p>{data.message || "You have a new TalentFlow update."}</p>
      <EmailIllustration type={data.illustration || illustration} tone={data.tone || tone} />
      <EmailDataSection items={items} />
      {type === "employee_profile_completion" && <EmailProgress value={data.completion_percent} />}
    </EmailLayout>
  );
}
