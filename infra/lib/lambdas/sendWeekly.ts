import { DynamoDBClient, ScanCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const ddb = new DynamoDBClient({});
const ses = new SESClient({});
const USERS_TABLE = process.env.USERS_TABLE!;
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE!;
const APP_URL = process.env.APP_URL!;
const SES_FROM = process.env.SES_FROM!;

export const handler = async () => {
  const usersRes = await ddb.send(new ScanCommand({
    TableName: USERS_TABLE,
    FilterExpression: '#s = :a',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':a': { S: 'active' } },
  }));
  const usersRaw = (usersRes.Items ?? []) as Record<string, AttributeValue>[];
  const users = usersRaw.map((it) => unmarshall(it)) as { email: string }[];

  const qRes = await ddb.send(new ScanCommand({ TableName: QUESTIONS_TABLE }));
  const qsRaw = (qRes.Items ?? []) as Record<string, AttributeValue>[];
  const qs = qsRaw.map((it) => unmarshall(it)) as any[];

  qs.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const q = qs[0];
  if (!q) return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };

  let sent = 0;
  for (const u of users) {
    const unsub = `${APP_URL}/unsubscribe?email=${encodeURIComponent(u.email)}`;
    await ses.send(new SendEmailCommand({
      Source: SES_FROM,
      Destination: { ToAddresses: [u.email] },
      Message: {
        Subject: { Data: `Weekly question: ${q.title}` },
        Body: { Html: { Data:
          `<p>${q.body}</p><p><a href="${APP_URL}">Open app</a></p><hr/><p><a href="${unsub}">Unsubscribe</a></p>` } }
      }
    }));
    sent++;
  }
  return { statusCode: 200, body: JSON.stringify({ sent }) };
};
