import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Navbar />
      {/* 画面サイズは各画面に依存 */}
      <main className="px-0">
        <Outlet />
      </main>
    </div>
  );
}
