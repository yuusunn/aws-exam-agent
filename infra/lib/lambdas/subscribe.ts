import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { createHash } from 'crypto';
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

    await ddb.send(
      new PutItemCommand({
        TableName: USERS_TABLE,
        Item: marshall(
          {
            userId,
            email,
            status: "active",
            createdAt: new Date().toISOString(),
          },
          { removeUndefinedValues: true }
        ),
      })
    );

    return ok({ ok: true });
  } catch (e) {
    console.error("subscribe error", e);
    return bad(500, "subscribe failed");
  }
};
