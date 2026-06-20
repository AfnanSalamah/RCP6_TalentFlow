import { BASE } from '../../api/client';

function getToken() {
  // Prefer the dedicated SA token; fall back to a super_admin HR token
  // (the backend accepts an hr-typed super_admin token on all /super-admin/* routes).
  return localStorage.getItem('tf_sa_token') || localStorage.getItem('tf_hr_token');
}

async function req(method, path, body, isJson = true) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (isJson && body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isJson ? JSON.stringify(body) : body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export const saApi = {
  // Auth
  login: (email, password) => req('POST', '/super-admin/auth/login', { email, password }),
  verifyOtp: (challenge_token, code) => req('POST', '/super-admin/auth/verify-otp', { challenge_token, code }),
  me: () => req('GET', '/super-admin/profile'),
  updateProfile: (data) => req('PUT', '/super-admin/profile', data),
  changePassword: (data) => req('PUT', '/super-admin/password', data),
  changeEmail: (email) => req('PUT', '/super-admin/email', { email }),
  set2FA: (enabled) => req('PUT', '/super-admin/2fa', { enabled }),
  loginHistory: () => req('GET', '/super-admin/login-history'),
  accountActivity: () => req('GET', '/super-admin/activity'),
  uploadAvatar: (file) => { const fd = new FormData(); fd.append('file', file); return req('POST', '/super-admin/profile/avatar', fd, false); },

  // Dashboard
  dashboard: () => req('GET', '/super-admin/dashboard'),

  // Companies
  listCompanies: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/super-admin/companies${q ? '?' + q : ''}`);
  },
  createCompany: (data) => req('POST', '/super-admin/companies', data),
  getCompany: (id) => req('GET', `/super-admin/companies/${id}`),
  updateCompany: (id, data) => req('PUT', `/super-admin/companies/${id}`, data),
  suspendCompany: (id) => req('POST', `/super-admin/companies/${id}/suspend`),
  reactivateCompany: (id) => req('POST', `/super-admin/companies/${id}/reactivate`),
  deleteCompany: (id, hardDelete = false) => req('DELETE', `/super-admin/companies/${id}${hardDelete ? '?hard_delete=true' : ''}`),
  restoreCompany: (id) => req('POST', `/super-admin/companies/${id}/restore`),
  updateSubscription: (id, data) => req('POST', `/super-admin/companies/${id}/subscription`, data),
  alertCompany: (id, data) => req('POST', `/super-admin/companies/${id}/alert`, data),
  checkCompanyRegistration: (data) => req('POST', '/super-admin/companies/check-registration', data),

  // Plans
  getPlans: () => req('GET', '/super-admin/plans'),

  // Users
  listUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/super-admin/users${q ? '?' + q : ''}`);
  },
  createHrUser: (data) => req('POST', '/super-admin/users/hr', data),
  createApplicant: (data) => req('POST', '/super-admin/users/applicants', data),
  disableUser: (id, accountType = 'employee') => req('POST', `/super-admin/users/${id}/disable?account_type=${encodeURIComponent(accountType)}`),
  enableUser: (id, accountType = 'employee') => req('POST', `/super-admin/users/${id}/enable?account_type=${encodeURIComponent(accountType)}`),
  resetPassword: (id, new_password, accountType = 'employee') => req('POST', `/super-admin/users/${id}/reset-password?account_type=${encodeURIComponent(accountType)}`, { new_password }),

  // Tickets
  listTickets: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/super-admin/tickets${q ? '?' + q : ''}`);
  },
  createTicket: (data) => req('POST', '/super-admin/tickets', data),
  getTicket: (id) => req('GET', `/super-admin/tickets/${id}`),
  replyTicket: (id, message) => req('POST', `/super-admin/tickets/${id}/reply`, { message }),
  updateTicketStatus: (id, status) => req('PUT', `/super-admin/tickets/${id}/status`, { status }),

  // Support Center (candidate / employee tickets)
  supportTickets: (status = '') => req('GET', `/super-admin/support/tickets${status ? '?status_filter=' + encodeURIComponent(status) : ''}`),
  supportUnread: () => req('GET', '/super-admin/support/unread-count'),
  supportGet: (id) => req('GET', `/super-admin/support/tickets/${id}`),
  supportReply: (id, message) => req('POST', `/super-admin/support/tickets/${id}/messages`, { message }),
  supportSetStatus: (id, status) => req('PUT', `/super-admin/support/tickets/${id}/status`, { status }),

  // Settings
  getSettings: () => req('GET', '/super-admin/settings'),
  updateSettings: (data) => req('PUT', '/super-admin/settings', data),

  // Notification Center
  listNotifications: () => req('GET', '/super-admin/notifications'),
  createNotification: (data) => req('POST', '/super-admin/notifications', data),
  markNotificationRead: (id) => req('PUT', `/super-admin/notifications/${id}/read`),
  deleteNotification: (id) => req('DELETE', `/super-admin/notifications/${id}`),

  // Announcements
  listAnnouncements: () => req('GET', '/super-admin/announcements'),
  createAnnouncement: (data) => req('POST', '/super-admin/announcements', data),
  deleteAnnouncement: (id) => req('DELETE', `/super-admin/announcements/${id}`),

  // AI Usage
  getAIUsage: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/super-admin/ai-usage${q ? '?' + q : ''}`);
  },

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(filtered).toString();
    return req('GET', `/super-admin/audit-logs${q ? '?' + q : ''}`);
  },

  // Legacy aliases
  aiUsage: () => req('GET', '/super-admin/ai-usage'),
  auditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/super-admin/audit-logs${q ? '?' + q : ''}`);
  },

  // Email Center
  emailTemplates: () => req('GET', '/super-admin/email-center/templates'),
  emailVariables: () => req('GET', '/super-admin/email-center/variables'),
  emailLogs: () => req('GET', '/super-admin/email-center/logs'),
  previewEmailTemplate: (key, variables = {}, mobile = false) => req('POST', `/super-admin/email-center/templates/${key}/preview`, { variables, mobile }),
  updateEmailTemplate: (key, data) => req('PUT', `/super-admin/email-center/templates/${key}`, data),
  duplicateEmailTemplate: (key) => req('POST', `/super-admin/email-center/templates/${key}/duplicate`),
  sendTestEmail: (key, to_email, variables = {}) => req('POST', `/super-admin/email-center/templates/${key}/test`, { to_email, variables }),
};
