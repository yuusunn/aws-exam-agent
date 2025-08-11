// infra/lib/lambdas/unsubscribe.ts
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { createHash } from "crypto";
import { ok, bad, CORS } from "./_http";

const ddb = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: any) => {
  // CORS対応
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");
    if (!email) return bad(400, "email required");

    const userId =
      "u_" + createHash("sha256").update(email).digest("hex").slice(0, 16);

    // ユーザー存在しない場合は更新しない、404を返却
    await ddb.send(
      new UpdateItemCommand({
        TableName: USERS_TABLE,
        Key: { userId: { S: userId } },
        UpdateExpression: "SET #s = :u",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":u": { S: "unsubscribed" } },
        ConditionExpression: "attribute_exists(userId)", // strictly check if user exists
      })
    );

    return ok({ ok: true });
  } catch (e: any) {
    const msg = String(e?.name || e?.message || "");
    if (msg.includes("ConditionalCheckFailed")) {
      // User not found
      return bad(404, "user not found");
    }
    console.error("unsubscribe error", e);
    return bad(500, "unsubscribe failed");
  }
};
