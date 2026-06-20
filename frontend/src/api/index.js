import { api } from "./client";

// â”€â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const profileApi = {
  get:                () => api.get("/applicant/profile"),
  update:        (data) => api.put("/applicant/profile", data),
  importCv:       (data) => api.post("/applicant/profile/import-cv", data),
  getSettings:        () => api.get("/applicant/settings"),
  updateSettings: (data) => api.put("/applicant/settings", data),

  addExperience:     (data) => api.post("/applicant/experience", data),
  updateExperience:  (id, data) => api.put(`/applicant/experience/${id}`, data),
  deleteExperience:  (id) => api.delete(`/applicant/experience/${id}`),

  addEducation:      (data) => api.post("/applicant/education", data),
  updateEducation:   (id, data) => api.put(`/applicant/education/${id}`, data),
  deleteEducation:   (id) => api.delete(`/applicant/education/${id}`),

  addCertification:  (data) => api.post("/applicant/certification", data),
  deleteCertification: (id) => api.delete(`/applicant/certification/${id}`),
};

// â”€â”€â”€ Resume â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const resumeApi = {
  list:             () => api.get("/applicant/resume/list"),
  get:             (id) => api.get(`/applicant/resume/${id}`),
  delete:          (id) => api.delete(`/applicant/resume/${id}`),
  applyExtraction: (resume_id, extracted_profile) =>
    api.post("/applicant/resume/apply-extraction", { resume_id, extracted_profile }),
};

// â”€â”€â”€ Jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const jobsApi = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
    ).toString();
    return api.get(`/jobs${qs ? `?${qs}` : ""}`);
  },
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post("/jobs", data, "hr"),
  update: (id, data) => api.put(`/jobs/${id}`, data, "hr"),
  close:  (id) => api.delete(`/jobs/${id}`, "hr"),
};

// â”€â”€â”€ Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const applicationsApi = {
  apply:      (job_id, cover_letter = "") => api.post("/applicant/apply", { job_id, cover_letter }),
  list:       () => api.get("/applicant/applications"),
  get:        (id) => api.get(`/applicant/applications/${id}`),
  withdraw:   (id) => api.delete(`/applicant/applications/${id}`),
  messageCompany: (id, data) => api.post(`/applicant/applications/${id}/message-company`, data),
  companyConversation: (id) => api.get(`/applicant/applications/${id}/company-conversation`),

  // HR
  hrList:    (job_id) => api.get(`/hr/applications${job_id ? `?job_id=${job_id}` : ""}`, "hr"),
  hrCandidates: () => api.get("/hr/candidates", "hr"),
  createCandidate: (data) => api.post("/hr/candidates", data, "hr"),
  deleteCandidate: (id) => api.delete(`/hr/candidates/${id}`, "hr"),
  hrResumes: () => api.get("/hr/resumes", "hr"),
  uploadCandidateResume: (id, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.upload(`/hr/candidates/${id}/resume`, fd, "hr");
  },
  updateStage: (id, data) => api.patch(`/hr/applications/${id}/stage`, data, "hr"),
  hrCompanyMessages: () => api.get("/hr/company-messages", "hr"),
  hrCompanyMessage: (id) => api.get(`/hr/company-messages/${id}`, "hr"),
  hrReplyCompanyMessage: (id, message) => api.post(`/hr/company-messages/${id}/messages`, { message }, "hr"),
};

// â”€â”€â”€ Interviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const interviewsApi = {
  myInterviews: () => api.get("/applicant/interviews"),
  hrList:       () => api.get("/hr/interviews", "hr"),
  hrGet:       (id) => api.get(`/hr/interviews/${id}`, "hr"),
  schedule:    (data) => api.post("/hr/interviews", data, "hr"),
  update:      (id, data) => api.patch(`/hr/interviews/${id}`, data, "hr"),
  delete:      (id) => api.delete(`/hr/interviews/${id}`, "hr"),
  saveNotes:   (id, data) => api.put(`/hr/interviews/${id}/notes`, data, "hr"),
  sendFeedback:(id) => api.post(`/hr/interviews/${id}/feedback`, {}, "hr"),
};

// â”€â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const notificationsApi = {
  list:          () => api.get("/applicant/notifications"),
  markRead:      (id) => api.patch(`/applicant/notifications/${id}/read`),
  markAllRead:   () => api.patch("/applicant/notifications/mark-all-read"),
  delete:        (id) => api.delete(`/applicant/notifications/${id}`),
  hrList:       () => api.get("/hr/notifications", "hr"),
  hrMarkRead:   (id) => api.patch(`/hr/notifications/${id}/read`, {}, "hr"),
  hrMarkAllRead: () => api.patch("/hr/notifications/mark-all-read", {}, "hr"),
  hrDelete:     (id) => api.delete(`/hr/notifications/${id}`, "hr"),
};

// â”€â”€â”€ Dashboard / Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const dashboardApi = {
  applicant: () => api.get("/applicant/dashboard"),
  hr:        () => api.get("/hr/dashboard", "hr"),
  hrAnalytics: () => api.get("/hr/analytics", "hr"),
};

