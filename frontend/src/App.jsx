import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider as HRAuthProvider, useAuth as useHRAuth } from "./hr/context/AuthContext";
import { AuthProvider as UserAuthProvider, useAuth as useUserAuth } from "./user/context/AuthContext";
import { SAAuthProvider, useSAAuth } from "./super-admin/context/AuthContext";
import { ROUTE_PERMISSIONS } from "./hr/rbac/rbacConfig";

// Super Admin pages
import SADashboard  from "./super-admin/pages/Dashboard";
import SACompanies  from "./super-admin/pages/Companies";
import SACompanyDetail from "./super-admin/pages/CompanyDetail";
import SASubscriptions from "./super-admin/pages/Subscriptions";
import SAUsers      from "./super-admin/pages/Users";
import SATickets    from "./super-admin/pages/Tickets";
import SAAnnouncements from "./super-admin/pages/Announcements";
import SAAIUsage    from "./super-admin/pages/AIUsage";
import SAAuditLogs  from "./super-admin/pages/AuditLogs";
import SAProfile    from "./super-admin/pages/Profile";
import SASettings   from "./super-admin/pages/Settings";
import SANotifications from "./super-admin/pages/NotificationCenter";
import SASupport     from "./super-admin/pages/Support";
import SAEmailCenter from "./super-admin/pages/EmailCenter";

import LandingPage from "./hr/pages/LandingPage";
import LoginPage from "./hr/pages/LoginPage";
import CompanyRegister from "./hr/pages/CompanyRegister";
import AccessDenied from "./hr/pages/AccessDenied";

import HRLayout from "./hr/components/layout/Layout";
import HRDashboard from "./hr/pages/Dashboard";
import HRProjects from "./hr/pages/Projects";
import HRProjectDetail from "./hr/pages/ProjectDetail";
import HRRoles from "./hr/pages/Roles";
import HRRoleDetail from "./hr/pages/RoleDetail";
import HRCandidates from "./hr/pages/Candidates";
import HRResumeCenter from "./hr/pages/ResumeCenter";
import HRInterviews from "./hr/pages/Interviews";
import HRInterviewDetail from "./hr/pages/InterviewDetail";
import HRInterviewScheduler from "./hr/pages/InterviewScheduler";
import HRPipeline from "./hr/pages/Pipeline";
import HRTalentPool from "./hr/pages/TalentPool";
import HRTalentPoolDetail from "./hr/pages/TalentPoolDetail";
import HRAIAssistant from "./hr/pages/AIAssistant";
import HROfferGenerator from "./hr/pages/OfferGenerator";
import HRAnalytics from "./hr/pages/Analytics";
import HRSettings from "./hr/pages/Settings";
import HRContractManagement from "./hr/pages/ContractManagement";
import HRUserManagement from "./hr/pages/UserManagement";
import HRUserProfile from "./hr/pages/UserProfile";
import HREmployeeDirectory from "./hr/pages/EmployeeDirectory";
import HRCompanyMessages from "./hr/pages/CompanyMessages";
import HRNotifications from "./hr/pages/Notifications";

import UserDashboard from "./user/pages/Dashboard";
import UserJobListings from "./user/pages/JobListings";
import UserJobDetails from "./user/pages/JobDetails";
import UserApplicationSuccess from "./user/pages/ApplicationSuccess";
import UserMyApplications from "./user/pages/MyApplications";
import UserApplicationDetails from "./user/pages/ApplicationDetails";
import UserProfile from "./user/pages/Profile";
import MyContracts from "./user/pages/MyContracts";
import UserSupport from "./user/pages/Support";
import HRSupport from "./hr/pages/Support";
import UserNotifications from "./user/pages/Notifications";
import UserAIAssistant from "./user/pages/AIAssistant";
import UserSettings from "./user/pages/Settings";
import ForgotPassword from "./user/pages/ForgotPassword";
import ResetPassword from "./user/pages/ResetPassword";
import VerifyEmail from "./user/pages/VerifyEmail";

import "./user/styles/globals.scoped.css";
import "./App.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * PublicRoute — guards /login and /register.
 *
 * Only redirects away when the user is a confirmed HR session (role === "hr").
 * User-portal sessions (role === "user") are intentionally NOT redirected here
 * because the user-portal login flow does not write to the HR auth context.
 * Redirecting "user" role sessions would trap the user in the portal with no
 * way to log out and return to the HR login page.
 */
function PublicRoute({ children }) {
  const { user } = useHRAuth();
  if (user?.hrRole === "super_admin") return <Navigate to="/super-admin/dashboard" replace />;
  if (user?.role === "hr") return <Navigate to="/hr/dashboard" replace />;
  return children;
}

