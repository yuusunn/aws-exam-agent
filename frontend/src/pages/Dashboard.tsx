import { logout } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();

  async function handleLogout() {
    await logout();
    nav("/", { replace: true });
  }

  return (
    <div className="prose">
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard.</p>
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded bg-red-600 text-white mt-4"
      >
        Logout
      </button>
    </div>
  );
}
