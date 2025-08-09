import { http, HttpResponse } from "msw";

// 開発モードのモックハンドラー
export const handlers = [
  http.post("/api/unsubscribe", async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/question/current", async () => {
    return HttpResponse.json({ qId: "2025-W32", title: "Sample Q", body: "What is CIDR?" });
  }),
];