/**
 * RootPage (landing page at /).
 *
 * Redirects confirmed HR sessions directly to the dashboard so they don't
 * have to navigate through the landing page every time. User-portal sessions
 * see the landing page as normal since they may want to browse before logging in.
 */
function RootPage() {
  const { user } = useHRAuth();
  if (user?.hrRole === "super_admin") return <Navigate to="/super-admin/dashboard" replace />;
  if (user?.role === "hr") return <Navigate to="/hr/dashboard" replace />;
  return <LandingPage />;
}

/** Outer layout guard — confirms HR auth only. */
function ProtectedHRLayout() {
  const { user } = useHRAuth();
  if (!user)              return <Navigate to="/" replace />;
  // The platform owner's home is the dedicated Super Admin portal, not the HR portal.
  if (user.hrRole === "super_admin") return <Navigate to="/super-admin/dashboard" replace />;
  if (user.role !== "hr") return <Navigate to="/user/jobs" replace />;
  return <HRLayout />;
}

/**
 * Per-route role guard.
 * Resolves the most specific ROUTE_PERMISSIONS entry for `routePath`
 * and renders AccessDenied if the user's hrRole is not allowed.
 */
function RoleRoute({ routePath, element }) {
  const { user } = useHRAuth();
  const hrRole   = user?.hrRole ?? "admin";

  // Platform owner controls the entire site — always allowed.
  if (hrRole === "super_admin") return element;

  const matchingKey = Object.keys(ROUTE_PERMISSIONS)
    .filter((key) => routePath.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];

  const allowed = matchingKey ? ROUTE_PERMISSIONS[matchingKey] : null;

  if (allowed && !allowed.includes(hrRole)) return <AccessDenied />;
  return element;
}

// ── Super Admin portal ────────────────────────────────────────────────────────

