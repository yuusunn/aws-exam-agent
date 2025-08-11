// infra/lib/lambdas/sendWeekly.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient, ScanCommand, AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ok, bad, CORS } from "./_http";

const ses = new SESClient({});
const ddb = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE!;
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE!;
const SES_FROM = process.env.SES_FROM; // e.g. "<no-reply@yourdomain.com>"
const APP_URL = process.env.APP_URL || "https://example.com"; // サブスクリプション解除URL

// Questionsから最新の1問を取得（Scan + sortで処理する）
// TODO: 今後GSIで最新の問題を効率的に取れるようにする
async function getLatestQuestion() {
  const res = await ddb.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));
  const items = (res.Items ?? []).map((i) => unmarshall(i) as any);
  items.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  return items[0] ?? null;
}

// 全てのアクティブユーザーを取得（フルスキャン）
async function getActiveUsers(): Promise<{ email: string }[]> {
  let lastKey: Record<string, AttributeValue> | undefined;
  const out: { email: string }[] = [];

  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: USERS_TABLE,
        ExclusiveStartKey: lastKey,
        // statusでフィルタリング（activeまたはstatusがないユーザー）
        FilterExpression: "#s = :active OR attribute_not_exists(#s)",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":active": { S: "active" } },
        ProjectionExpression: "email, #s",
      })
    );
    for (const it of res.Items ?? []) {
      const u = unmarshall(it) as { email?: string; status?: string };
      if (u.email && (u.status === "active" || !("status" in u))) out.push({ email: u.email });
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return out;
}

export const handler = async (event: any) => {
  // CORS対応：ブラウザからのOPTIONSリクエストに対応
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    if (!SES_FROM) return bad(500, "SES_FROM not configured");

    // 1) 最新問題を取得
    const latest = await getLatestQuestion();
    if (!latest) return bad(404, "no question");

    const title = latest.title ?? "Weekly Question";
    const body = latest.body ?? "";
    const qId = latest.qId ?? "";
    const sentAt = new Date().toISOString();

    // 2) アクティブユーザーを取得
    const users = await getActiveUsers();

    let sent = 0;
    let skipped = 0;
    // 3) 各ユーザーにメール送信
    for (const { email } of users) {
      try {
        const unsub = `${APP_URL.replace(/\/$/, "")}/unsubscribe?email=${encodeURIComponent(email)}`;
        const text = [
          `こんにちは！`,
          ``,
          `今週の練習問題は配信しました。ご興味ある方はぜひご確認ください！`,
          `(${qId}): ${title}`,
          ``,
          body,
          ``,
          `サブスクリプション解除： ${unsub}`,
          ``,
          `更新日時： ${sentAt}`,
        ].join("\n");

        await ses.send(
          new SendEmailCommand({
            Destination: { ToAddresses: [email] },
            Source: SES_FROM,
            Message: {
              Subject: { Data: `[One-Question-a-Day] ${title}` },
              Body: { Text: { Data: text } },
            },
          })
        );
        sent++;
      } catch (e) {
        console.error("send to", email, "failed", e);
        skipped++;
      }
    }

    return ok({ sent, skipped, total: users.length, qId, sentAt });
  } catch (e) {
    console.error("sendWeekly error", e);
    return bad(500, "sendWeekly failed");
  }
};
