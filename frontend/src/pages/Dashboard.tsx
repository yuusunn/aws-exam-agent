import { useEffect, useMemo, useState } from "react";
import { useNavigate} from "react-router-dom";
import { logout } from "../services/auth";
import { apiGet } from "../services/apiClient";

type Q = {
  qId: string;
  title?: string;
  body?: string;
  tags?: string[];
  choices?: string[];
  publishedAt?: string;
};

export default function Dashboard() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiGet<Q[]>("/questions?limit=50");
      setRows(data);
      if (!selectedId && data.length) setSelectedId(data[0].qId);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */ 
  }, []);
  const selected = useMemo(() => rows.find((q) => q.qId === selectedId) || null, [rows, selectedId]);

  async function handleLogout() {
    await logout();
    nav("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* 中央揃え（3：7） */}
      <main className="mx-auto max-w-screen-2xl px-4 py-6 grid md:grid-cols-[30%_70%] gap-6">
        {/* 左側：アカウント・問題リスト */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Account</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded hover:bg-gray-200/50 transition"
                >
                  Logout
                </button>
                <button
                  onClick={load}
                  disabled={loading}
                  className="px-3 py-1 rounded hover:bg-gray-200/50 transition disabled:opacity-60"
                >
                  {loading ? "Loading…" : "Reload"}
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              ログイン中。下の問題リストから問題を選んでください。
            </p>
          </div>

          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-50">
              <h3 className="text-sm font-semibold">Questions</h3>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              {err && <p className="p-4 text-sm text-red-600">{err}</p>}
              {!err && rows.length === 0 && !loading && (
                <p className="p-4 text-sm text-gray-700">No questions.</p>
              )}
              {rows.map((q) => {
                return (
                    <button
                      key={q.qId}
                      onClick={() => setSelectedId(q.qId)}
                      className="w-full text-left px-4 py-3 border-b last:border-b-0 transition hover:bg-gray-200/50 transition"

                    >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-1">{q.title ?? "(untitled)"}</span>
                      <span className="shrink-0 text-xs text-gray-500">{q.publishedAt?.slice(0, 10) ?? "-"}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-700 line-clamp-2">{q.body}</div>
                    {!!q.tags?.length && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {q.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-block rounded-full border px-2 py-0.5 text-[11px] text-gray-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* 右側：問題文 */}
        <section>
          <div className="rounded-lg border bg-white p-6 shadow-sm min-h-[70vh]">
            {loading && <p>Loading…</p>}
            {!loading && selected && (
              <article className="prose max-w-none">
                <h2 className="mt-0">{selected.title ?? "Question"}</h2>
                <p className="text-gray-800">{selected.body}</p>

                {!!selected.choices?.length && (
                  <div className="not-prose mt-4">
                    <h4 className="text-sm font-semibold mb-2">Choices</h4>
                    <ul className="space-y-2">
                      {selected.choices.map((c, i) => (
                        <li key={i} className="rounded border px-3 py-2 hover:bg-gray-50">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="not-prose mt-6 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span className="font-mono bg-gray-50 border px-2 py-0.5 rounded">{selected.qId}</span>
                  {selected.tags?.map((t) => (
                    <span key={t} className="rounded-full border px-2 py-0.5 text-gray-600">#{t}</span>
                  ))}
                </div>
              </article>
            )}
            {!loading && !selected && !err && <p>No selection.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}