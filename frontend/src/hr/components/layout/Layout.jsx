import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import TopNav from "./TopNav";

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav user={user} onLogout={logout} />
      <main className="px-4 sm:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
