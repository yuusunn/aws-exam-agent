import { Link, useLocation, useNavigate } from "react-router-dom";
import { isSignedIn, logout } from "../services/auth";

export default function Navbar() {
  const loc = useLocation();
  const nav = useNavigate();
  const signedIn = isSignedIn();

  const isActive = (path: string) =>
    loc.pathname === path ? "opacity-100" : "opacity-70 hover:opacity-100";

  async function onLogout() {
    await logout();
    nav("/", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-screen-2xl px-4 h-14 flex items-center justify-between text-black">
        <Link to="/" className="font-semibold text-purple-800/70">
          One-Question-a-Day
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/" className={`text-black hover:underline ${isActive("/")}`}>Home</Link>
          <Link to="/dashboard" className={`text-black hover:underline ${isActive("/dashboard")}`}>Dashboard</Link>
          {!signedIn && <Link to="/login" className={`text-black hover:underline ${isActive("/login")}`}>Login</Link>}

          {signedIn && (
            <button
              onClick={onLogout}
              className="px-3 py-1 rounded hover:bg-gray-200/50 transition"
              title="Logout"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
