import fs from "fs";
import path from "path";

// qId 生成規則：更新日時から日付を抽出し、形式は YYYY-MM-DD-XX
// 例: 2025-08-11-01
function makeQid(index, iso) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}-${String(index + 1).padStart(2, "0")}`;
}

// title 生成規則：内容を24文字に切り詰め、必要なら省略記号を追加
function makeTitle(body) {
  const trimmed = body.replace(/\s+/g, " ").trim();
  const t = trimmed.slice(0, 24);
  return t + (trimmed.length > 24 ? "…" : "");
}

const SRC = process.argv[2] || "source-questions.json";
// questions.json エクスポート先（上書き）
const DEST = process.argv[3] || "infra/lib/seed/questions.json";

const raw = JSON.parse(fs.readFileSync(SRC, "utf-8"));

if (!Array.isArray(raw)) {
  throw new Error("Source must be an array");
}

const out = raw.map((item, idx) => {
  const body = item["内容"];
  const choices = item["選択肢"] || [];
  const correctAnswer = item["正解"];
  const tags = item["タグ"] || [];
  const publishedAt = item["更新日時"];
  if (!body || !publishedAt) {
    throw new Error(`Missing 内容 or 更新日時 at index ${idx}`);
  }
  return {
    qId: makeQid(idx, publishedAt),
    title: makeTitle(body),
    body,
    choices,
    correctAnswer,
    tags,
    publishedAt
  };
});

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, JSON.stringify(out, null, 2), "utf-8");
console.log(`Wrote ${out.length} questions to ${DEST}`);
