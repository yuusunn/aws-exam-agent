import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/apiClient";

type Q = { qId:string; title:string; body:string };

export default function Home() {
  const [q, setQ] = useState<Q | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try { setQ(await apiGet<Q>("/question/current")); }
      catch (e:any) { setErr(e.message ?? "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, []);

  async function subscribe() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setMsg("Please enter a valid email."); return; }
    setSubmitting(true); setMsg("");
    try { await apiPost("/subscribe", { email }); setMsg("Subscribed! Check your inbox."); setEmail(""); }
    catch (e:any) { setMsg(e.message ?? "Subscribe failed"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="prose max-w-xl">
      {/* 試験問題カード */}
      <div className="not-prose mt-4 p-4 border rounded-lg bg-white">
        {loading && <p>Loading question…</p>}
        {err && <p className="text-red-600">{err}</p>}
        {q && (
          <>
            <h3 className="font-semibold">{q.title}</h3>
            <p className="mt-2">{q.body}</p>
          </>
        )}
      </div>

      {/* サブスクリプション */}
      <div className="not-prose mt-6 p-4 border rounded-lg bg-white">
        <label className="block text-sm mb-2">Email</label>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={e=>setEmail(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 flex-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="your@example.com"
          />
          <button
            onClick={subscribe}
            disabled={submitting}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Subscribe"}
          </button>
        </div>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </div>
    </div>
  );
}
