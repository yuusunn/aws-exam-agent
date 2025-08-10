import { Outlet, Link, useNavigate } from "react-router-dom";
import { isSignedIn, logout } from "./services/auth";

export default function App() {
  const nav = useNavigate();
  const signedIn = isSignedIn();

  async function handleLogout() {
    await logout();
    nav("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-4">
          <Link to="/" className="font-semibold">TAM Project</Link>
          <div className="ml-auto flex gap-3 items-center">
            <Link to="/" className="hover:underline">ホーム</Link>
            <Link to="/dashboard" className="hover:underline">ダッシュボード</Link>
            {!signedIn && <Link to="/login" className="hover:underline">Login</Link>}
            {signedIn && (
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}