// â”€â”€â”€ Talent Pool â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const talentPoolApi = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
    ).toString();
    return api.get(`/company/talent-pool${qs ? `?${qs}` : ""}`, "hr");
  },
  get:    (id) => api.get(`/company/talent-pool/${id}`, "hr"),
  add:    (application_id) => api.post("/company/talent-pool/add", { application_id }, "hr"),
  update: (id, data) => api.patch(`/company/talent-pool/${id}`, data, "hr"),
  remove: (id) => api.delete(`/company/talent-pool/${id}`, "hr"),
};

// â”€â”€â”€ AI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const aiApi = {
  chat: (message, context = {}, portal = "applicant") => api.post("/ai/chat", { message, context }, portal),

  // Applicant-facing
  reviewResume:          () => api.post("/ai/resume-review", {}),
  jobMatching:     (data) => api.post("/ai/job-matching", data),
  coverLetter:     (job_id) => api.post("/ai/cover-letter", { job_id }),
  careerRecommendations: () => api.post("/ai/career-recommendations", {}),

  // HR-facing suite (server-side generation)
  jobDescription:   (data) => api.post("/ai/job-description", data, "hr"),
  resumeAnalysis:   (data) => api.post("/ai/resume-analysis", data, "hr"),
  candidateFit:     (data) => api.post("/ai/candidate-fit", data, "hr"),
  interviewSummary: (data) => api.post("/ai/interview-summary", data, "hr"),
  offerGenerator:   (data) => api.post("/ai/offer-generator", data, "hr"),
};

// â”€â”€â”€ HR Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const hrUsersApi = {
  list:   () => api.get("/hr/users", "hr"),
  create: (data) => api.post("/hr/users", data, "hr"),
  update: (id, data) => api.put(`/hr/users/${id}`, data, "hr"),
  delete: (id) => api.delete(`/hr/users/${id}`, "hr"),
};


// â”€â”€â”€ HR Projects / Roles / Employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const hrProjectsApi = {
  list:   () => api.get("/hr/projects", "hr"),
  companies: () => api.get("/hr/companies", "hr"),
  get:    (id) => api.get(`/hr/projects/${id}`, "hr"),
  create: (data) => api.post("/hr/projects", data, "hr"),
  update: (id, data) => api.put(`/hr/projects/${id}`, data, "hr"),
  delete: (id) => api.delete(`/hr/projects/${id}`, "hr"),
};

export const hrRolesApi = {
  list:   () => api.get("/hr/roles", "hr"),
  get:    (id) => api.get(`/hr/roles/${id}`, "hr"),
  create: (data) => api.post("/hr/roles", data, "hr"),
  update: (id, data) => api.put(`/hr/roles/${id}`, data, "hr"),
  delete: (id) => api.delete(`/hr/roles/${id}`, "hr"),
};

export const hrEmployeesApi = {
  list:   () => api.get("/hr/employees", "hr"),
  create: (data) => api.post("/hr/employees", data, "hr"),
};

// â”€â”€â”€ Contracts & Offers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const contractsApi = {
  // HR
  sendOffer:    (data) => api.post("/hr/offers/send", data, "hr"),
  sendContract: (data) => api.post("/hr/contracts/send", data, "hr"),
  hrList:       () => api.get("/hr/contracts", "hr"),
  hrGet:        (id) => api.get(`/hr/contracts/${id}`, "hr"),
  hrDelete:     (id) => api.delete(`/hr/contracts/${id}`, "hr"),

  // Candidate ("My Contracts")
  myContracts:  () => api.get("/applicant/contracts"),
  getMine:      (id) => api.get(`/applicant/contracts/${id}`),
  sign:         (id, signature_name) => api.post(`/applicant/contracts/${id}/sign`, { signature_name }),
  decline:      (id, reason) => api.post(`/applicant/contracts/${id}/decline`, { reason }),
};

// ─── Support Center (candidate + employee) ──────────────────────────────────
// `portal` selects the auth token: "applicant" (candidate) or "hr" (employee).

export const supportApi = {
  myTickets:  (portal) => api.get("/support/tickets", portal),
  unread:     (portal) => api.get("/support/unread-count", portal),
  getTicket:  (id, portal) => api.get(`/support/tickets/${id}`, portal),
  create:     (data, portal) => api.post("/support/tickets", data, portal),
  reply:      (id, message, portal) => api.post(`/support/tickets/${id}/messages`, { message }, portal),
  uploadAttachment: (id, file, portal) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.upload(`/support/tickets/${id}/attachments`, fd, portal);
  },
};

export const twoFactorApi = {
  setApplicant: (enabled) => api.put("/auth/applicant/2fa", { enabled }),
  setHr:        (enabled) => api.put("/auth/hr/2fa", { enabled }, "hr"),
  verifyApplicant: (challenge_token, code) => api.post("/auth/applicant/verify-2fa", { challenge_token, code }),
  verifyHr:        (challenge_token, code) => api.post("/auth/hr/verify-2fa", { challenge_token, code }, "hr"),
};