function SAAuthGate({ children }) {
  const { isAuthenticated, loading } = useSAAuth();
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#001D39" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "#7BBDE8", animation: "spin 0.75s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  // No dedicated Super Admin login page — the platform owner signs in through the
  // unified /login. Unauthenticated access to /super-admin/* is sent there.
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function SuperAdminRoutes() {
  return (
    <SAAuthProvider>
      <Routes>
        <Route path="*" element={
          <SAAuthGate>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"     element={<SADashboard />} />
              <Route path="companies"     element={<SACompanies />} />
              <Route path="companies/:id" element={<SACompanyDetail />} />
              <Route path="subscriptions" element={<SASubscriptions />} />
              <Route path="users"         element={<SAUsers />} />
              <Route path="tickets"       element={<SATickets />} />
              <Route path="announcements" element={<SAAnnouncements />} />
              <Route path="ai-usage"      element={<SAAIUsage />} />
              <Route path="audit-logs"    element={<SAAuditLogs />} />
              <Route path="profile"       element={<SAProfile />} />
              <Route path="settings"      element={<SASettings />} />
              <Route path="notifications" element={<SANotifications />} />
              <Route path="support"       element={<SASupport />} />
              <Route path="email-center"  element={<SAEmailCenter />} />
              <Route path="*"             element={<Navigate to="dashboard" replace />} />
            </Routes>
          </SAAuthGate>
        } />
      </Routes>
    </SAAuthProvider>
  );
}

// ── User portal ───────────────────────────────────────────────────────────────

/**
 * UserAuthGate
 * ────────────
 * Sits INSIDE <UserAuthProvider> so it can read the auth context.
 * Three states:
 *
 *  loading = true  → token exists but user profile not yet hydrated.
 *                    Show a full-screen spinner — never let the protected
 *                    page render with user = null.
 *
 *  !isAuthenticated → no valid session. Redirect to /login.
 *
 *  isAuthenticated  → session confirmed, render children normally.
 *
 * This is the single authoritative guard for every /user/* route.
 * No individual page component needs its own auth check.
 */
function UserAuthGate({ children }) {
  const { user, isAuthenticated, loading } = useUserAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100vh", gap: 16,
        background: "linear-gradient(135deg, #001D39 0%, #0A4174 52%, #4E8EA2 100%)",
      }}>
        {/* Animated ring spinner — pure CSS, no extra dependency */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: "4px solid rgba(255,255,255,0.25)",
          borderTopColor: "#fff",
          animation: "spin 0.75s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 15, margin: 0 }}>
          Loading your dashboard…
        </p>
        {/* Inline keyframes so no extra CSS file is needed */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function UserPortalRoutes() {
  return (
    <UserAuthProvider>
      <UserAuthGate>
        <div className="user-portal">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"         element={<UserDashboard />} />
            <Route path="jobs"              element={<UserJobListings />} />
            <Route path="jobs/:id"          element={<UserJobDetails />} />
            <Route path="apply/success"     element={<UserApplicationSuccess />} />
            <Route path="applications"      element={<UserMyApplications />} />
            <Route path="applications/:id"  element={<UserApplicationDetails />} />
            <Route path="profile"           element={<UserProfile />} />
            <Route path="contracts"         element={<MyContracts />} />
            <Route path="support"           element={<UserSupport />} />
            <Route path="notifications"     element={<UserNotifications />} />
            <Route path="ai-assistant"      element={<UserAIAssistant />} />
            <Route path="settings"          element={<UserSettings />} />
            <Route path="*"                 element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </UserAuthGate>
    </UserAuthProvider>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <HRAuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"                  element={<RootPage />} />
          <Route path="/login"             element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register"          element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register-company"  element={<PublicRoute><CompanyRegister /></PublicRoute>} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/reset-password"    element={<ResetPassword />} />
          <Route path="/verify-email"      element={<VerifyEmail />} />

          {/* Super Admin portal */}
          <Route path="/super-admin/*" element={<SuperAdminRoutes />} />

          {/* User portal */}
          <Route path="/user/*" element={<UserPortalRoutes />} />

          {/* HR portal — outer layout guard first, then per-route role checks */}
          <Route element={<ProtectedHRLayout />}>
            <Route path="/hr/dashboard"
              element={<RoleRoute routePath="/hr/dashboard"      element={<HRDashboard />} />} />

            <Route path="/hr/projects"
              element={<RoleRoute routePath="/hr/projects"       element={<HRProjects />} />} />
            <Route path="/hr/projects/:id"
              element={<RoleRoute routePath="/hr/projects"       element={<HRProjectDetail />} />} />

            <Route path="/hr/roles"
              element={<RoleRoute routePath="/hr/roles"          element={<HRRoles />} />} />
            <Route path="/hr/roles/:id"
              element={<RoleRoute routePath="/hr/roles"          element={<HRRoleDetail />} />} />

            <Route path="/hr/candidates"
              element={<RoleRoute routePath="/hr/candidates"     element={<HRCandidates />} />} />

            <Route path="/hr/resume-center"
              element={<RoleRoute routePath="/hr/resume-center"  element={<HRResumeCenter />} />} />

            <Route path="/hr/interviews"
              element={<RoleRoute routePath="/hr/interviews"     element={<HRInterviews />} />} />
            <Route path="/hr/interviews/:candidateId"
              element={<RoleRoute routePath="/hr/interviews"     element={<HRInterviewDetail />} />} />

            <Route path="/hr/scheduling"
              element={<RoleRoute routePath="/hr/scheduling"     element={<HRInterviewScheduler />} />} />

            <Route path="/hr/pipeline"
              element={<RoleRoute routePath="/hr/pipeline"       element={<HRPipeline />} />} />

            <Route path="/hr/talent-pool"
              element={<RoleRoute routePath="/hr/talent-pool"    element={<HRTalentPool />} />} />
            <Route path="/hr/talent-pool/:id"
              element={<RoleRoute routePath="/hr/talent-pool"    element={<HRTalentPoolDetail />} />} />

            <Route path="/hr/ai-assistant"
              element={<RoleRoute routePath="/hr/ai-assistant"   element={<HRAIAssistant />} />} />

            <Route path="/hr/offer-generator"
              element={<RoleRoute routePath="/hr/offer-generator" element={<HROfferGenerator />} />} />

            <Route path="/hr/analytics"
              element={<RoleRoute routePath="/hr/analytics"      element={<HRAnalytics />} />} />

            <Route path="/hr/contracts"
              element={<RoleRoute routePath="/hr/contracts"      element={<HRContractManagement />} />} />

            {/* Profile — all HR roles */}
            <Route path="/hr/profile"
              element={<RoleRoute routePath="/hr/profile"        element={<HRUserProfile />} />} />

            {/* Support Center — available to every employee role */}
            <Route path="/hr/support" element={<HRSupport />} />
            <Route path="/hr/company-messages"
              element={<RoleRoute routePath="/hr/company-messages" element={<HRCompanyMessages />} />} />
            <Route path="/hr/notifications" element={<HRNotifications />} />

            {/* Employee Directory — admin + hr_manager */}
            <Route path="/hr/directory"
              element={<RoleRoute routePath="/hr/directory"      element={<HREmployeeDirectory />} />} />

            {/* Admin-only routes */}
            <Route path="/hr/users"
              element={<RoleRoute routePath="/hr/users"          element={<HRUserManagement />} />} />
            <Route path="/hr/settings"
              element={<RoleRoute routePath="/hr/settings"       element={<HRSettings />} />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HRAuthProvider>
    </BrowserRouter>
  );
}
